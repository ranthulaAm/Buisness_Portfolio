import React, { useState, useEffect } from 'react';
import { getDiscountsConfig } from '../services/dataService';
import { Tag } from 'lucide-react';

export const OfferBanner: React.FC = () => {
    const [globalDiscount, setGlobalDiscount] = useState(0);
    const [isActive, setIsActive] = useState(false);

    useEffect(() => {
        getDiscountsConfig().then((config) => {
            setGlobalDiscount(config.globalDiscount);
            setIsActive(config.isActive);
        });
    }, []);

    if (!isActive || globalDiscount <= 0) return null;

    return (
        <div className="bg-gradient-to-r from-purple-800 via-pink-700 to-rose-600 animate-gradient relative overflow-hidden shadow-lg border-b border-white/10 z-50">
            <div className="absolute inset-0 bg-white/10 backdrop-blur-sm animate-pulse flex"></div>
            <div className="max-w-7xl mx-auto px-4 py-2 sm:px-6 lg:px-8 relative z-10 flex ITEMS-center justify-center">
                <div className="flex items-center gap-3">
                    <span className="flex p-1 rounded-lg bg-black/20 text-white">
                        <Tag size={16} />
                    </span>
                    <p className="font-bold text-white text-sm sm:text-base drop-shadow-sm tracking-wide">
                        <span className="opacity-90 inline-block mr-2 uppercase text-xs tracking-widest font-black bg-white/20 px-2 py-0.5 rounded backdrop-blur-md border border-white/30 hidden sm:inline-block">Special Offer</span>
                        Get <span className="font-black text-rose-200 text-lg mx-1">{globalDiscount}% OFF</span> on your digital orders today!
                    </p>
                </div>
            </div>
        </div>
    );
};
