import React, { useState, useEffect, useRef } from 'react';
import { Lock, ArrowLeft, ShieldAlert, LogOut, Loader2, Key, ChevronLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { getAdminPassword, getAdminEmails } from '../services/dataService';
import { auth } from '../services/firebase';
import { User } from '../types';

interface AdminGuardProps {
  children: React.ReactNode;
  user?: User | null;
}

export const AdminGuard: React.FC<AdminGuardProps> = ({ children, user }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [password, setPassword] = useState('');
  const [allowedEmails, setAllowedEmails] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [verifyingPassword, setVerifyingPassword] = useState(false);
  const [showBackButton, setShowBackButton] = useState(true);
  const lastScrollY = useRef(0);
  const navigate = useNavigate();

  useEffect(() => {
    let ticking = false;

    const handleScrollEvent = (currentScrollY: number) => {
      if (currentScrollY < 20) {
        setShowBackButton(true);
        return;
      }
      
      const diff = currentScrollY - lastScrollY.current;
      if (diff > 8) {
        // Scrolling down - hide back button (make it go downward)
        setShowBackButton(false);
      } else if (diff < -8) {
        // Scrolling up - show back button
        setShowBackButton(true);
      }
      lastScrollY.current = currentScrollY;
    };

    const handleScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          handleScrollEvent(window.scrollY);
          ticking = false;
        });
        ticking = true;
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);

  useEffect(() => {
    // Check session persistence for password gate
    const authSession = sessionStorage.getItem('admin_auth');
    if (authSession === 'true') {
      setIsAuthenticated(true);
    }
    
    // Fetch authorized emails from DB
    const fetchAdmins = async () => {
      try {
        const list = await getAdminEmails();
        setAllowedEmails(list);
      } catch (e) {
        console.error("Error loading allowed admin emails:", e);
      } finally {
        setLoading(false);
      }
    };
    fetchAdmins();
  }, [user]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setVerifyingPassword(true);
    try {
      const actualPassword = await getAdminPassword();
      if (password === actualPassword) {
        setIsAuthenticated(true);
        sessionStorage.setItem('admin_auth', 'true');
      } else {
        console.error('Invalid Password');
      }
    } catch (err) {
      console.error(err);
    } finally {
      setVerifyingPassword(false);
    }
  };

  const handleBack = () => {
    navigate('/', { state: { showIntro: true, skipAnimation: true } });
  };

  const handleSignOut = async () => {
    await auth.signOut();
    sessionStorage.removeItem('admin_auth');
    setIsAuthenticated(false);
  };

  // 1. Loading State
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-55 text-gray-900 dark:text-slate-100 relative z-50">
        <div className="text-center">
          <Loader2 className="animate-spin text-purple-600 mx-auto mb-4" size={32} />
          <p className="text-sm font-bold uppercase tracking-widest text-gray-500 dark:text-slate-400">Checking Credentials...</p>
        </div>
      </div>
    );
  }

  // 2. Not Logged In
  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-55 text-gray-900 dark:text-slate-100 relative z-50 px-4">
        <div className="relative bg-white dark:bg-slate-900 border border-gray-300 dark:border-slate-600 p-8 md:p-12 rounded-3xl w-full max-w-md text-center shadow-[0_15px_50px_rgba(0,0,0,0.08)]">
          <button 
            type="button"
            onClick={handleBack}
            className="absolute top-6 left-6 inline-flex items-center gap-1 text-purple-600 dark:text-purple-400 hover:text-purple-700 dark:hover:text-purple-300 active:scale-[0.96] bg-purple-50 dark:bg-slate-800 border border-purple-200 dark:border-slate-700 px-3.5 py-1.5 rounded-full shadow-sm font-bold text-[10px] uppercase tracking-wider transition-all duration-300 ease-in-out"
            title="Back to Home"
          >
            <ChevronLeft size={16} strokeWidth={3} />
            <span>Back</span>
          </button>

          <div className="mx-auto bg-purple-50 border border-purple-100 w-16 h-16 rounded-2xl flex items-center justify-center mb-6 text-purple-600 shadow-sm">
             <Lock size={24} className="animate-pulse" />
          </div>
          
          <h1 className="text-2xl font-bold font-display text-gray-900 dark:text-slate-100 mb-2">Admin Sign-In Required</h1>
          <p className="text-gray-500 dark:text-slate-400 text-sm mb-8 leading-relaxed">This area is restricted to system administrators. Please sign in to verify your access permission.</p>
          
          <button 
            type="button"
            onClick={() => {
              // Redirect to home
              navigate('/');
            }}
            className="w-full bg-purple-600 text-white font-bold py-3.5 rounded-xl hover:bg-purple-700 transition-all text-sm uppercase tracking-wider shadow-md"
          >
             Go to Login Page
          </button>
        </div>
      </div>
    );
  }

  // 3. Logged In, but Email NOT in Allowed List
  const isOwner = user.email === 'ranthuls112@gmail.com';
  const isSecondaryAdmin = allowedEmails.map(e => e.toLowerCase()).includes(user.email.toLowerCase());
  const isAuthorized = isOwner || isSecondaryAdmin;

  if (!isAuthorized) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-55 text-gray-900 dark:text-slate-100 relative z-50 px-4">
        <div className="relative bg-white dark:bg-slate-900 border border-gray-300 dark:border-slate-600 p-8 md:p-12 rounded-3xl w-full max-w-md text-center shadow-[0_15px_50px_rgba(0,0,0,0.08)] animate-fade-in">
          
          <div className="mx-auto bg-red-50 border border-red-100 w-16 h-16 rounded-2xl flex items-center justify-center mb-6 text-red-600 shadow-sm">
             <ShieldAlert size={26} />
          </div>
          
          <h1 className="text-2xl font-bold font-display text-red-600 mb-2">Access Denied</h1>
          <p className="text-gray-500 dark:text-slate-400 text-sm mb-6 leading-relaxed">
            Your account <span className="font-mono font-bold text-gray-900 dark:text-slate-100">{user.email}</span> is not registered as an authorized administrator.
          </p>

          <p className="text-xs text-gray-400 bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 p-3.5 rounded-xl mb-8 font-medium">
            Contact the system owner (<span className="font-mono font-bold text-gray-700 dark:text-slate-300">ranthuls112@gmail.com</span>) to receive admin clearance.
          </p>
          
          <div className="flex gap-4">
            <button 
              type="button"
              onClick={handleBack}
              className="flex-1 border border-gray-300 dark:border-slate-600 hover:border-gray-450 hover:bg-gray-50 dark:hover:bg-slate-800 dark:bg-slate-800 text-gray-700 dark:text-slate-300 font-bold py-3.5 rounded-xl transition-all text-xs uppercase tracking-wider shadow-sm"
            >
               Go Home
            </button>
            <button 
              type="button"
              onClick={handleSignOut}
              className="flex-1 bg-gray-900 text-white hover:bg-gray-800 font-bold py-3.5 rounded-xl transition-all text-xs uppercase tracking-wider shadow-md flex items-center justify-center gap-2"
            >
               <LogOut size={14} />
               Sign Out
            </button>
          </div>
        </div>
      </div>
    );
  }

  // 4. Authorized, require Password Confirmation
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-55 text-gray-900 dark:text-slate-100 relative z-50 px-4">
        <form onSubmit={handleLogin} className="relative bg-white dark:bg-slate-900 border border-gray-300 dark:border-slate-600 p-8 md:p-12 rounded-3xl w-full max-w-sm text-center shadow-[0_15px_50px_rgba(0,0,0,0.08)] animate-fade-in">
          
          <button 
            type="button"
            onClick={handleBack}
            className="absolute top-6 left-6 inline-flex items-center gap-1 text-purple-600 dark:text-purple-400 hover:text-purple-700 dark:hover:text-purple-300 active:scale-[0.96] bg-purple-50 dark:bg-slate-800 border border-purple-200 dark:border-slate-700 px-3.5 py-1.5 rounded-full shadow-sm font-bold text-[10px] uppercase tracking-wider transition-all duration-300 ease-in-out"
            title="Back to Home"
          >
            <ChevronLeft size={16} strokeWidth={3} />
            <span>Back</span>
          </button>

          <div className="mx-auto bg-purple-50 border border-purple-100 w-16 h-16 rounded-2xl flex items-center justify-center mb-6 text-purple-600 shadow-sm">
             <Key size={24} />
          </div>
          
          <h1 className="text-2xl font-bold font-display text-gray-900 dark:text-slate-100 mb-1">Verify Identity</h1>
          
          <div className="text-xs text-gray-500 dark:text-slate-400 font-medium bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 px-3 py-1.5 rounded-full inline-block mb-8 max-w-full truncate">
            Admin: <span className="font-mono font-bold text-gray-800 dark:text-slate-200">{user.email}</span>
          </div>
          
          <p className="text-gray-500 dark:text-slate-400 text-sm mb-6">Enter your master admin password to decrypt control systems.</p>
          
          <div className="space-y-4">
            <input 
              type="password" 
              value={password} 
              onChange={e => setPassword(e.target.value)} 
              placeholder="Admin Password"
              className="w-full bg-gray-50 dark:bg-slate-800 border border-gray-300 dark:border-slate-600 rounded-xl px-4 py-3.5 text-gray-900 dark:text-slate-100 text-center outline-none focus:border-purple-600 focus:bg-white dark:bg-slate-900 transition-all text-sm placeholder:text-gray-400 font-sans"
              autoFocus
            />
            <button 
              type="submit" 
              disabled={verifyingPassword}
              className="w-full bg-purple-600 text-white font-bold py-3.5 rounded-xl hover:bg-purple-700 transition-all text-xs uppercase tracking-widest shadow-md flex items-center justify-center gap-2"
            >
              {verifyingPassword && <Loader2 size={14} className="animate-spin" />}
              Unlock Console
            </button>
            <button 
              type="button"
              onClick={handleSignOut}
              className="text-xs text-gray-400 hover:text-red-500 font-bold uppercase tracking-wider transition-colors pt-2 block mx-auto"
            >
              Switch Account
            </button>
          </div>
        </form>
      </div>
    );
  }

  // Permitted Admin User verified successfully
  return <>{children}</>;
};
