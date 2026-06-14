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
    if (hex.length == 7) {
      r = parseInt(hex.substring(1, 3), 16);
      g = parseInt(hex.substring(3, 5), 16);
      b = parseInt(hex.substring(5, 7), 16);
    }
    return [r, g, b];
  };

  const primaryRgb = hexToRgb(config.primaryColor);
  const secondaryRgb = hexToRgb(config.secondaryColor);

  // Set font base on layout style
  if (config.layoutStyle === 'classic') {
    doc.setFont("times");
  } else {
    doc.setFont("helvetica");
  }

  // Header Background for modern
  if (config.layoutStyle === 'modern') {
    doc.setFillColor(primaryRgb[0], primaryRgb[1], primaryRgb[2]);
    doc.rect(0, 0, 210, 45, 'F');
  }

  const headerY = config.layoutStyle === 'modern' ? 20 : 20;

  const getBase64ImageFromUrl = async (imageUrl: string): Promise<string> => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.crossOrigin = "Anonymous";
      img.onload = () => {
        const canvas = document.createElement("canvas");
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext("2d");
        if (ctx) {
          ctx.drawImage(img, 0, 0);
          resolve(canvas.toDataURL("image/png"));
        } else {
          reject(new Error("Unable to get canvas context"));
        }
      };
      img.onerror = (e) => reject(e);
      img.src = imageUrl;
    });
  };
  
  // Header Logo/Company
  doc.setFontSize(22);
  if (config.layoutStyle === 'modern') {
    doc.setTextColor(255, 255, 255);
  } else {
    doc.setTextColor(primaryRgb[0], primaryRgb[1], primaryRgb[2]);
  }
  
  let companyY = headerY;
  // Use image if provided
  if (config.logoUrl) {
    try {
      const dataUrl = await getBase64ImageFromUrl(config.logoUrl);
      doc.addImage(dataUrl, "PNG", 14, 10, 30, 30, undefined, 'FAST');
      companyY = 45; // move company text down slightly if logo exists
      doc.setFontSize(16);
      doc.text(config.companyName || "Company Name", 14, companyY);
    } catch(e) {
      console.error("Failed to load invoice logo", e);
      doc.text(config.companyName || "Company Name", 14, companyY);
    }
  } else {
    doc.text(config.companyName || "Company Name", 14, companyY);
  }

  // 'INVOICE' text
  doc.setFontSize(16);
  if (config.layoutStyle === 'modern') {
    doc.setTextColor(255, 255, 255);
  } else {
    doc.setTextColor(secondaryRgb[0], secondaryRgb[1], secondaryRgb[2]);
  }
  doc.text("INVOICE", 150, 20); // fixed pos for "INVOICE"
  
  // Company Address
  doc.setFontSize(10);
  if (config.layoutStyle === 'modern') {
    doc.setTextColor(240, 240, 240);
  } else {
    doc.setTextColor(100);
  }
  const lines = doc.splitTextToSize(config.companyAddress || '', 55);
  doc.text(lines, 150, 27);

  let curY = config.layoutStyle === 'modern' ? 55 : (companyY + 10);

  doc.setFontSize(10);
  doc.setTextColor(100);
  doc.text(`Order Number: ${order.id}`, 14, curY);
  doc.text(`Date: ${new Date(order.createdAt).toLocaleDateString()}`, 14, curY + 5);
  doc.text(`Status: ${order.status}`, 14, curY + 10);
  
  // Client Info
  curY = curY + 20;
  doc.setFontSize(12);
  doc.setTextColor(0);
  doc.text("Billed To:", 14, curY);
  doc.setFontSize(10);
  doc.setTextColor(100);
  doc.text(`Name: ${order.clientName}`, 14, curY + 7);
  doc.text(`Email: ${order.email}`, 14, curY + 12);
  doc.text(`Service: ${order.serviceType}`, 14, curY + 17);

  const tableData: any[][] = [
    [order.serviceType, `LKR ${order.originalPrice !== undefined ? order.originalPrice.toLocaleString() : order.price.toLocaleString()}`]
  ];

  if (order.discountApplied && order.originalPrice) {
    tableData.push([`Special Offer Discount (${order.discountApplied}%)`, `- LKR ${(order.originalPrice - order.price).toLocaleString()}`]);
  }

  curY = curY + 25;

  // Cost Details Table
  autoTable(doc, {
    startY: curY,
    head: [['Description', 'Amount']],
    body: tableData,
    foot: [['Total Paid', `LKR ${order.price.toLocaleString()}`]],
    theme: config.layoutStyle === 'minimal' ? 'plain' : 'grid',
    headStyles: { fillColor: [secondaryRgb[0], secondaryRgb[1], secondaryRgb[2]] as any },
    footStyles: { fillColor: [243, 244, 246] as any, textColor: 0, fontStyle: 'bold' }
  });

  // Footer
  const finalY = (doc as any).lastAutoTable.finalY || 150;
  doc.setFontSize(10);
  doc.setTextColor(150);
  doc.text("Thank you for your business!", 105, finalY + 20, { align: "center" });
  doc.text("If you have any problems, please contact us with your Order Number.", 105, finalY + 25, { align: "center" });

  doc.save(`Invoice_${order.id}.pdf`);
};
