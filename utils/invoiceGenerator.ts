import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Order } from '../types';
import { getInvoiceConfig } from '../services/dataService';

export const downloadInvoice = async (order: Order) => {
  const doc = new jsPDF();
  const config = await getInvoiceConfig();
  
  // Hex to RGB parser for custom colors
  const hexToRgb = (hex: string) => {
    let r = 0, g = 0, b = 0;
    if (hex.length === 7) {
      r = parseInt(hex.substring(1, 3), 16);
      g = parseInt(hex.substring(3, 5), 16);
      b = parseInt(hex.substring(5, 7), 16);
    }
    return [r, g, b];
  };

  const primaryRgb = hexToRgb(config.primaryColor || '#000000');
  const secondaryRgb = hexToRgb(config.secondaryColor || '#666666');

  // Set font base on layout style
  if (config.layoutStyle === 'classic') {
    doc.setFont("times");
  } else {
    doc.setFont("helvetica");
  }

  const getBase64ImageFromUrl = async (imageUrl: string): Promise<string> => {
    const cacheKey = `invoice_logo_cache_${imageUrl}`;
    try {
        const cached = localStorage.getItem(cacheKey);
        if (cached) return cached;
    } catch (e) {
        // ignore storage errors
    }

    const convertToPngIfNeeded = async (dataUrl: string): Promise<string> => {
      if (dataUrl.startsWith('data:image/svg+xml') || imageUrl.toLowerCase().endsWith('.svg')) {
        return new Promise<string>((resolve, reject) => {
          const img = new Image();
          img.crossOrigin = "Anonymous";
          img.onload = () => {
            const canvas = document.createElement("canvas");
            // Scale up for good print quality (approx 1000px wide)
            const scale = 1000 / (img.width || 1000);
            canvas.width = 1000;
            canvas.height = (img.height || 1000) * scale;
            const ctx = canvas.getContext("2d");
            if (ctx) {
              ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
              try {
                resolve(canvas.toDataURL("image/png"));
              } catch (e) {
                resolve(dataUrl); // fallback if CORS taint occurs (unlikely on dataURL)
              }
            } else {
              resolve(dataUrl);
            }
          };
          img.onerror = () => resolve(dataUrl);
          img.src = dataUrl;
        });
      }
      return dataUrl;
    };

    const fetchAsBase64 = async (url: string) => {
      const controller = new AbortController();
      const id = setTimeout(() => controller.abort(), 3000); // 3 second timeout for proxy
      const response = await fetch(url, { signal: controller.signal }); 
      clearTimeout(id);
      if (!response.ok) throw new Error('Network response was not ok');
      const blob = await response.blob();
      return new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(blob);
      });
    };

    const executeFetchFlow = async (): Promise<string> => {
      try {
        const rawBase64 = await fetchAsBase64(imageUrl);
        return await convertToPngIfNeeded(rawBase64);
      } catch (err) {
        // Fallback 1: Try with AllOrigins proxy
        try {
          const rawBase64 = await fetchAsBase64(`https://api.allorigins.win/raw?url=${encodeURIComponent(imageUrl)}`);
          return await convertToPngIfNeeded(rawBase64);
        } catch (err2) {
          // Fallback 2: Try with corsproxy.io
          try {
            const rawBase64 = await fetchAsBase64(`https://corsproxy.io/?${encodeURIComponent(imageUrl)}`);
            return await convertToPngIfNeeded(rawBase64);
          } catch (err3) {
              // Third Fallback: Image object with crossOrigin
              return new Promise<string>((resolve, reject) => {
                const img = new Image();
                img.crossOrigin = "Anonymous";
                img.onload = () => {
                  const canvas = document.createElement("canvas");
                  const scale = 1000 / (img.width || 1000);
                  canvas.width = 1000;
                  canvas.height = (img.height || 1000) * scale;
                  const ctx = canvas.getContext("2d");
                  if (ctx) {
                    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
                    try {
                        resolve(canvas.toDataURL("image/png"));
                    } catch (e) {
                        reject(e); // Security error if tainted
                    }
                  } else {
                    reject(new Error("Unable to get canvas context"));
                  }
                };
                img.onerror = (e) => reject(e);
                img.src = imageUrl;
              });
          }
        }
      }
    };

    const finalBase64 = await executeFetchFlow();
    try {
        localStorage.setItem(cacheKey, finalBase64);
    } catch (e) {
        // Handle max quota exceeded (clear old cache if needed, for simplicity just ignore)
    }
    return finalBase64;
  };
  
  // Create a helper to get image size
  const getImageDimensions = (dataUrl: string): Promise<{w: number, h: number}> => {
      return new Promise((resolve) => {
          const img = new Image();
          img.onload = () => resolve({ w: img.width, h: img.height });
          img.onerror = () => resolve({ w: 0, h: 0 });
          img.src = dataUrl;
      });
  };

  const startY = 15;
  let curY = startY;

  // Header Background for modern
  if (config.layoutStyle === 'modern') {
    doc.setFillColor(primaryRgb[0], primaryRgb[1], primaryRgb[2]);
    doc.rect(0, 0, 210, 60, 'F');
  }

  // Header
  // Right side: INVOICE and Address
  doc.setFontSize(28);
  doc.setFont(config.layoutStyle === 'classic' ? 'times' : 'helvetica', 'bold');
  if (config.layoutStyle === 'modern') {
      doc.setTextColor(255, 255, 255);
  } else {
      doc.setTextColor(primaryRgb[0], primaryRgb[1], primaryRgb[2]); // Match preview style where INVOICE is primary color if not modern
  }
  doc.text("INVOICE", 195, curY + 10, { align: 'right' });
  
  doc.setFont(config.layoutStyle === 'classic' ? 'times' : 'helvetica', 'normal');
  doc.setFontSize(10);
  if (config.layoutStyle === 'modern') {
      doc.setTextColor(240, 240, 240);
  } else {
      doc.setTextColor(71, 85, 105); // gray-600
  }
  const lines = doc.splitTextToSize(config.companyAddress || '123 Example Street\nCity, Country', 60);
  doc.text(lines, 195, curY + 18, { align: 'right' });

  // Left side: Logo or Company Name
  doc.setFontSize(18);
  doc.setFont(config.layoutStyle === 'classic' ? 'times' : 'helvetica', 'bold');
  if (config.layoutStyle === 'modern') {
      doc.setTextColor(255, 255, 255);
  } else {
      doc.setTextColor(0, 0, 0);
  }

  let finalHeaderY = config.layoutStyle === 'modern' ? 60 : (curY + Math.max(30, lines.length * 6) + 10);

  if (config.logoBase64 || config.logoUrl) {
    try {
      let dataUrl = config.logoBase64;
      if (!dataUrl) {
          dataUrl = await getBase64ImageFromUrl(config.logoUrl);
      }
      
      if (dataUrl) {
          const isJpeg = dataUrl.startsWith('data:image/jpeg') || dataUrl.startsWith('data:image/jpg');
          const imgType = isJpeg ? "JPEG" : "PNG";
          const dims = await getImageDimensions(dataUrl);
          
          let renderW = 30;
          let renderH = 30;
          if (dims.w > 0 && dims.h > 0) {
              const aspect = dims.w / dims.h;
              renderH = 22;
              renderW = renderH * aspect;
              if (renderW > 45) {
                  renderW = 45;
                  renderH = renderW / aspect;
              }
          }
          
          doc.addImage(dataUrl, imgType, 14, curY, renderW, renderH, undefined, 'FAST');
          
          if (config.companyName) {
             doc.text(config.companyName, 14, curY + renderH + 8);
          }
          
          if (config.layoutStyle !== 'modern') {
              finalHeaderY = Math.max(finalHeaderY, curY + renderH + 20); 
          }
          
      } else {
          if (config.companyName) doc.text(config.companyName, 14, curY + 12);
      }
    } catch(e) {
      console.error("Failed to load invoice logo", e);
      if (config.companyName) doc.text(config.companyName, 14, curY + 12);
    }
  } else {
    if (config.companyName) doc.text(config.companyName, 14, curY + 12);
  }

  curY = finalHeaderY;

  if (config.layoutStyle !== 'modern') {
      // Draw separation line
      doc.setDrawColor(203, 213, 225); // gray-300
      doc.setLineWidth(0.5);
      doc.line(14, curY, 195, curY);
      curY += 15;
  } else {
      curY += 15; // Adds a bit of padding below the modern header block before Billed To info
  }

  // Second row: Billed To vs Order Details
  const detailsY = curY;
  
  // Left: Billed To
  doc.setFontSize(9);
  doc.setTextColor(100, 116, 139); // gray-500
  doc.text("BILLED TO", 14, curY);
  
  doc.setFontSize(11);
  doc.setTextColor(0, 0, 0);
  doc.setFont(config.layoutStyle === 'classic' ? 'times' : 'helvetica', 'bold');
  doc.text(order.clientName, 14, curY + 6);
  
  doc.setFont(config.layoutStyle === 'classic' ? 'times' : 'helvetica', 'normal');
  doc.setFontSize(10);
  doc.setTextColor(71, 85, 105);
  doc.text(order.email, 14, curY + 11);

  // Right: Order Info
  doc.setFontSize(9);
  doc.setFont(config.layoutStyle === 'classic' ? 'times' : 'helvetica', 'bold');
  doc.setTextColor(100, 116, 139);
  
  doc.text("ORDER NUMBER:", 120, curY);
  doc.text("DATE:", 120, curY + 6);
  doc.text("STATUS:", 120, curY + 12);

  doc.setFont(config.layoutStyle === 'classic' ? 'times' : 'helvetica', 'normal');
  doc.setTextColor(0, 0, 0);
  doc.text(order.id, 160, curY);
  doc.text(new Date(order.createdAt).toLocaleDateString(), 160, curY + 6);
  doc.text(order.status.toUpperCase(), 160, curY + 12);

  curY += 25;

  const tableData: any[][] = [
    [order.serviceType, `LKR ${order.originalPrice !== undefined ? order.originalPrice.toLocaleString() : order.price.toLocaleString()}`]
  ];

  if (order.discountApplied && order.originalPrice) {
    tableData.push([`Special Offer Discount (${order.discountApplied}%)`, `- LKR ${(order.originalPrice - order.price).toLocaleString()}`]);
  }

  // Cost Details Table
  autoTable(doc, {
    startY: curY,
    head: [['Description', 'Amount']],
    body: tableData,
    theme: config.layoutStyle === 'minimal' ? 'plain' : 'grid',
    headStyles: { fillColor: [secondaryRgb[0], secondaryRgb[1], secondaryRgb[2]], textColor: 255, fontStyle: 'bold' },
    bodyStyles: { textColor: 0 },
    columnStyles: { 1: { halign: 'right' } }
  });

  const finalY = (doc as any).lastAutoTable.finalY + 10;
  
  // Total line
  doc.setFontSize(12);
  doc.setFont(config.layoutStyle === 'classic' ? 'times' : 'helvetica', 'bold');
  doc.setTextColor(primaryRgb[0], primaryRgb[1], primaryRgb[2]);
  doc.text("Total Paid", 120, finalY);
  doc.text(`LKR ${order.price.toLocaleString()}`, 195, finalY, { align: 'right' });
  
  doc.setDrawColor(203, 213, 225);
  doc.line(120, finalY - 6, 195, finalY - 6);
  doc.line(120, finalY + 4, 195, finalY + 4);

  // Footer
  doc.setFont(config.layoutStyle === 'classic' ? 'times' : 'helvetica', 'italic');
  doc.setFontSize(10);
  doc.setTextColor(148, 163, 184); // gray-400
  doc.text("Thank you for your business!", 105, finalY + 30, { align: "center" });
  if (order.id) {
     doc.setFont(config.layoutStyle === 'classic' ? 'times' : 'helvetica', 'normal');
     doc.text(`If you have any problems, please contact us with your Order Number.`, 105, finalY + 35, { align: "center" });
  }

  doc.save(`Invoice_${order.id}.pdf`);
};
