import { toast } from "react-hot-toast";
import React, { useState, useEffect, useRef } from 'react';
import { Helmet } from 'react-helmet-async';
import { User, Order, OrderStatus } from '../types';
import { listenToOrders, updateOrder } from '../services/storageService';
import { handleSingleDownload, handleBulkDownload } from '../utils/downloadHelpers';
import { Package, Clock, MessageSquare, ArrowRight, User as UserIcon, Download, Loader2, Edit2, ArrowDown, ChevronLeft, Search, X } from 'lucide-react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { ClientProfile } from '../components/ClientProfile';
import { downloadInvoice } from '../utils/invoiceGenerator';

interface ClientDashboardProps {
  user: User | null;
  onLogout?: () => void;
}

export const ClientDashboard: React.FC<ClientDashboardProps> = ({ user, onLogout }) => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [showBackButton, setShowBackButton] = useState(true);
  const [historySearchQuery, setHistorySearchQuery] = useState('');
  const [projectSearchQuery, setProjectSearchQuery] = useState('');
  const lastScrollY = useRef(0);

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
  
  const [searchParams, setSearchParams] = useSearchParams();
  const tabFromUrl = searchParams.get('tab');

  const [activeTab, setActiveTab] = useState<'projects' | 'history' | 'profile'>(
    (tabFromUrl as any) || 'projects'
  );

  useEffect(() => {
    if (tabFromUrl) {
      setActiveTab(tabFromUrl as any);
    } else {
      setActiveTab('projects');
    }
  }, [tabFromUrl]);

  const handleTabChange = (tab: 'projects' | 'history' | 'profile') => {
    setActiveTab(tab);
    setSearchParams({ tab });
  };
  const navigate = useNavigate();

  useEffect(() => {
    if (!user) {
      if (!searchParams.get('auth')) {
         const params = new URLSearchParams(searchParams);
         params.set('auth', 'login');
         navigate(`/dashboard?${params.toString()}`, { replace: true });
      }
      return;
    }
    const unsubscribe = listenToOrders((data) => {
      // Filter orders by logged in user's email
      const userOrders = data.filter(o => o.email.toLowerCase() === user.email.toLowerCase());
      setOrders(userOrders);
      setLoading(false);
    });
    return () => unsubscribe();
  }, [user, navigate]);

  const requestRevision = async (orderId: string, notes: string) => {
    if (!notes.trim()) {
      toast("Please enter details for the revision.");
      return;
    }
    const order = orders.find(o => o.id === orderId);
    if (!order) return;
    
    try {
      await updateOrder({
        ...order,
        status: OrderStatus.REVISION,
        revisionNotes: notes,
      });
      import('../services/telegramService').then(({ sendRevisionRequestedNotification }) => {
          sendRevisionRequestedNotification(order, notes).catch(console.error);
      }).catch(console.error);
      toast("Revision requested successfully! We will review it shortly.");
    } catch (error) {
      console.error(error);
      toast("Failed to push revision request.");
    }
  };

  if (!user) return null;

  return (
    <div className={`min-h-[100dvh] pb-20 px-4 md:px-8 relative overflow-hidden ${activeTab === 'profile' ? 'pt-16 md:pt-32' : 'pt-32'}`}>
      <Helmet>
        <title>{activeTab === 'profile' ? 'Profile & Settings' : 'Client Dashboard'} | Ranthula | Buisness portfolio</title>
        <meta name="description" content="View and manage your project orders and revisions." />
      </Helmet>
      <div className="max-w-5xl mx-auto relative z-10">
        {activeTab !== 'profile' && (
          <>
            <div className="flex flex-col md:flex-row md:items-end justify-between mb-16 gap-6">
               <div>
                  <h1 className="text-5xl md:text-6xl font-display uppercase tracking-tighter text-gray-900 dark:text-white mb-4 mix-blend-difference">My Dashboard</h1>
                  <p className="text-gray-500 dark:text-gray-400 text-lg font-medium">Track your projects and manage settings.</p>
               </div>
               <InteractiveButton onClick={() => navigate('/order')}>
                   New Project
               </InteractiveButton>
            </div>

            <div className="flex flex-wrap gap-4 sm:gap-8 border-b border-gray-200 dark:border-zinc-700 mb-8">
                <button 
                    onClick={() => handleTabChange('projects')}
                    className={`pb-4 px-2 font-bold uppercase tracking-widest text-xs transition-colors border-b-2 flex items-center gap-2 ${activeTab === 'projects' ? 'border-purple-600 text-purple-600' : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-slate-100'}`}
                >
                    <Package size={14} /> My Projects
                </button>
                <button 
                    onClick={() => handleTabChange('history')}
                    className={`pb-4 px-2 font-bold uppercase tracking-widest text-xs transition-colors border-b-2 flex items-center gap-2 ${activeTab === 'history' ? 'border-purple-600 text-purple-600' : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-slate-100'}`}
                >
                    <Clock size={14} /> Order History
                </button>
                <button 
                    onClick={() => handleTabChange('profile')}
                    style={{ display: 'none' }}
                    className={`pb-4 px-2 font-bold uppercase tracking-widest text-xs transition-colors border-b-2 flex items-center gap-2 ${(activeTab as string) === 'profile' ? 'border-purple-600 text-purple-600' : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-slate-100'}`}
                >
                    <UserIcon size={14} /> Profile & Settings
                </button>
            </div>
          </>
        )}

        {activeTab === 'profile' ? (
           <ClientProfile user={user} onLogout={onLogout} />
        ) : loading ? (
          <div className="space-y-6">
            {[1, 2, 3].map((i) => (
              <div key={i} className="animate-pulse bg-white/80 dark:bg-zinc-900/80 backdrop-blur-xl border border-gray-300 dark:border-zinc-600 rounded-3xl p-8 shadow-[0_8px_32px_rgba(0,0,0,0.12)] flex flex-col md:flex-row gap-8 items-start">
                <div className="flex-1 w-full space-y-6">
                  <div className="flex justify-between items-start">
                    <div className="space-y-3">
                      <div className="w-24 h-6 bg-gray-200 dark:bg-zinc-800 rounded-full"></div>
                      <div className="w-32 h-8 bg-gray-200 dark:bg-zinc-800 rounded-lg"></div>
                      <div className="w-20 h-4 bg-gray-200 dark:bg-zinc-800 rounded"></div>
                    </div>
                    <div className="w-24 h-8 bg-gray-200 dark:bg-zinc-800 rounded-full"></div>
                  </div>
                  <div className="w-64 h-12 bg-gray-100 dark:bg-zinc-800 rounded-2xl"></div>
                  <div className="flex gap-3">
                    <div className="w-32 h-12 bg-gray-200 dark:bg-zinc-800 rounded-full"></div>
                    <div className="w-32 h-12 bg-gray-100 dark:bg-zinc-800 rounded-full"></div>
                  </div>
                </div>
                <div className="w-full md:w-64 h-64 rounded-3xl bg-gray-200 dark:bg-zinc-800 shrink-0"></div>
              </div>
            ))}
          </div>
        ) : activeTab === 'projects' ? (
          (() => {
            const activeOrders = orders.filter(o => o.status !== OrderStatus.COMPLETED && o.status !== OrderStatus.CANCELLED);
            if (activeOrders.length === 0) {
              return (
                <div className="bg-white/80 dark:bg-zinc-900/80 backdrop-blur-xl border border-gray-300 dark:border-zinc-600 rounded-3xl p-16 text-center shadow-[0_8px_32px_rgba(0,0,0,0.12)] flex flex-col items-center">
                   <div className="w-24 h-24 bg-gray-50 dark:bg-zinc-800 rounded-full flex items-center justify-center mb-6">
                      <Package size={40} className="text-gray-300 dark:text-slate-600" />
                   </div>
                   <h3 className="text-2xl font-bold mb-3 text-gray-800 dark:text-gray-200">No Active Projects</h3>
                   <p className="text-gray-500 dark:text-gray-400 max-w-sm mb-8 text-lg">Looks like you don't have any active projects with us.</p>
                   <InteractiveButton onClick={() => navigate('/order')}>Start a Project</InteractiveButton>
                </div>
              );
            }

            const filteredActiveOrders = activeOrders.filter(order => {
              const query = projectSearchQuery.toLowerCase().trim();
              if (!query) return true;
              
              const matchesId = order.id.toLowerCase().includes(query);
              const eventTitle = order.customFields?.['Event Title'] || '';
              const matchesEvent = typeof eventTitle === 'string' && eventTitle.toLowerCase().includes(query);
              const matchesService = order.serviceType.toLowerCase().includes(query);
              
              return matchesId || matchesEvent || matchesService;
            });

            return (
              <div className="space-y-6">
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-gray-400 dark:text-gray-500">
                    <Search size={18} />
                  </div>
                  <input
                    type="text"
                    placeholder="Search active projects by ID, Event Title, or Service Type..."
                    value={projectSearchQuery}
                    onChange={(e) => setProjectSearchQuery(e.target.value)}
                    className="w-full pl-11 pr-10 py-4 bg-white/60 dark:bg-zinc-900/60 backdrop-blur-md border border-gray-300 dark:border-zinc-700/60 rounded-2xl text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all shadow-sm placeholder-gray-400 dark:placeholder-slate-500 font-medium text-sm"
                  />
                  {projectSearchQuery && (
                    <button
                      onClick={() => setProjectSearchQuery('')}
                      className="absolute inset-y-0 right-0 pr-4 flex items-center text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-slate-300 transition-colors"
                    >
                      <X size={18} />
                    </button>
                  )}
                </div>

                {filteredActiveOrders.length === 0 ? (
                  <div className="bg-white/80 dark:bg-zinc-900/80 backdrop-blur-xl border border-gray-300 dark:border-zinc-600 rounded-3xl p-12 text-center shadow-[0_8px_32px_rgba(0,0,0,0.12)] flex flex-col items-center">
                     <div className="w-16 h-16 bg-gray-50 dark:bg-zinc-800 rounded-full flex items-center justify-center mb-4">
                        <Search size={28} className="text-gray-300 dark:text-slate-600" />
                     </div>
                     <h3 className="text-xl font-bold mb-2 text-gray-800 dark:text-gray-200">No matching projects</h3>
                     <p className="text-gray-500 dark:text-gray-400 max-w-sm text-sm">We couldn't find any active projects matching "{projectSearchQuery}".</p>
                  </div>
                ) : (
                  <div className="space-y-6">
                    {filteredActiveOrders.map(order => (
                      <ProjectCard key={order.id} order={order} onRequestRevision={(notes) => requestRevision(order.id, notes)} />
                    ))}
                  </div>
                )}
              </div>
            );
          })()
        ) : activeTab === 'history' ? (
          (() => {
            const pastOrders = orders.filter(o => o.status === OrderStatus.COMPLETED || o.status === OrderStatus.CANCELLED);
            if (pastOrders.length === 0) {
              return (
                <div className="bg-white/80 dark:bg-zinc-900/80 backdrop-blur-xl border border-gray-300 dark:border-zinc-600 rounded-3xl p-16 text-center shadow-[0_8px_32px_rgba(0,0,0,0.12)] flex flex-col items-center">
                   <div className="w-24 h-24 bg-gray-50 dark:bg-zinc-800 rounded-full flex items-center justify-center mb-6">
                      <Clock size={40} className="text-gray-300 dark:text-slate-600" />
                   </div>
                   <h3 className="text-2xl font-bold mb-3 text-gray-800 dark:text-gray-200">No Past Projects</h3>
                   <p className="text-gray-500 dark:text-gray-400 max-w-sm mb-8 text-lg">Your completed and cancelled projects will appear here.</p>
                </div>
              );
            }

            const filteredPastOrders = pastOrders.filter(order => {
              const query = historySearchQuery.toLowerCase().trim();
              if (!query) return true;
              
              const matchesId = order.id.toLowerCase().includes(query);
              const eventTitle = order.customFields?.['Event Title'] || '';
              const matchesEvent = typeof eventTitle === 'string' && eventTitle.toLowerCase().includes(query);
              const matchesService = order.serviceType.toLowerCase().includes(query);
              
              return matchesId || matchesEvent || matchesService;
            });

            return (
              <div className="space-y-6">
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-gray-400 dark:text-gray-500">
                    <Search size={18} />
                  </div>
                  <input
                    type="text"
                    placeholder="Search past orders by ID, Event Title, or Service Type..."
                    value={historySearchQuery}
                    onChange={(e) => setHistorySearchQuery(e.target.value)}
                    className="w-full pl-11 pr-10 py-4 bg-white/60 dark:bg-zinc-900/60 backdrop-blur-md border border-gray-300 dark:border-zinc-700/60 rounded-2xl text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all shadow-sm placeholder-gray-400 dark:placeholder-slate-500 font-medium text-sm"
                  />
                  {historySearchQuery && (
                    <button
                      onClick={() => setHistorySearchQuery('')}
                      className="absolute inset-y-0 right-0 pr-4 flex items-center text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-slate-300 transition-colors"
                    >
                      <X size={18} />
                    </button>
                  )}
                </div>

                {filteredPastOrders.length === 0 ? (
                  <div className="bg-white/80 dark:bg-zinc-900/80 backdrop-blur-xl border border-gray-300 dark:border-zinc-600 rounded-3xl p-12 text-center shadow-[0_8px_32px_rgba(0,0,0,0.12)] flex flex-col items-center">
                     <div className="w-16 h-16 bg-gray-50 dark:bg-zinc-800 rounded-full flex items-center justify-center mb-4">
                        <Search size={28} className="text-gray-300 dark:text-slate-600" />
                     </div>
                     <h3 className="text-xl font-bold mb-2 text-gray-800 dark:text-gray-200">No matching orders</h3>
                     <p className="text-gray-500 dark:text-gray-400 max-w-sm text-sm">We couldn't find any completed or cancelled orders matching "{historySearchQuery}".</p>
                  </div>
                ) : (
                  <div className="space-y-6">
                    {filteredPastOrders.map(order => (
                      <ProjectCard key={order.id} order={order} onRequestRevision={(notes) => requestRevision(order.id, notes)} />
                    ))}
                  </div>
                )}
              </div>
            );
          })()
        ) : null}
      </div>
    </div>
  );
};

const InteractiveButton = ({ children, onClick, className = '' }: { children: React.ReactNode, onClick: () => void, className?: string }) => {
    return (
        <button 
            onClick={onClick}
            className={`group relative overflow-hidden bg-gray-900 dark:bg-white text-white dark:text-gray-900 px-8 py-4 rounded-full font-bold uppercase tracking-[0.2em] text-xs transition-all duration-300 hover:scale-[1.02] active:scale-[0.98] shadow-lg ${className}`}
        >
            <div className="absolute inset-0 bg-gradient-to-r from-purple-500 via-pink-500 to-orange-400 opacity-0 group-hover:opacity-100 transition-opacity duration-500 ease-out z-0"></div>
            <span className="relative z-10 flex items-center gap-2">
                {children}
            </span>
        </button>
    );
};

const ProjectCard = ({ order, onRequestRevision }: { order: Order; onRequestRevision: (n: string) => void }) => {
  const [notes, setNotes] = useState("");
  const [showRevisionForm, setShowRevisionForm] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
    const [isDownloadingAll, setIsDownloadingAll] = useState(false);
    const [downloadProgress, setDownloadProgress] = useState(0);
  const navigate = useNavigate();

  const isCompleted = order.status === OrderStatus.COMPLETED;
  const isRevision = order.status === OrderStatus.REVISION;

  const STATUS_FLOW = [
    { id: OrderStatus.PENDING, label: 'Placed' },
    { id: OrderStatus.IN_PROGRESS, label: 'Processing' },
    { id: OrderStatus.DRAFT_SENT, label: 'Draft' },
    { id: OrderStatus.COMPLETED, label: 'Done' }
  ];

  const getCurrentStepIndex = (status: OrderStatus) => {
    if (status === OrderStatus.REVISION) return 2;
    if (status === OrderStatus.WAITING_PAYMENT) return 2;
    if (status === OrderStatus.REVIEWING) return 0;
    if (status === OrderStatus.CANCELLED) return -1;
    return STATUS_FLOW.findIndex(s => s.id === status);
  };

  const currentStep = getCurrentStepIndex(order.status);

  return (
    <div className="bg-white/80 dark:bg-zinc-800/80 backdrop-blur-xl border border-gray-300 dark:border-zinc-600/50 rounded-2xl md:rounded-3xl p-5 md:p-8 shadow-[0_8px_32px_rgba(0,0,0,0.12)] dark:shadow-[0_8px_32px_rgba(0,0,0,0.6)] dark:ring-1 dark:ring-white/5 hover:shadow-[0_20px_40px_rgba(0,0,0,0.18)] dark:hover:shadow-[0_20px_40px_rgba(0,0,0,0.8)] transition-all duration-500 flex flex-col md:flex-row gap-6 md:gap-8 items-start group">
      <div className="flex-1 w-full">
        <div className="flex flex-col sm:flex-row sm:justify-between items-start gap-4 mb-6">
          <div>
            <div className="text-[10px] text-purple-600 font-bold uppercase tracking-widest mb-2 bg-purple-50 dark:bg-purple-900/30 dark:text-purple-300 inline-block px-3 py-1 rounded-full">{order.serviceType}</div>
            <h3 className="text-2xl md:text-3xl font-display font-medium text-gray-900 dark:text-white mb-2 mt-1"><span className="text-gray-300 dark:text-gray-500 font-sans">#</span>{order.id.split('-')[1]}</h3>
            <div className="text-sm text-gray-400 dark:text-gray-500 font-medium">{new Date(order.createdAt).toLocaleDateString()}</div>
          </div>
                    <div className={`px-4 py-2 rounded-full text-[10px] font-black uppercase tracking-widest border self-start ${
            order.status === OrderStatus.COMPLETED 
              ? 'bg-green-50 text-green-600 border-green-200 dark:bg-green-900/30 dark:text-green-400 dark:border-green-800' 
              : order.status === OrderStatus.CANCELLED 
                ? 'bg-red-50 text-red-600 border-red-200 dark:bg-red-900/30 dark:text-red-400 dark:border-red-800' 
                : isRevision 
                  ? 'bg-orange-50 text-orange-600 border-orange-200 animate-pulse dark:bg-orange-900/30 dark:text-orange-400 dark:border-orange-800' 
                  : 'bg-purple-50 text-purple-600 border-purple-200 dark:bg-purple-900/30 dark:text-purple-400 dark:border-purple-800'
          }`}>
            {order.status}
          </div>
        </div>

        {order.status !== OrderStatus.CANCELLED && (
           <div className="relative flex justify-between mb-10 w-full max-w-md mt-6 px-2">
              <div className="absolute left-0 top-1/2 -translate-y-1/2 w-full h-1 bg-gray-100 dark:bg-zinc-700 rounded-full" />
              <div 
                className="absolute left-0 top-1/2 -translate-y-1/2 h-1 bg-purple-500 rounded-full transition-all duration-1000" 
                style={{ width: `${(Math.max(0, currentStep) / (STATUS_FLOW.length - 1)) * 100}%` }} 
              />
              {STATUS_FLOW.map((step, idx) => {
                 const isPast = currentStep > idx;
                 const isCurrent = currentStep === idx;
                 return (
                   <div key={step.id} className="relative flex flex-col items-center">
                      <div className={`w-3 h-3 md:w-4 md:h-4 rounded-full border-2 transition-all duration-500 z-10 bg-white dark:bg-zinc-800 ${
                        isPast ? 'border-purple-500 bg-purple-500' : 
                        isCurrent ? 'border-purple-500 ring-4 ring-purple-100 dark:ring-purple-900' : 'border-gray-200 dark:border-zinc-600'
                      }`} />
                      <span className={`absolute top-5 md:top-6 whitespace-nowrap text-[8px] md:text-[9px] uppercase tracking-widest font-bold ${
                        isCurrent ? 'text-purple-600 dark:text-purple-400' : isPast ? 'text-gray-900 dark:text-gray-300' : 'text-gray-400 dark:text-gray-500'
                      }`}>{step.label}</span>
                   </div>
                 );
              })}
           </div>
        )}

        {order.estimatedCompletion && !isCompleted && (
           <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 bg-gray-50 dark:bg-zinc-800 border border-gray-100 dark:border-zinc-700 px-4 py-3 rounded-2xl mb-6 font-medium mt-8">
             <Clock size={16} className="text-purple-500" /> Delivery by: <span className="text-gray-900 dark:text-white font-bold">{order.estimatedCompletion}</span>
           </div>
        )}

        <div className="flex flex-col sm:flex-row flex-wrap gap-3 mt-2 sm:mt-0">
          <InteractiveButton onClick={() => navigate(`/tracking?id=${order.id}`)} className="w-full sm:w-auto px-6 py-4 sm:py-3 text-[15px] sm:text-sm font-bold justify-center rounded-2xl sm:rounded-full active:scale-[0.96]">
            Track Progress <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform sm:w-4 sm:h-4" />
          </InteractiveButton>
          
          {(order.status === OrderStatus.DRAFT_SENT || order.status === OrderStatus.COMPLETED) && (
             <button onClick={() => setShowRevisionForm(!showRevisionForm)} className="w-full sm:w-auto border border-gray-200 dark:border-zinc-700 text-gray-700 dark:text-gray-300 px-6 py-4 sm:py-3 rounded-2xl sm:rounded-full text-[14px] sm:text-xs font-bold sm:font-bold uppercase tracking-widest hover:border-gray-900 hover:text-gray-900 dark:hover:text-slate-100 transition-colors flex items-center justify-center gap-2 active:scale-[0.96]">
                <MessageSquare size={16} className="sm:w-3.5 sm:h-3.5" /> Request Revision
             </button>
          )}

          {isCompleted && (
             <button disabled={isDownloading} onClick={async () => {
                setIsDownloading(true);
                try {
                   await downloadInvoice(order);
                } finally {
                   setIsDownloading(false);
                }
             }} className="w-full sm:w-auto border border-green-200 dark:border-green-800 text-green-700 dark:text-green-400 bg-green-50 dark:bg-green-900/30 px-6 py-4 sm:py-3 rounded-2xl sm:rounded-full text-[14px] sm:text-xs font-bold uppercase tracking-widest hover:bg-green-100 dark:hover:bg-green-900/50 transition-colors flex items-center justify-center gap-2 disabled:opacity-50 active:scale-[0.96]">
                {isDownloading ? <Loader2 size={16} className="animate-spin sm:w-3.5 sm:h-3.5" /> : <Download size={16} className="sm:w-3.5 sm:h-3.5" />} {isDownloading ? 'Working...' : 'Download Invoice'}
             </button>
          )}

          </div>
        
        {isCompleted && order.finalFiles && order.finalFiles.length > 0 && (
          <div className="mt-6 bg-purple-50/50 dark:bg-purple-900/10 border border-purple-100 dark:border-purple-800/30 rounded-3xl p-5 sm:p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-5 shadow-sm">
             <div className="flex items-center gap-4">
                <div className="p-3.5 bg-purple-100 dark:bg-purple-900/40 rounded-xl text-purple-600 dark:text-purple-400 shrink-0">
                   <Package size={24} />
                </div>
                <div>
                   <h4 className="text-gray-900 dark:text-white font-bold text-sm tracking-wide">Final Delivery Package</h4>
                   <p className="text-gray-500 dark:text-gray-400 text-xs font-mono font-medium mt-1 uppercase tracking-widest">{order.finalFiles.length} {order.finalFiles.length === 1 ? 'File' : 'Files'} <span className="mx-1.5 opacity-50">•</span> {(() => {
                       let totalBytes = 0;
                       order.finalFiles.forEach(f => {
                         const base64Str = f.data.split(',')[1] || f.data;
                         totalBytes += base64Str.length * 0.75;
                       });
                       if (totalBytes < 1024 * 1024) return `${(totalBytes / 1024).toFixed(1)} KB`;
                       return `${(totalBytes / (1024 * 1024)).toFixed(1)} MB`;
                   })()}</p>
                </div>
             </div>
             
            <button
              onClick={async () => {
                if (isDownloadingAll) return;
                setIsDownloadingAll(true);
                setDownloadProgress(0);
                if (order.finalFiles.length === 1) {
                  await handleSingleDownload(order.finalFiles[0].data, order.finalFiles[0].name);
                } else {
                  await handleBulkDownload(
                    order.finalFiles.map(f => ({ url: f.data, name: f.name })),
                    `Order_${order.id}_Files`,
                    (prog) => setDownloadProgress(prog)
                  );
                }
                setIsDownloadingAll(false);
              }}
              disabled={isDownloadingAll}
              className="w-full sm:w-auto bg-gray-900 dark:bg-white text-white dark:text-gray-900 shadow-xl dark:shadow-white/10 px-8 py-4 rounded-xl text-sm font-black uppercase tracking-widest hover:bg-black dark:hover:bg-gray-100 hover:shadow-2xl dark:hover:shadow-white/20 transition-all flex items-center justify-center gap-3 group shrink-0 border-2 border-transparent hover:border-gray-700 dark:hover:border-white"
            >
              {isDownloadingAll ? (
                <><Loader2 size={18} className="animate-spin" /> Preparing {order.finalFiles.length > 1 ? `${downloadProgress}/${order.finalFiles.length}` : 'File'}...</>
              ) : (
                <><ArrowDown size={18} className="group-hover:-translate-y-0.5 transition-transform animate-bounce" /> {order.finalFiles.length > 1 ? 'Download Package' : 'Download File'}</>
              )}
            </button>
          </div>
        )}

        {isCompleted && !order.rating && (
           <div className="mt-8 bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 p-6 rounded-3xl border border-purple-100 dark:border-purple-800/50 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
               <div>
                   <h4 className="font-bold text-gray-900 dark:text-white text-sm tracking-wide">How was your experience?</h4>
                   <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Please rate this project to help us improve.</p>
               </div>
               <div className="flex w-full md:w-auto mt-4 md:mt-0">
                   <button onClick={() => navigate(`/tracking?id=${order.id}`)} className="w-full md:w-auto bg-purple-600 dark:bg-purple-500 text-white font-bold uppercase tracking-widest text-[14px] md:text-[10px] px-6 py-4 md:py-3 rounded-2xl md:rounded-full shadow-sm hover:bg-purple-700 dark:hover:bg-purple-600 transition-all active:scale-[0.96]">
                      Review Project
                   </button>
               </div>
           </div>
        )}

        {isCompleted && order.rating && (
           <div className="mt-8 bg-gray-50 dark:bg-zinc-800 p-6 rounded-3xl border border-gray-200 dark:border-zinc-700 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
               <div>
                   <h4 className="font-bold text-gray-900 dark:text-white text-sm tracking-wide">Thank you for your feedback!</h4>
                   <div className="flex gap-1 text-lg my-1">
                      {[1, 2, 3, 4, 5].map(s => <span key={s} className={s <= (order.rating || 0) ? 'text-yellow-400' : 'text-gray-300 dark:text-slate-600'}>★</span>)}
                   </div>
               </div>
               <div className="flex w-full md:w-auto mt-4 md:mt-0">
                   <button onClick={() => navigate(`/tracking?id=${order.id}`)} className="w-full justify-center md:w-auto text-purple-600 dark:text-purple-400 font-bold uppercase tracking-widest text-[14px] md:text-[10px] px-6 py-4 md:py-3 rounded-2xl md:rounded-full border border-purple-200 dark:border-purple-800 shadow-sm hover:bg-purple-50 dark:hover:bg-purple-900/30 transition-all flex items-center gap-2 active:scale-[0.96]">
                      <Edit2 size={16} className="md:w-3.5 md:h-3.5" /> Edit Review
                   </button>
               </div>
           </div>
        )}

        {showRevisionForm && (
          <div className="mt-8 bg-gray-50 dark:bg-zinc-800 p-6 rounded-3xl border border-gray-200 dark:border-zinc-700 animate-fade-in text-left">
            <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-3">Revision Details</label>
            <textarea
              value={notes}
              onChange={e => setNotes(e.target.value)}
              placeholder="What would you like to change?"
              className="w-full bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-700 rounded-2xl p-4 text-sm text-gray-900 dark:text-white outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-100 min-h-[120px] mb-4 transition-all"
            />
            <div className="flex justify-end gap-3">
               <button onClick={() => setShowRevisionForm(false)} className="text-xs text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-slate-100 uppercase font-bold p-3">Cancel</button>
               <InteractiveButton 
                 onClick={() => { onRequestRevision(notes); setShowRevisionForm(false); }}
                 className="px-6 py-3"
               >
                 Submit Request
               </InteractiveButton>
            </div>
          </div>
        )}
      </div>

      {order.draftImg && (
        <div className="w-full md:w-64 h-64 rounded-3xl overflow-hidden border border-gray-200 dark:border-zinc-700 shrink-0 relative group-hover:border-gray-300 dark:border-zinc-600 transition-all duration-500 shadow-sm">
          <img src={order.draftImg} alt="Draft" loading="lazy" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
          <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-gray-900/80 to-transparent p-4">
             <div className="text-[10px] font-bold text-gray-700 dark:text-gray-300 uppercase tracking-widest">Latest Draft</div>
          </div>
        </div>
      )}
    </div>
  );
};
