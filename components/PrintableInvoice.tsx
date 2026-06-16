import React, { useEffect, useState } from 'react';
import { Order } from '../types';
import { getInvoiceConfig, InvoiceConfig } from '../services/dataService';

export const PrintableInvoice: React.FC<{ order: Order }> = ({ order }) => {
  const [config, setConfig] = useState<InvoiceConfig | null>(null);

  useEffect(() => {
    const fetchConfig = async () => {
      const c = await getInvoiceConfig();
      setConfig(c);
    };
    fetchConfig();
  }, []);

  if (!config) return null;

  return (
    <>
      {/* Reset all dark mode / inverted styles specifically for this container */}
      <style>{`
        @media print {
          html.high-contrast, body, html {
             background: white !important;
             filter: none !important; /* Overrides the dark mode invert */
          }
          body * {
             visibility: hidden;
          }
          #print-invoice, #print-invoice * {
             visibility: visible;
          }
          #print-invoice-container {
             position: absolute !important;
             left: 0;
             top: 0;
             width: 100%;
             margin: 0;
             padding: 0;
             z-index: 999999;
          }
          body, html, #root, body > #root > div, body > #root > div > div {
             position: static !important;
          }
          @page {
             margin: 1cm; /* Let browser handle the size */
          }
        }
      `}</style>
      
      <div id="print-invoice-container" className="hidden print:block print:w-full print:m-0 print:p-0">
        <div id="print-invoice" className="w-full bg-white text-black p-8 mx-auto" style={{ fontFamily: config.layoutStyle === 'classic' ? 'serif' : 'sans-serif' }}>
        <div className="flex justify-between items-start border-b border-gray-300 pb-8 mb-8">
          <div>
            {config.logoUrl ? (
                <img src={config.logoUrl} alt="Logo" className="h-16 object-contain mb-4" style={{ maxWidth: '200px' }} />
            ) : (
                <div className="text-2xl font-bold mb-4">{config.companyName || 'Company Name'}</div>
            )}
            {/* Removed duplicated h1 tag here */}
          </div>
          <div className="text-right">
            <h2 className="text-4xl font-black mb-2 text-gray-800 tracking-widest">INVOICE</h2>
            <p className="text-sm text-gray-600 whitespace-pre-wrap">{config.companyAddress || '123 Example Street\nCity, Country'}</p>
          </div>
        </div>
        
        <div className="flex justify-between mb-12">
          <div className="text-gray-800">
            <p className="font-bold text-sm text-gray-500 uppercase tracking-widest mb-2">Billed To</p>
            <p className="font-bold text-lg">{order.clientName}</p>
            <p className="text-gray-600">{order.email}</p>
          </div>
          <div className="text-right text-gray-800">
            <div className="grid grid-cols-2 gap-x-8 gap-y-2 text-sm">
                <span className="font-bold text-gray-500 uppercase">Order Number:</span>
                <span className="font-mono">{order.id}</span>
                <span className="font-bold text-gray-500 uppercase">Date:</span>
                <span>{new Date(order.createdAt).toLocaleDateString()}</span>
                <span className="font-bold text-gray-500 uppercase">Status:</span>
                <span className="uppercase">{order.status}</span>
            </div>
          </div>
        </div>
        
        <div className="w-full mb-8">
          <div className="flex justify-between p-4 border-b-2 border-gray-800 font-bold text-xs uppercase tracking-widest bg-gray-50">
              <span className="flex-1">Description</span>
              <span className="w-32 text-right">Amount</span>
          </div>
          <div className="flex justify-between p-4 border-b border-gray-200 text-sm">
              <span className="flex-1 font-medium">{order.serviceType}</span>
              <span className="w-32 text-right">LKR {order.originalPrice !== undefined ? order.originalPrice.toLocaleString() : order.price.toLocaleString()}</span>
          </div>
          {order.discountApplied && order.discountApplied > 0 && order.originalPrice && (
              <div className="flex justify-between p-4 border-b border-gray-200 text-sm text-green-700">
                  <span className="flex-1 font-medium">Special Offer Discount ({order.discountApplied}%)</span>
                  <span className="w-32 text-right">- LKR {(order.originalPrice - order.price).toLocaleString()}</span>
              </div>
          )}
        </div>
        
        <div className="flex justify-end mt-8">
          <div className="w-1/2 md:w-1/3">
              <div className="flex justify-between py-4 border-y border-gray-300 font-black text-xl">
                  <span>Total Paid</span>
                  <span>LKR {order.price.toLocaleString()}</span>
              </div>
          </div>
        </div>
        
        <div className="mt-20 pt-8 border-t border-gray-200 text-center text-sm text-gray-500">
            <p className="font-bold mb-1 text-gray-700">Thank you for your business!</p>
            <p>If you have any problems, please contact us with your Order Number.</p>
        </div>
      </div>
      </div>
    </>
  );
};
