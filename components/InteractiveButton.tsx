import React from 'react';

export const InteractiveButton = ({ 
    children, 
    onClick, 
    className = '',
    type = 'button'
}: { 
    children: React.ReactNode, 
    onClick?: () => void, 
    className?: string,
    type?: 'button' | 'submit'
}) => {
    return (
        <button 
            type={type}
            onClick={onClick}
            className={`group relative overflow-hidden bg-gray-900 text-white px-8 py-4 rounded-full font-bold uppercase tracking-[0.2em] text-xs transition-all duration-300 hover:scale-[1.02] active:scale-[0.98] shadow-lg ${className}`}
        >
            <div className="absolute inset-0 bg-gradient-to-r from-purple-500 via-pink-500 to-orange-400 opacity-0 group-hover:opacity-100 transition-opacity duration-500 ease-out z-0"></div>
            <span className="relative z-10 flex items-center justify-center gap-2">
                {children}
            </span>
        </button>
    );
};
