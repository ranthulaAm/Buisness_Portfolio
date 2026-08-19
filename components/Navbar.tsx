import React, { useState, useEffect } from 'react';
import { LogOut, Moon, Sun, Upload, ArrowLeft } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import { User } from '../types';

interface NavbarProps {
  user: User | null;
  onLoginClick: () => void;
  onLogout: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ user, onLoginClick, onLogout }) => {
  const navigate = useNavigate();
  const location = useLocation();
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
        {/* Left Side: Back Button */}
        <button 
          onClick={() => {
            const p = location.pathname;
            if (p === '/') {
              navigate('/', { state: { showIntro: true, skipAnimation: true } });
            } else if (p.startsWith('/dashboard') || p.startsWith('/admin')) {
              navigate('/');
            } else if (p.startsWith('/order') || p.startsWith('/upload') || p.startsWith('/tracking') || p.startsWith('/share')) {
              if (user) {
                navigate('/dashboard');
              } else {
                navigate('/');
              }
            } else {
              if (window.history.state && window.history.state.idx > 0) {
                navigate(-1);
              } else {
                navigate('/');
              }
            }
          }}
          className="pointer-events-auto cursor-pointer flex items-center justify-center w-12 h-12 md:w-14 md:h-14 rounded-full bg-white dark:bg-zinc-800 backdrop-blur-2xl border border-gray-300/80 dark:border-slate-500 shadow-[0_8px_30px_rgba(0,0,0,0.2)] dark:shadow-[0_8px_30px_rgba(0,0,0,0.8)] hover:scale-105 active:scale-95 transition-all text-gray-900 dark:text-white"
          title="Go Back"
        >
             <ArrowLeft size={24} strokeWidth={2.5} />
        </button>

        {/* Right Side: Theme Toggle & User Profile */}
        {!location.pathname.startsWith('/admin') && (
          <div className="pointer-events-auto flex items-center gap-2 md:gap-4">
            <button 
              onClick={() => navigate('/upload')}
              className="text-white bg-purple-600 hover:bg-purple-700 dark:bg-purple-600 dark:hover:bg-purple-700 hover:scale-105 active:scale-95 px-4 py-2.5 md:px-5 md:py-2.5 rounded-full shadow-[0_8px_20px_rgba(147,51,234,0.35)] dark:shadow-[0_8px_25px_rgba(147,51,234,0.5)] transition-all flex items-center gap-2 border border-purple-500/20"
            >
              <Upload size={18} className="w-[18px] h-[18px]" />
              <span className="text-[10px] md:text-xs font-bold uppercase tracking-widest hidden md:block">Upload</span>
            </button>
            <button 
              onClick={toggleTheme} 
              className="text-gray-900 dark:text-white bg-white dark:bg-zinc-800 hover:bg-white dark:bg-zinc-900 backdrop-blur-md px-4 py-2.5 md:px-4 md:py-2.5 rounded-full border border-gray-300 dark:border-slate-500 shadow-[0_8px_30px_rgba(0,0,0,0.12)] dark:shadow-[0_8px_30px_rgba(0,0,0,0.8)] transition-all flex items-center gap-2"
            >
              {isDarkMode ? <Sun size={18} className="w-[18px] h-[18px]" /> : <Moon size={18} className="w-[18px] h-[18px]" />}
              <span className="text-[10px] md:text-xs font-bold uppercase tracking-widest hidden md:block">
                {isDarkMode ? 'Light' : 'Dark'}
              </span>
            </button>
            
            {user ? (
              <div className="animate-fade-in flex items-center gap-2 md:gap-4">
                <button 
                  onClick={() => navigate('/dashboard')} 
                  className="text-white bg-indigo-600 hover:bg-indigo-700 dark:bg-indigo-600 dark:hover:bg-indigo-700 hover:scale-105 active:scale-95 px-4 py-2.5 md:px-5 md:py-2.5 rounded-full text-[10px] md:text-xs font-bold uppercase tracking-widest shadow-[0_8px_20px_rgba(79,70,229,0.35)] dark:shadow-[0_8px_25px_rgba(79,70,229,0.5)] transition-all border border-indigo-500/20 hidden sm:block"
                >
                  Dashboard
                </button>
                <button 
                  onClick={() => navigate('/dashboard')} 
                  className="text-white bg-indigo-600 hover:bg-indigo-700 dark:bg-indigo-600 dark:hover:bg-indigo-700 hover:scale-105 active:scale-95 px-4 py-2.5 rounded-full text-xs font-bold uppercase tracking-widest shadow-[0_8px_20px_rgba(79,70,229,0.35)] dark:shadow-[0_8px_25px_rgba(79,70,229,0.5)] transition-all border border-indigo-500/20 sm:hidden"
                >
                  Dash
                </button>
                <div className="flex items-center gap-1 md:gap-3 bg-white dark:bg-zinc-800 backdrop-blur-md px-3 py-2 md:px-4 md:py-2 rounded-full border border-gray-300 dark:border-slate-500 shadow-[0_8px_30px_rgba(0,0,0,0.12)] dark:shadow-[0_8px_30px_rgba(0,0,0,0.8)] hover:border-purple-300 transition-colors">
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
                    <img src={user.avatar} alt={user.name} className="w-8 h-8 md:w-8 md:h-8 rounded-full border border-purple-500" />
                    <span className="text-xs md:text-sm font-bold text-gray-900 dark:text-white hidden md:block max-w-[100px] truncate">{user.name}</span>
                  </button>
                  <button onClick={(e) => { e.stopPropagation(); onLogout(); }} className="text-gray-500 dark:text-gray-400 hover:text-red-500 ml-1 md:ml-2 p-1 transition-colors">
                    <LogOut size={18} className="w-[18px] h-[18px]" />
                  </button>
                </div>
              </div>
            ) : (
              <button onClick={onLoginClick} className="text-gray-900 dark:text-white bg-white dark:bg-zinc-800 hover:bg-gray-200 px-4 py-2.5 md:px-4 md:py-2 rounded-full text-[10px] md:text-xs font-bold uppercase tracking-widest backdrop-blur-md border border-gray-200 dark:border-slate-500 shadow-[0_8px_30px_rgba(0,0,0,0.12)] dark:shadow-[0_8px_30px_rgba(0,0,0,0.8)] transition-all">
                 Sign In
              </button>
            )}
          </div>
        )}
    </header>
  );
};