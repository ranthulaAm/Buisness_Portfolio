import React from 'react';
import { LogOut } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { User } from '../types';

interface NavbarProps {
  user: User | null;
  onLoginClick: () => void;
  onLogout: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ user, onLogout }) => {
  const navigate = useNavigate();

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
               className="h-10 md:h-12 w-auto object-contain filter invert mix-blend-multiply"
               onError={(e) => {
                 e.currentTarget.style.display = 'none';
                 const fallback = document.getElementById('nav-logo-fallback');
                 if (fallback) fallback.style.display = 'flex';
               }}
             />
             {/* Fallback element if image fails to load */}
             <div id="nav-logo-fallback" style={{display: 'none'}} className="h-10 w-10 bg-gray-200 rounded-full items-center justify-center border border-gray-300 backdrop-blur-md">
                <span className="font-display font-bold text-gray-900 text-sm">RA</span>
             </div>
        </button>

        {/* Right Side: User Profile (Only if logged in) */}
        {user ? (
          <div className="pointer-events-auto animate-fade-in flex items-center gap-4">
            <button onClick={() => navigate('/dashboard')} className="text-gray-900 bg-gray-100 hover:bg-gray-200 px-4 py-2 rounded-full text-xs font-bold uppercase tracking-widest backdrop-blur-md border border-gray-200 transition-colors">
              Dashboard
            </button>
            <div className="flex items-center gap-2 md:gap-3 bg-white/80 backdrop-blur-md px-3 py-2 md:px-4 md:py-2 rounded-full border border-gray-300 shadow-[0_8px_32px_rgba(0,0,0,0.12)] hover:border-purple-300 transition-colors">
              <img src={user.avatar} alt={user.name} className="w-8 h-8 rounded-full border border-purple-500" />
              <span className="text-xs md:text-sm font-bold text-gray-900 hidden md:block max-w-[100px] truncate">{user.name}</span>
              <button onClick={onLogout} className="text-gray-500 hover:text-red-500 ml-1 md:ml-2 p-1 transition-colors">
                <LogOut size={18} />
              </button>
            </div>
          </div>
        ) : (
          <div></div> /* Spacer for flex justify-between if user is null */
        )}
    </header>
  );
};