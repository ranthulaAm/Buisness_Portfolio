import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet-async';
import { User, Order, OrderStatus } from '../types';
import { listenToOrders, updateOrder } from '../services/storageService';
import { Package, Clock, MessageSquare, ArrowRight, User as UserIcon, Download, Loader2, Edit2 } from 'lucide-react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { ClientProfile } from '../components/ClientProfile';
import { downloadInvoice } from '../utils/invoiceGenerator';

interface ClientDashboardProps {
  user: User | null;
}

export const ClientDashboard: React.FC<ClientDashboardProps> = ({ user }) => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [searchParams, setSearchParams] = useSearchParams();
  const tabFromUrl = searchParams.get('tab');

  const [activeTab, setActiveTab] = useState<'projects' | 'profile'>(
    (tabFromUrl as any) || 'projects'
  );

  useEffect(() => {
    if (tabFromUrl) {
      setActiveTab(tabFromUrl as any);
    }
  }, [tabFromUrl]);

  const handleTabChange = (tab: 'projects' | 'profile') => {
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
      alert("Please enter details for the revision.");
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
      alert("Revision requested successfully! We will review it shortly.");
    } catch (error) {
      console.error(error);
      alert("Failed to push revision request.");
    }
  };

  if (!user) return null;

  return (
    <div className="min-h-screen pt-32 pb-20 px-4 md:px-8 relative overflow-hidden">
      <Helmet>
        <title>Client Dashboard | Ranthula | Buisness portfolio</title>
        <meta name="description" content="View and manage your project orders and revisions." />
      </Helmet>
      <div className="max-w-5xl mx-auto relative z-10">
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-16 gap-6">
           <div>
              <button 
                  onClick={() => navigate('/')} 
                  className="flex items-center gap-2 text-gray-500 dark:text-slate-400 hover:text-gray-900 dark:text-slate-100 transition-colors uppercase tracking-widest text-xs font-bold mb-6"
              >
                 <ArrowRight size={14} className="rotate-180" /> Back to Home
              </button>
              <h1 className="text-5xl md:text-6xl font-display uppercase tracking-tighter text-gray-900 dark:text-slate-100 mb-4 mix-blend-difference">My Dashboard</h1>
              <p className="text-gray-500 dark:text-slate-400 text-lg font-medium">Track your projects and manage settings.</p>
           </div>
           <InteractiveButton onClick={() => navigate('/order')}>
               New Project
           </InteractiveButton>
        </div>

        <div className="flex gap-8 border-b border-gray-200 dark:border-slate-700 mb-8">
            <button 
                onClick={() => handleTabChange('projects')}
                className={`pb-4 px-2 font-bold uppercase tracking-widest text-xs transition-colors border-b-2 ${activeTab === 'projects' ? 'border-purple-600 text-purple-600' : 'border-transparent text-gray-500 dark:text-slate-400 hover:text-gray-900 dark:text-slate-100'}`}
            >
                My Projects
            </button>
            <button 
                onClick={() => handleTabChange('profile')}
                className={`pb-4 px-2 font-bold uppercase tracking-widest text-xs transition-colors border-b-2 flex items-center gap-2 ${activeTab === 'profile' ? 'border-purple-600 text-purple-600' : 'border-transparent text-gray-500 dark:text-slate-400 hover:text-gray-900 dark:text-slate-100'}`}
            >
                <UserIcon size={14} /> Profile & Settings
            </button>
        </div>

        {activeTab === 'profile' ? (
           <ClientProfile user={user} />
        ) : loading ? (
          <div className="space-y-6">
            {[1, 2, 3].map((i) => (
              <div key={i} className="animate-pulse bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border border-gray-300 dark:border-slate-600 rounded-3xl p-8 shadow-[0_8px_32px_rgba(0,0,0,0.12)] flex flex-col md:flex-row gap-8 items-start">
                <div className="flex-1 w-full space-y-6">
                  <div className="flex justify-between items-start">
                    <div className="space-y-3">
                      <div className="w-24 h-6 bg-gray-200 rounded-full"></div>
                      <div className="w-32 h-8 bg-gray-200 rounded-lg"></div>
                      <div className="w-20 h-4 bg-gray-200 rounded"></div>
                    </div>
                    <div className="w-24 h-8 bg-gray-200 rounded-full"></div>
                  </div>
                  <div className="w-64 h-12 bg-gray-100 dark:bg-slate-800 rounded-2xl"></div>
                  <div className="flex gap-3">
                    <div className="w-32 h-12 bg-gray-200 rounded-full"></div>
                    <div className="w-32 h-12 bg-gray-100 dark:bg-slate-800 rounded-full"></div>
                  </div>
                </div>
                <div className="w-full md:w-64 h-64 rounded-3xl bg-gray-200 shrink-0"></div>
              </div>
            ))}
          </div>
        ) : orders.length === 0 ? (
          <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border border-gray-300 dark:border-slate-600 rounded-3xl p-16 text-center shadow-[0_8px_32px_rgba(0,0,0,0.12)] flex flex-col items-center">
             <div className="w-24 h-24 bg-gray-50 dark:bg-slate-800 rounded-full flex items-center justify-center mb-6">
                <Package size={40} className="text-gray-300" />
             </div>
             <h3 className="text-2xl font-bold mb-3 text-gray-800 dark:text-slate-200">No Projects Yet</h3>
             <p className="text-gray-500 dark:text-slate-400 max-w-sm mb-8 text-lg">Looks like you don't have any active or past projects with us.</p>
             <InteractiveButton onClick={() => navigate('/order')}>Start a Project</InteractiveButton>
          </div>
        ) : (
          <div className="space-y-6">
            {orders.map(order => (
              <ProjectCard key={order.id} order={order} onRequestRevision={(notes) => requestRevision(order.id, notes)} />
            ))}
          </div>
        )}
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
    <div className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-xl border border-gray-300 dark:border-slate-600/50 rounded-2xl md:rounded-3xl p-5 md:p-8 shadow-[0_8px_32px_rgba(0,0,0,0.12)] dark:shadow-[0_8px_32px_rgba(0,0,0,0.6)] dark:ring-1 dark:ring-white/5 hover:shadow-[0_20px_40px_rgba(0,0,0,0.18)] dark:hover:shadow-[0_20px_40px_rgba(0,0,0,0.8)] transition-all duration-500 flex flex-col md:flex-row gap-6 md:gap-8 items-start group">
      <div className="flex-1 w-full">
        <div className="flex flex-col sm:flex-row sm:justify-between items-start gap-4 mb-6">
          <div>
            <div className="text-[10px] text-purple-600 font-bold uppercase tracking-widest mb-2 bg-purple-50 dark:bg-purple-900/30 dark:text-purple-300 inline-block px-3 py-1 rounded-full">{order.serviceType}</div>
            <h3 className="text-2xl md:text-3xl font-display font-medium text-gray-900 dark:text-slate-100 mb-2 mt-1"><span className="text-gray-300 dark:text-slate-500 font-sans">#</span>{order.id.split('-')[1]}</h3>
            <div className="text-sm text-gray-400 font-medium">{new Date(order.createdAt).toLocaleDateString()}</div>
          </div>
          <div className={`px-4 py-2 rounded-full text-[10px] font-black uppercase tracking-widest border self-start ${isCompleted ? 'bg-green-50 text-green-600 border-green-200 dark:bg-green-900/30 dark:text-green-400 dark:border-green-800' : isRevision ? 'bg-orange-50 text-orange-600 border-orange-200 animate-pulse dark:bg-orange-900/30 dark:text-orange-400 dark:border-orange-800' : 'bg-purple-50 text-purple-600 border-purple-200 dark:bg-purple-900/30 dark:text-purple-400 dark:border-purple-800'}`}>
            {order.status}
          </div>
        </div>

        {order.status !== OrderStatus.CANCELLED && (
           <div className="relative flex justify-between mb-10 max-w-md mt-6">
              <div className="absolute left-0 top-1/2 -translate-y-1/2 w-full h-1 bg-gray-100 dark:bg-slate-700 rounded-full" />
              <div 
                className="absolute left-0 top-1/2 -translate-y-1/2 h-1 bg-purple-500 rounded-full transition-all duration-1000" 
                style={{ width: `${(Math.max(0, currentStep) / (STATUS_FLOW.length - 1)) * 100}%` }} 
              />
              {STATUS_FLOW.map((step, idx) => {
                 const isPast = currentStep > idx;
                 const isCurrent = currentStep === idx;
                 return (
                   <div key={step.id} className="relative flex flex-col items-center">
                      <div className={`w-3 h-3 md:w-4 md:h-4 rounded-full border-2 transition-all duration-500 z-10 bg-white dark:bg-slate-800 ${
                        isPast ? 'border-purple-500 bg-purple-500' : 
                        isCurrent ? 'border-purple-500 ring-4 ring-purple-100 dark:ring-purple-900' : 'border-gray-200 dark:border-slate-600'
                      }`} />
                      <span className={`absolute top-5 md:top-6 whitespace-nowrap text-[8px] md:text-[9px] uppercase tracking-widest font-bold ${
                        isCurrent ? 'text-purple-600 dark:text-purple-400' : isPast ? 'text-gray-900 dark:text-slate-300' : 'text-gray-400'
                      }`}>{step.label}</span>
                   </div>
                 );
              })}
           </div>
        )}

        {order.estimatedCompletion && !isCompleted && (
           <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-slate-400 bg-gray-50 dark:bg-slate-800 border border-gray-100 dark:border-slate-700 px-4 py-3 rounded-2xl mb-6 font-medium mt-8">
             <Clock size={16} className="text-purple-500" /> Delivery by: <span className="text-gray-900 dark:text-slate-100 font-bold">{order.estimatedCompletion}</span>
           </div>
        )}

        <div className="flex flex-wrap gap-3">
          <InteractiveButton onClick={() => navigate(`/tracking?id=${order.id}`)} className="px-6 py-3">
            Track Progress <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
          </InteractiveButton>
          
          {(order.status === OrderStatus.DRAFT_SENT || order.status === OrderStatus.COMPLETED) && (
             <button onClick={() => setShowRevisionForm(!showRevisionForm)} className="border border-gray-200 dark:border-slate-700 text-gray-600 dark:text-slate-400 px-6 py-3 rounded-full text-xs font-bold uppercase tracking-widest hover:border-gray-900 hover:text-gray-900 dark:text-slate-100 transition-colors flex items-center gap-2">
                <MessageSquare size={14} /> Request Revision
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
             }} className="border border-green-200 text-green-700 bg-green-50 px-6 py-3 rounded-full text-xs font-bold uppercase tracking-widest hover:bg-green-100 transition-colors flex items-center gap-2 disabled:opacity-50">
                {isDownloading ? <Loader2 size={14} className="animate-spin" /> : <Download size={14} />} {isDownloading ? 'Working...' : 'Download Invoice'}
             </button>
          )}

          {isCompleted && order.finalFiles && order.finalFiles.length > 0 && order.finalFiles.map((file, idx) => (
             <a
               key={`final-${idx}`}
               href={file.data}
               download={file.name}
               target="_blank"
               rel="noreferrer"
               className="border-2 border-blue-600 text-white bg-blue-600 shadow-md px-6 py-3 rounded-full text-xs font-bold uppercase tracking-widest hover:bg-blue-700 hover:border-blue-700 transition-colors flex items-center gap-2 group"
             >
                <Download size={14} className="group-hover:-translate-y-0.5 transition-transform animate-bounce" /> Download Final Assets
             </a>
          ))}
        </div>

        {isCompleted && !order.rating && (
           <div className="mt-8 bg-gradient-to-r from-purple-50 to-pink-50 p-6 rounded-3xl border border-purple-100 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
               <div>
                   <h4 className="font-bold text-gray-900 dark:text-slate-100 text-sm tracking-wide">How was your experience?</h4>
                   <p className="text-xs text-gray-500 dark:text-slate-400 mt-1">Please rate this project to help us improve.</p>
               </div>
               <div className="flex gap-2">
                   <button onClick={() => navigate(`/tracking?id=${order.id}`)} className="bg-purple-600 text-white font-bold uppercase tracking-widest text-[10px] px-6 py-3 rounded-full shadow-sm hover:bg-purple-700 transition-colors">
                      Review Project
                   </button>
               </div>
           </div>
        )}

        {isCompleted && order.rating && (
           <div className="mt-8 bg-gray-50 dark:bg-slate-800 p-6 rounded-3xl border border-gray-200 dark:border-slate-700 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
               <div>
                   <h4 className="font-bold text-gray-900 dark:text-slate-100 text-sm tracking-wide">Thank you for your feedback!</h4>
                   <div className="flex gap-1 text-lg my-1">
                      {[1, 2, 3, 4, 5].map(s => <span key={s} className={s <= (order.rating || 0) ? 'text-yellow-400' : 'text-gray-300'}>★</span>)}
                   </div>
               </div>
               <div className="flex gap-2">
                   <button onClick={() => navigate(`/tracking?id=${order.id}`)} className="text-purple-600 font-bold uppercase tracking-widest text-[10px] px-6 py-3 rounded-full border border-purple-200 shadow-sm hover:bg-purple-50 transition-colors flex items-center gap-2">
                      <Edit2 size={14} /> Edit Review
                   </button>
               </div>
           </div>
        )}

        {showRevisionForm && (
          <div className="mt-8 bg-gray-50 dark:bg-slate-800 p-6 rounded-3xl border border-gray-200 dark:border-slate-700 animate-fade-in text-left">
            <label className="block text-xs font-bold text-gray-500 dark:text-slate-400 uppercase tracking-wider mb-3">Revision Details</label>
            <textarea
              value={notes}
              onChange={e => setNotes(e.target.value)}
              placeholder="What would you like to change?"
              className="w-full bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-2xl p-4 text-sm text-gray-900 dark:text-slate-100 outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-100 min-h-[120px] mb-4 transition-all"
            />
            <div className="flex justify-end gap-3">
               <button onClick={() => setShowRevisionForm(false)} className="text-xs text-gray-500 dark:text-slate-400 hover:text-gray-900 dark:text-slate-100 uppercase font-bold p-3">Cancel</button>
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
        <div className="w-full md:w-64 h-64 rounded-3xl overflow-hidden border border-gray-200 dark:border-slate-700 shrink-0 relative group-hover:border-gray-300 dark:border-slate-600 transition-all duration-500 shadow-sm">
          <img src={order.draftImg} alt="Draft" loading="lazy" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
          <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-gray-900/80 to-transparent p-4">
             <div className="text-[10px] font-bold text-gray-700 dark:text-slate-300 uppercase tracking-widest">Latest Draft</div>
          </div>
        </div>
      )}
    </div>
  );
};
