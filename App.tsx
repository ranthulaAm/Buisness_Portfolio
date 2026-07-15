import React, { useState, useEffect } from 'react';
import { HashRouter as Router, Routes, Route, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { Navbar } from './components/Navbar';
import { Footer } from './components/Footer';
import { AuthModal } from './components/AuthModal';
import { IntroSequence } from './components/IntroSequence';
import { AdminGuard } from './components/AdminGuard';
import { Home } from './pages/Home';
import { Order } from './pages/Order';
import { Tracking } from './pages/Tracking';
import { AdminDashboard } from './pages/AdminDashboard';
import { ClientDashboard } from './pages/ClientDashboard';
import { SharedProjectView } from './pages/SharedProjectView';
import { User } from './types';
import { saveUserProfile } from './services/storageService';
import { auth } from './services/firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { trackPresence } from './services/dataService';

// ScrollToTop component to reset scroll position on every route change
const ScrollToTop = () => {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo({
      top: 0,
      left: 0,
      behavior: 'instant'
    });
  }, [pathname]);
  return null;
};

const AppContent: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [user, setUser] = useState<User | null>(null);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  
  // Track Presence
  useEffect(() => {
    trackPresence(user, location.pathname);
    const interval = setInterval(() => trackPresence(user, location.pathname), 30000);
    return () => clearInterval(interval);
  }, [user, location.pathname]);

  
  // Sync auth modal with URL
  useEffect(() => {
     const params = new URLSearchParams(location.search);
     if (params.get('auth') === 'login' && !isAuthModalOpen) {
         setIsAuthModalOpen(true);
     } else if (!params.get('auth') && isAuthModalOpen) {
         setIsAuthModalOpen(false);
     }
  }, [location.search]);

  const openAuthModal = () => {
      const params = new URLSearchParams(location.search);
      params.set('auth', 'login');
      navigate(`${location.pathname}?${params.toString()}`, { replace: false });
  };

  const closeAuthModal = () => {
      const params = new URLSearchParams(location.search);
      params.delete('auth');
      navigate(`${location.pathname}?${params.toString()}`, { replace: false });
  };

  // Intro State
  const [showIntro, setShowIntro] = useState(() => {
     // If user is accessing a deep link (like /tracking or /dashboard), skip the intro entirely.
     return location.pathname === '/';
  });

  // Firebase Auth Listener
  useEffect(() => {
    import('firebase/auth').then(({ signInAnonymously }) => {
      const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
        if (firebaseUser && !firebaseUser.isAnonymous) {
           const appUser: User = {
            id: firebaseUser.uid,
            name: firebaseUser.displayName || firebaseUser.email?.split('@')[0] || 'User',
            email: firebaseUser.email || '',
            avatar: firebaseUser.photoURL || `https://api.dicebear.com/7.x/shapes/svg?seed=${firebaseUser.uid}`,
            provider: 'email',
            createdAt: firebaseUser.metadata.creationTime || new Date().toISOString(),
          };
          setUser(appUser);
          saveUserProfile(appUser).catch(console.error);
        } else if (!firebaseUser) {
          setUser(null);
          // Removed signInAnonymously to prevent admin-restricted-operation error
        } else {
          // Is anonymous
          setUser(null);
        }
      });

      return () => unsubscribe();
    });
  }, [navigate]);

  // Handle returning to intro from Admin
  useEffect(() => {
    if (location.state && (location.state as any).showIntro) {
      setShowIntro(true);
    }
  }, [location]);

  // Determine if it's admin route
  const isAdmin = location.pathname.startsWith('/admin');

  const handleLogout = async () => {
    try {
      await auth.signOut();
      navigate('/');
    } catch (error) {
      console.error("Logout failed", error);
    }
  };

  const handleIntroComplete = () => {
    setShowIntro(false);
    // Navigation is now handled inside IntroSequence
  };

  return (
    <>
      {!isAdmin && <div className="fixed inset-0 w-full h-full -z-10 bg-gray-50 dark:bg-slate-800" />}
      {showIntro && (
        <IntroSequence 
          onComplete={handleIntroComplete} 
          skipAnimation={location.state && (location.state as any).skipAnimation} 
        />
      )}

      <div className={`relative min-h-screen overflow-x-hidden font-sans selection:bg-accent-magenta selection:text-white flex flex-col transition-opacity duration-1000 ${showIntro ? 'opacity-0' : 'opacity-100'}`}>
        
        {/* Scroll restoration */}
        <ScrollToTop />
        
        <div className="relative z-10 flex flex-col min-h-screen">
          <Navbar 
            user={user} 
            onLoginClick={openAuthModal} 
            onLogout={handleLogout} 
          />
          
          <main className="flex-grow">
            <Routes>
              <Route path="/" element={<Home user={user} onLoginClick={openAuthModal} />} />
              <Route 
                path="/order" 
                element={<Order user={user} onLoginRequest={openAuthModal} />} 
              />
              <Route 
                path="/tracking" 
                element={<Tracking user={user} />} 
              />
              <Route 
                path="/share/:shareId" 
                element={<SharedProjectView />} 
              />
              <Route 
                path="/admin" 
                element={
                  <AdminGuard user={user}>
                    <AdminDashboard user={user} />
                  </AdminGuard>
                } 
              />
              <Route 
                path="/dashboard" 
                element={<ClientDashboard user={user} />} 
              />
              <Route path="*" element={<Navigate to="/" />} />
            </Routes>
          </main>

          {!isAdmin && <Footer />}
        </div>
        
        <AuthModal 
          isOpen={isAuthModalOpen} 
          onClose={closeAuthModal} 
          onLogin={() => {}} // No longer needed as AuthModal handles logic
        />
      </div>
    </>
  );
};

const App: React.FC = () => {
  return (
    <Router>
      <AppContent />
    </Router>
  );
};

export default App;