import React, { useState, useEffect } from 'react';
import { LogOut, Moon, Sun } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { User } from '../types';

interface NavbarProps {
  user: User | null;
  onLoginClick: () => void;
  onLogout: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ user, onLoginClick, onLogout }) => {
  const navigate = useNavigate();
  const [isDarkMode, setIsDarkMode] = useState(false);

  useEffect(() => {
    // Check initial
    if (document.documentElement.classList.contains('dark')) {
      setIsDarkMode(true);
    }
  }, []);

  const toggleTheme = () => {
    if (isDarkMode) {
      document.documentElement.classList.remove('dark');
      setIsDarkMode(false);
    } else {
      document.documentElement.classList.add('dark');
      setIsDarkMode(true);
    }
  };

  const handleReturnToIntro = () => {
    // Navigate to root with state to trigger IntroSequence with skipAnimation
    // This allows returning to the landing screen without the long animation loop
    navigate('/', { state: { showIntro: true, skipAnimation: true } });
  };

  return (
    <header className="fixed w-full z-50 top-0 left-0 p-4 md:p-8 pointer-events-none flex justify-between items-start">
        {/* Left Side: Logo -> Return to Intro */}
        <button 
          onClick={handleReturnToIntro}
          className="pointer-events-auto group opacity-70 hover:opacity-100 transition-opacity"
          title="Return to Start"
        >
             <img 
               src="https://raw.githubusercontent.com/ranthulaAm/App/main/img/logo.png" 
               alt="RA Logo" 
               className="h-10 md:h-12 w-auto object-contain filter invert mix-blend-multiply dark:invert-0 dark:mix-blend-normal"
               onError={(e) => {
                 e.currentTarget.style.display = 'none';
                 const fallback = document.getElementById('nav-logo-fallback');
                 if (fallback) fallback.style.display = 'flex';
               }}
             />
             {/* Fallback element if image fails to load */}
             <div id="nav-logo-fallback" style={{display: 'none'}} className="h-10 w-10 bg-gray-200 rounded-full items-center justify-center border border-gray-300 dark:border-slate-600 backdrop-blur-md">
                <span className="font-display font-bold text-gray-900 dark:text-slate-100 text-sm">RA</span>
             </div>
        </button>

        {/* Right Side: Theme Toggle & User Profile */}
        <div className="pointer-events-auto flex items-center gap-2 md:gap-4">
          <button 
            onClick={toggleTheme} 
            className="text-gray-900 dark:text-slate-100 bg-white/80 dark:bg-slate-900/80 hover:bg-white dark:bg-slate-900 backdrop-blur-md px-3 py-2 md:px-4 md:py-2 rounded-full border border-gray-300 dark:border-slate-600 shadow-sm transition-colors flex items-center gap-2"
          >
            {isDarkMode ? <Sun size={14} className="md:w-4 md:h-4" /> : <Moon size={14} className="md:w-4 md:h-4" />}
            <span className="text-[10px] md:text-xs font-bold uppercase tracking-widest hidden md:block">
              {isDarkMode ? 'Light' : 'Dark'}
            </span>
          </button>
          
          {user ? (
            <div className="animate-fade-in flex items-center gap-2 md:gap-4">
              <button onClick={() => navigate('/dashboard')} className="text-gray-900 dark:text-slate-100 bg-gray-100 dark:bg-slate-800 hover:bg-gray-200 px-3 py-2 md:px-4 md:py-2 rounded-full text-[10px] md:text-xs font-bold uppercase tracking-widest backdrop-blur-md border border-gray-200 dark:border-slate-700 transition-colors hidden sm:block">
                Dashboard
              </button>
              <button onClick={() => navigate('/dashboard')} className="text-gray-900 dark:text-slate-100 bg-gray-100 dark:bg-slate-800 hover:bg-gray-200 px-3 py-2 rounded-full text-[10px] font-bold uppercase tracking-widest backdrop-blur-md border border-gray-200 dark:border-slate-700 transition-colors sm:hidden">
                Dash
              </button>
              <div className="flex items-center gap-1 md:gap-3 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md px-2 py-1.5 md:px-4 md:py-2 rounded-full border border-gray-300 dark:border-slate-600 shadow-[0_8px_32px_rgba(0,0,0,0.12)] hover:border-purple-300 transition-colors">
                <button 
                  onClick={() => {
                    if (window.location.hash.startsWith('#/admin')) {
                      navigate('/admin?tab=settings');
                    } else {
                      navigate('/dashboard?tab=profile');
                    }
                  }} 
                  className="flex items-center gap-2 md:gap-3 hover:opacity-80 transition-opacity text-left"
                >
                  <img src={user.avatar} alt={user.name} className="w-6 h-6 md:w-8 md:h-8 rounded-full border border-purple-500" />
                  <span className="text-xs md:text-sm font-bold text-gray-900 dark:text-slate-100 hidden md:block max-w-[100px] truncate">{user.name}</span>
                </button>
                <button onClick={(e) => { e.stopPropagation(); onLogout(); }} className="text-gray-500 dark:text-slate-400 hover:text-red-500 ml-1 md:ml-2 p-1 transition-colors">
                  <LogOut size={16} className="md:w-[18px] md:h-[18px]" />
                </button>
              </div>
            </div>
          ) : (
            <button onClick={onLoginClick} className="text-gray-900 dark:text-slate-100 bg-gray-100 dark:bg-slate-800 hover:bg-gray-200 px-3 py-2 md:px-4 md:py-2 rounded-full text-[10px] md:text-xs font-bold uppercase tracking-widest backdrop-blur-md border border-gray-200 dark:border-slate-700 transition-colors">
               Sign In
            </button>
          )}
        </div>
    </header>
  );
};