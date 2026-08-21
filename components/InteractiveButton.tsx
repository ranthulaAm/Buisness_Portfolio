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
    const isFullWidth = className.includes('w-full');
    
    return (
        <div className={`relative inline-block ${isFullWidth ? 'w-full' : ''}`}>
            <button 
                type={type}
                onClick={onClick}
                className={`w-full group relative overflow-hidden bg-gray-900 dark:bg-white text-white dark:text-gray-900 px-8 py-4 rounded-full font-bold uppercase tracking-[0.2em] text-[11px] transition-all duration-300 hover:scale-[1.02] active:scale-[0.96] shadow-md hover:shadow-xl ${className.replace('w-full', '').trim()}`}
            >
                {/* Hardware-accelerated animated gradient backdrop hover layer */}
                <div className="absolute inset-0 bg-gradient-to-r from-purple-600 via-pink-600 to-rose-500 opacity-0 group-hover:opacity-100 transition-opacity duration-500 ease-out z-0"></div>
                <span className="relative z-10 flex items-center justify-center gap-2 group-hover:text-white transition-colors duration-300">
                    {children}
                </span>
            </button>
        </div>
    );
};
