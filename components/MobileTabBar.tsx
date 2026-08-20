import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Upload, LayoutDashboard, Home, LogIn, User as UserIcon } from 'lucide-react';
import { User } from '../types';

interface MobileTabBarProps {
  user: User | null;
  onLogout?: () => void;
  onLoginClick?: () => void;
}

export const MobileTabBar: React.FC<MobileTabBarProps> = ({ user, onLoginClick }) => {
  const navigate = useNavigate();
  const location = useLocation();

  // Detect active route states
  const pathname = location.pathname;
  const searchParams = new URLSearchParams(location.search);
  
  const isHomeActive = pathname === '/';
  const isProfileActive = pathname === '/dashboard' && searchParams.get('tab') === 'profile';
  const isUploadActive = pathname === '/upload';
  const isDashboardActive = pathname === '/dashboard' && !isProfileActive;
  const isSignInActive = !!searchParams.get('auth');

  return (
    <div 
      id="mobile-tab-bar"
      className="md:hidden fixed bottom-0 left-0 right-0 z-50 w-full"
    >
      {/* 
        Liquid Glass Blended material: 
        We use a moderate backdrop-blur-xl (not a heavy 50px blur) to prevent mobile scrolling lag.
        The "mobile-tab-bar-bg" class provides a solid background fallback on platforms without backdrop-filter.
      */}
      <div className="mobile-tab-bar-bg bg-white/70 dark:bg-zinc-950/75 backdrop-blur-xl border-t border-black/5 dark:border-white/10 shadow-[0_-8px_30px_rgba(0,0,0,0.06)] dark:shadow-[0_-8px_30px_rgba(0,0,0,0.5)]">
        <nav 
          style={{ paddingBottom: 'calc(8px + env(safe-area-inset-bottom, 0px))' }}
          className="flex items-center justify-around px-2 pt-2 max-w-lg mx-auto"
        >
          {/* Tab 1: Home (Available to everyone, left-most) */}
          <button
            onClick={() => navigate('/')}
            className={`flex flex-col items-center justify-center gap-1 flex-1 py-2 min-h-[48px] min-w-[48px] transition-all duration-200 active:scale-[0.96] ${
              isHomeActive 
                ? 'text-purple-600 dark:text-purple-400' 
                : 'text-gray-400 dark:text-gray-500'
            }`}
          >
            <div className="relative flex items-center justify-center h-6">
              <Home 
                size={22} 
                className={`transition-transform duration-200 ${
                  isHomeActive ? 'scale-110 stroke-[2.25px]' : 'scale-100 stroke-[1.75px]'
                }`} 
              />
              {isHomeActive && (
                <span className="absolute -bottom-1.5 w-1 h-1 rounded-full bg-purple-600 dark:bg-purple-400 animate-pulse-slow" />
              )}
            </div>
            <span className="text-[11px] font-semibold uppercase tracking-wider leading-none mt-1">
              Home
            </span>
          </button>

          {/* Conditional Tabs based on auth status */}
          {user ? (
            <>
              {/* Tab 2: Dashboard */}
              <button
                onClick={() => navigate('/dashboard')}
                className={`flex flex-col items-center justify-center gap-1 flex-1 py-2 min-h-[48px] min-w-[48px] transition-all duration-200 active:scale-[0.96] ${
                  isDashboardActive 
                    ? 'text-purple-600 dark:text-purple-400' 
                    : 'text-gray-400 dark:text-gray-500'
                }`}
              >
                <div className="relative flex items-center justify-center h-6">
                  <LayoutDashboard 
                    size={22} 
                    className={`transition-transform duration-200 ${
                      isDashboardActive ? 'scale-110 stroke-[2.25px]' : 'scale-100 stroke-[1.75px]'
                    }`} 
                  />
                  {isDashboardActive && (
                    <span className="absolute -bottom-1.5 w-1 h-1 rounded-full bg-purple-600 dark:bg-purple-400 animate-pulse-slow" />
                  )}
                </div>
                <span className="text-[11px] font-semibold uppercase tracking-wider leading-none mt-1">
                  Dash
                </span>
              </button>

              {/* Tab 3: Upload */}
              <button
                onClick={() => navigate('/upload')}
                className={`flex flex-col items-center justify-center gap-1 flex-1 py-2 min-h-[48px] min-w-[48px] transition-all duration-200 active:scale-[0.96] ${
                  isUploadActive 
                    ? 'text-purple-600 dark:text-purple-400' 
                    : 'text-gray-400 dark:text-gray-500'
                }`}
              >
                <div className="relative flex items-center justify-center h-6">
                  <Upload 
                    size={22} 
                    className={`transition-transform duration-200 ${
                      isUploadActive ? 'scale-110 stroke-[2.25px]' : 'scale-100 stroke-[1.75px]'
                    }`} 
                  />
                  {isUploadActive && (
                    <span className="absolute -bottom-1.5 w-1 h-1 rounded-full bg-purple-600 dark:bg-purple-400 animate-pulse-slow" />
                  )}
                </div>
                <span className="text-[11px] font-semibold uppercase tracking-wider leading-none mt-1">
                  Upload
                </span>
              </button>

              {/* Tab 4: Profile */}
              <button
                onClick={() => navigate('/dashboard?tab=profile')}
                className={`flex flex-col items-center justify-center gap-1 flex-1 py-2 min-h-[48px] min-w-[48px] transition-all duration-200 active:scale-[0.96] ${
                  isProfileActive 
                    ? 'text-purple-600 dark:text-purple-400' 
                    : 'text-gray-400 dark:text-gray-500'
                }`}
              >
                <div className="relative flex items-center justify-center h-6">
                  {user.avatar ? (
                    <img 
                      src={user.avatar} 
                      alt={user.name} 
                      className={`w-[22px] h-[22px] rounded-full object-cover transition-all duration-200 ${
                        isProfileActive 
                          ? 'border-[1.5px] border-purple-600 dark:border-purple-400 scale-110 shadow-sm' 
                          : 'border border-gray-300 dark:border-zinc-700 scale-100'
                      }`}
                    />
                  ) : (
                    <UserIcon 
                      size={22}
                      className={`transition-transform duration-200 ${
                        isProfileActive ? 'scale-110 stroke-[2.25px]' : 'scale-100 stroke-[1.75px]'
                      }`}
                    />
                  )}
                  {isProfileActive && (
                    <span className="absolute -bottom-1.5 w-1 h-1 rounded-full bg-purple-600 dark:bg-purple-400 animate-pulse-slow" />
                  )}
                </div>
                <span className="text-[11px] font-semibold uppercase tracking-wider leading-none mt-1">
                  Profile
                </span>
              </button>
            </>
          ) : (
            /* Logged out view: Show Sign In so the bar isn't empty */
            <button
              onClick={onLoginClick}
              className={`flex flex-col items-center justify-center gap-1 flex-1 py-2 min-h-[48px] min-w-[48px] transition-all duration-200 active:scale-[0.96] ${
                isSignInActive 
                  ? 'text-purple-600 dark:text-purple-400' 
                  : 'text-gray-400 dark:text-gray-500'
              }`}
            >
              <div className="relative flex items-center justify-center h-6">
                <LogIn 
                  size={22} 
                  className={`transition-transform duration-200 ${
                    isSignInActive ? 'scale-110 stroke-[2.25px]' : 'scale-100 stroke-[1.75px]'
                  }`} 
                />
                {isSignInActive && (
                  <span className="absolute -bottom-1.5 w-1 h-1 rounded-full bg-purple-600 dark:bg-purple-400 animate-pulse-slow" />
                )}
              </div>
              <span className="text-[11px] font-semibold uppercase tracking-wider leading-none mt-1">
                Sign In
              </span>
            </button>
          )}
        </nav>
      </div>
    </div>
  );
};
