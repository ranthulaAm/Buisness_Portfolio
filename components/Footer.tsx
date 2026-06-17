import React, { useEffect, useState } from 'react';
import { Instagram, Twitter, Mail, Heart, Facebook, Phone, MapPin, Globe } from 'lucide-react';
import { FooterConfig, getFooterConfig } from '../services/dataService';

export const Footer: React.FC = () => {
  const [footerData, setFooterData] = useState<FooterConfig | null>(null);

  useEffect(() => {
    getFooterConfig().then(setFooterData);
  }, []);

  if (!footerData) return null;

  return (
    <footer className="bg-gray-50 dark:bg-slate-800 border-t border-gray-200 dark:border-slate-700 pt-16 pb-8 relative z-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row justify-between items-start gap-12">
          <div className="text-center md:text-left">
            <div className="flex items-center justify-center md:justify-start gap-3 mb-4">
               <img src="https://raw.githubusercontent.com/ranthulaAm/App/main/img/logo.png" alt="Logo" className="h-10 opacity-80 filter invert mix-blend-multiply dark:invert-0 dark:mix-blend-normal" onError={(e) => e.currentTarget.style.display = 'none'} />
              <h3 className="text-2xl font-display font-bold text-gray-900 dark:text-slate-100">I'm <span className="text-purple-600">Ranthula</span></h3>
            </div>
            <p className="text-gray-500 dark:text-slate-400 max-w-xs font-light mb-6">
              Transforming ideas into surreal visions through advanced image manipulation and digital art.
            </p>
            <div className="flex gap-4 justify-center md:justify-start">
              {footerData.instagram && <a href={footerData.instagram} target="_blank" rel="noreferrer" className="text-gray-400 hover:text-purple-600 transition-colors hover:scale-110 transform"><Instagram /></a>}
              {footerData.facebook && <a href={footerData.facebook} target="_blank" rel="noreferrer" className="text-gray-400 hover:text-blue-600 transition-colors hover:scale-110 transform"><Facebook /></a>}
              {footerData.email && <a href={`mailto:${footerData.email}`} className="text-gray-400 hover:text-red-500 transition-colors hover:scale-110 transform"><Mail /></a>}
            </div>
          </div>
          
          <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-8 text-sm max-w-2xl w-full md:mx-auto">
             <div className="flex flex-col gap-4">
                <h4 className="font-bold text-gray-900 dark:text-slate-100 uppercase tracking-widest text-xs mb-2">Contact</h4>
                <a href={`mailto:${footerData.email}`} className="flex items-center gap-3 text-gray-600 dark:text-slate-400 hover:text-purple-600 transition-colors">
                    <Mail size={16} className="text-gray-400" />
                    {footerData.email}
                </a>
                <a href={`tel:${footerData.phone.replace(/[^0-9+]/g, '')}`} className="flex items-center gap-3 text-gray-600 dark:text-slate-400 hover:text-purple-600 transition-colors">
                    <Phone size={16} className="text-gray-400" />
                    {footerData.phone}
                </a>
             </div>
             
             <div className="flex flex-col gap-4">
                <h4 className="font-bold text-gray-900 dark:text-slate-100 uppercase tracking-widest text-xs mb-2">Location & Links</h4>
                <div className="flex items-start gap-3 text-gray-600 dark:text-slate-400 whitespace-pre-wrap">
                    <MapPin size={16} className="text-gray-400 mt-0.5 shrink-0" />
                    <p>{footerData.location}</p>
                </div>
                {footerData.extraUrls && footerData.extraUrls.map((urlItem, idx) => (
                  <a key={idx} href={urlItem.url} target="_blank" rel="noreferrer" className="flex items-center gap-3 text-gray-600 dark:text-slate-400 hover:text-purple-600 transition-colors">
                      <Globe size={16} className="text-gray-400 shrink-0" />
                      {urlItem.title}
                  </a>
                ))}
             </div>
          </div>
        </div>
        
        <div className="mt-16 pt-8 border-t border-gray-200 dark:border-slate-700 text-center text-sm text-gray-500 dark:text-slate-400 flex flex-col items-center gap-2">
          <p>&copy; {new Date().getFullYear()} Ranthula Amarasekara. All rights reserved.</p>
          <p className="flex items-center gap-1">Crafted with <Heart size={12} className="text-pink-500 fill-pink-500" /> & Passion</p>
        </div>
      </div>
    </footer>
  );
};