import React, { useState, useEffect } from 'react';
import { X, Mail, AlertCircle, ArrowRight, Loader, Lock, Info, Eye, EyeOff } from 'lucide-react';
import { createUserWithEmailAndPassword, signInWithEmailAndPassword, signInWithPopup } from 'firebase/auth';
import { auth, googleProvider, facebookProvider } from '../services/firebase';
import { toast } from 'react-hot-toast';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLogin: (provider: string) => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose, onLogin }) => {
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [promptData, setPromptData] = useState<{
    type: 'signUp' | 'signIn' | null;
    message: string;
  }>({ type: null, message: '' });

  useEffect(() => {
    if (isOpen) {
      setError('');
      setEmail('');
      setPassword('');
      setShowPassword(false);
      setIsSignUp(false);
      setPromptData({ type: null, message: '' });
    }
  }, [isOpen]);

  if (!isOpen) {
    return null;
  }

  const executeAuth = async (isCreating: boolean) => {
    setIsLoading(true);
    setError('');
    
    try {
      if (isCreating) {
        await createUserWithEmailAndPassword(auth, email, password);
        toast.success('Account created successfully!');
      } else {
        await signInWithEmailAndPassword(auth, email, password);
        toast.success('Signed in successfully!');
      }
      onClose();
    } catch (err: any) {
      console.error(err);
      if (err.code === 'auth/email-already-in-use') {
        setPromptData({
          type: 'signIn',
          message: 'Account already exists. Sign in instead?'
        });
      } else if (err.code === 'auth/wrong-password' || err.code === 'auth/user-not-found' || err.code === 'auth/invalid-credential') {
        if (!isCreating) {
          setPromptData({
            type: 'signUp',
            message: 'Account not found. Create new account?'
          });
        } else {
          setError('Invalid email or password.');
          toast.error('Invalid email or password.');
        }
      } else if (err.code === 'auth/weak-password') {
        setError('Password should be at least 6 characters.');
        toast.error('Password should be at least 6 characters.');
      } else {
        setError('Authentication failed. Please try again.');
        toast.error('Authentication failed. Please try again.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password.trim()) {
      setError('Please fill in all fields.');
      return;
    }
    executeAuth(isSignUp);
  };

  const handlePromptYes = () => {
    const isCreating = promptData.type === 'signUp';
    setIsSignUp(isCreating);
    setPromptData({ type: null, message: '' });
    executeAuth(isCreating);
  };

  const handlePromptNo = () => {
    setPromptData({ type: null, message: '' });
  };

  const handleGoogleLogin = async () => {
    try {
      await signInWithPopup(auth, googleProvider);
      onClose();
    } catch (err: any) {
      console.error(err);
      if (err.code === 'auth/popup-closed-by-user') {
        setError('Sign-in window was closed before completion. Please try again.');
      } else {
        setError('Google sign-in failed.');
      }
    }
  };

  const handleFacebookLogin = async () => {
    try {
      await signInWithPopup(auth, facebookProvider);
      onClose();
    } catch (err: any) {
      console.error(err);
      if (err.code === 'auth/popup-closed-by-user') {
        setError('Sign-in window was closed before completion. Please try again.');
      } else {
        setError('Facebook sign-in failed.');
      }
    }
  };

  const toggleMode = () => {
    setIsSignUp(!isSignUp);
    setError('');
    setEmail('');
    setPassword('');
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/80 backdrop-blur-sm transition-opacity" onClick={onClose}></div>
      
      {/* Modal */}
      <div className="relative bg-[#111] border border-white/10 rounded-3xl w-full max-w-md p-8 shadow-[0_0_50px_rgba(213,0,249,0.15)] animate-fade-in overflow-hidden">
        <button onClick={onClose} className="absolute top-6 right-6 text-white/30 hover:text-white transition-colors z-20">
          <X size={24} />
        </button>

        <div className="text-center mb-8 relative z-10">
          <h2 className="text-3xl font-display text-white mb-2">{isSignUp ? 'Create Account' : 'Welcome Back'}</h2>
          <p className="text-white/50 text-sm">{isSignUp ? 'Join us to start your creative journey' : 'Sign in to manage your design projects'}</p>
        </div>

        <button 
          onClick={handleGoogleLogin}
          className="w-full bg-white text-black font-bold text-sm py-3.5 rounded-xl hover:bg-gray-200 transition-colors flex items-center justify-center gap-3 mb-3"
        >
          <svg viewBox="0 0 24 24" width="18" height="18" xmlns="http://www.w3.org/2000/svg">
            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
            <path d="M1 1h22v22H1z" fill="none"/>
          </svg>
          Continue with Google
        </button>

        <button 
          onClick={handleFacebookLogin}
          className="w-full bg-[#1877F2] text-white font-bold text-sm py-3.5 rounded-xl hover:bg-[#1565C0] transition-colors flex items-center justify-center gap-3 mb-6"
        >
          <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
            <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
          </svg>
          Continue with Facebook
        </button>

        <div className="flex items-center py-4 mb-2">
          <div className="flex-grow border-t border-white/10"></div>
          <span className="flex-shrink-0 mx-4 text-white/30 text-[10px] font-bold tracking-widest uppercase">OR CONTINUE WITH EMAIL</span>
          <div className="flex-grow border-t border-white/10"></div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 relative z-10">
          <div>
            <div className="relative">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-white/30" size={18} />
              <input 
                type="email" 
                placeholder="name@example.com" 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full bg-black/40 border border-white/10 rounded-xl py-3.5 pl-12 pr-4 text-white text-sm outline-none focus:border-[#d500f9] focus:bg-black/60 transition-all placeholder:text-white/20"
              />
            </div>
            {isSignUp && (
              <p className="text-[11px] text-white/40 mt-1.5 ml-1 flex items-center gap-1">
                <Info size={12} /> We'll never share your email with anyone else.
              </p>
            )}
          </div>
          
          <div>
            <div className="relative">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-white/30" size={18} />
              <input 
                type={showPassword ? "text" : "password"}
                placeholder="••••••••" 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full bg-black/40 border border-white/10 rounded-xl py-3.5 pl-12 pr-12 text-white text-sm outline-none focus:border-[#d500f9] focus:bg-black/60 transition-all placeholder:text-white/20"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-white/30 hover:text-white transition-colors"
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
            {isSignUp && (
              <p className="text-[11px] text-white/40 mt-1.5 ml-1 flex items-center gap-1">
                <Info size={12} /> Password must be at least 6 characters long.
              </p>
            )}
          </div>

          {error && (
            <div className="flex items-center gap-2 text-red-400 text-xs font-bold bg-red-400/10 p-3 rounded-lg border border-red-400/20 animate-fade-in">
              <AlertCircle size={14} className="shrink-0" />
              {error}
            </div>
          )}

          <div className="flex flex-col gap-4 pt-2">
            <button 
              type="submit" 
              disabled={isLoading || !email.trim() || !password.trim()}
              className="w-full bg-[#d500f9] text-white font-bold font-sans py-3.5 rounded-xl flex items-center justify-center gap-2 hover:bg-[#b000cc] transition-all shadow-lg hover:scale-[1.01] disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {isLoading ? <Loader size={18} className="animate-spin" /> : (
                <>
                  {isSignUp ? 'Create Account' : 'Sign In'}
                  <ArrowRight size={18} />
                </>
              )}
            </button>

            <div className="flex items-center justify-center gap-3 mt-2">
               <span className="text-[12px] text-white/50">
                 {isSignUp ? 'Already have an account?' : "Don't have an account?"}
               </span>
               <button 
                type="button"
                onClick={toggleMode}
                className="text-[#d500f9] font-bold hover:text-white transition-colors text-[12px]"
              >
                {isSignUp ? 'Sign In' : 'Create Account'}
              </button>
            </div>
          </div>
        </form>

        {promptData.type && (
          <div className="absolute inset-0 bg-[#111]/95 z-50 flex flex-col items-center justify-center p-8 text-center animate-fade-in backdrop-blur-md">
            <AlertCircle size={48} className="text-[#d500f9] mb-6" />
            <h3 className="text-xl font-bold text-white mb-8 leading-tight">{promptData.message}</h3>
            <div className="flex items-center gap-4 w-full">
              <button 
                type="button"
                onClick={handlePromptNo}
                className="flex-1 py-3.5 rounded-xl font-bold text-white bg-white/10 hover:bg-white/20 transition-colors"
              >
                No
              </button>
              <button 
                type="button"
                onClick={handlePromptYes}
                className="flex-1 py-3.5 rounded-xl font-bold text-white bg-[#d500f9] hover:bg-[#b000cc] transition-colors"
              >
                Yes
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
