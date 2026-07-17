import React, { useRef } from 'react';
import './InteractiveButton.css';

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
    const filterRef = useRef<HTMLDivElement>(null);
    
    const colors = [1, 2, 3, 4];
    const particleCount = 15;
    const particleDistances: [number, number] = [80, 20];
    const particleR = 100;
    const animationTime = 600;
    const timeVariance = 300;
    
    const noise = (n = 1) => n / 2 - Math.random() * n;
    
    const getXY = (distance: number, pointIndex: number, totalPoints: number) => {
        const angle = ((360 + noise(8)) / totalPoints) * pointIndex * (Math.PI / 180);
        return [distance * Math.cos(angle), distance * Math.sin(angle)];
    };
    
    const createParticle = (i: number, t: number, d: [number, number], r: number) => {
        let rotate = noise(r / 10);
        return {
            start: getXY(d[0], particleCount - i, particleCount),
            end: getXY(d[1] + noise(7), particleCount - i, particleCount),
            time: t,
            scale: 1 + noise(0.2),
            color: colors[Math.floor(Math.random() * colors.length)],
            rotate: rotate > 0 ? (rotate + r / 20) * 10 : (rotate - r / 20) * 10
        };
    };
    
    const makeParticles = () => {
        const element = filterRef.current;
        if (!element) return;
        
        // Remove existing particles
        const existing = element.querySelectorAll('.particle');
        existing.forEach(p => element.removeChild(p));
        
        const d = particleDistances;
        const r = particleR;
        const bubbleTime = animationTime * 2 + timeVariance;
        element.style.setProperty('--time', `${bubbleTime}ms`);
        
        element.classList.remove('active');
        void element.offsetWidth; // trigger reflow
        element.classList.add('active');
        
        for (let i = 0; i < particleCount; i++) {
            const t = animationTime * 2 + noise(timeVariance * 2);
            const p = createParticle(i, t, d, r);
            
            setTimeout(() => {
                const particle = document.createElement('span');
                const point = document.createElement('span');
                particle.className = 'particle';
                particle.style.setProperty('--start-x', `${p.start[0]}px`);
                particle.style.setProperty('--start-y', `${p.start[1]}px`);
                particle.style.setProperty('--end-x', `${p.end[0]}px`);
                particle.style.setProperty('--end-y', `${p.end[1]}px`);
                particle.style.setProperty('--time', `${p.time}ms`);
                particle.style.setProperty('--scale', `${p.scale}`);
                particle.style.setProperty('--color', `var(--color-${p.color})`);
                particle.style.setProperty('--rotate', `${p.rotate}deg`);
                
                point.className = 'point';
                particle.appendChild(point);
                element.appendChild(particle);
                
                requestAnimationFrame(() => {
                    element.classList.add('active');
                });
                
                setTimeout(() => {
                    try { element.removeChild(particle); } catch {}
                }, t);
            }, 30);
        }
    };
    
    const handleClick = (e: React.MouseEvent) => {
        makeParticles();
        if (onClick) {
            onClick();
        }
    };

    const isFullWidth = className.includes('w-full');
    
    return (
        <div className={`relative inline-block ${isFullWidth ? 'w-full' : ''}`}>
            <div className="effect filter absolute inset-0 pointer-events-none z-[-1]" ref={filterRef} />
            <button 
                type={type}
                onClick={handleClick}
                className={`w-full group relative overflow-hidden bg-gray-900 dark:bg-white text-white dark:text-gray-900 px-8 py-4 rounded-full font-bold uppercase tracking-[0.2em] text-xs transition-all duration-300 hover:scale-[1.02] active:scale-[0.98] shadow-lg ${className.replace('w-full', '').trim()}`}
            >
                <div className="absolute inset-0 bg-gradient-to-r from-purple-500 via-pink-500 to-orange-400 opacity-0 group-hover:opacity-100 transition-opacity duration-500 ease-out z-0"></div>
                <span className="relative z-10 flex items-center justify-center gap-2 group-hover:text-white transition-colors">
                    {children}
                </span>
            </button>
        </div>
    );
};
