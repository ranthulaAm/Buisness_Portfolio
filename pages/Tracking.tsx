import { toast } from "react-hot-toast";
import React, { useState, useEffect, useRef } from 'react';
import { Helmet } from 'react-helmet-async';
import { useSearchParams, Link, useNavigate } from 'react-router-dom';
import { Package, CheckCircle2, AlertCircle, Clock, DollarSign, Download, Home, MessageCircle, Edit2, Trash2, Eye, Copy, Loader2, Info, X, Send, ShieldAlert, Check, ImageIcon, Search, ArrowDown, Printer, ChevronLeft } from 'lucide-react';
import { listenToOrderById, updateOrder, cancelOrder, listenToOrdersByClientId } from '../services/storageService';
import { getInvoiceConfig, deleteTestimonial } from '../services/dataService';
import { downloadInvoice } from '../utils/invoiceGenerator';
import { Order, OrderStatus, User } from '../types';
import { handleSingleDownload, handleBulkDownload } from '../utils/downloadHelpers';
import { PrintableInvoice } from '../components/PrintableInvoice';
import { ConfirmationDialog } from '../components/ConfirmationDialog';

interface TrackingProps {
  user: User | null;
}

export const Tracking: React.FC<TrackingProps> = ({ user }) => {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const [showBackButton, setShowBackButton] = useState(true);
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

  const [trackingId, setTrackingId] = useState(searchParams.get('id') || '');
  const [order, setOrder] = useState<Order | null>(null);
  const [isDownloadingAll, setIsDownloadingAll] = useState(false);
  const [downloadProgress, setDownloadProgress] = useState(0);
  const [userOrders, setUserOrders] = useState<Order[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  // Modal States
  const [showDraftLightbox, setShowDraftLightbox] = useState(false);
  const [isRevisionMode, setIsRevisionMode] = useState(false);
  const [revisionNotes, setRevisionNotes] = useState('');
  const [isSubmittingAction, setIsSubmittingAction] = useState(false);
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);
  const [isDownloadingInvoice, setIsDownloadingInvoice] = useState(false);
  
  // Back button param sync
  const lightboxParam = searchParams.get('lightbox');
  useEffect(() => {
     if (lightboxParam === 'true' && !showDraftLightbox) {
         setShowDraftLightbox(true);
     } else if (lightboxParam !== 'true' && showDraftLightbox) {
         setShowDraftLightbox(false);
         setIsRevisionMode(false);
     }
  }, [lightboxParam]);

  const openLightbox = () => {
      setSearchParams(prev => { prev.set('lightbox', 'true'); return prev; }, { replace: false });
  };

  const closeLightbox = () => {
      setSearchParams(prev => { prev.delete('lightbox'); return prev; }, { replace: false });
  };

  // Body scroll lock for lightbox
  useEffect(() => {
    if (showDraftLightbox) {
      document.body.classList.add('overflow-hidden');
    } else {
      document.body.classList.remove('overflow-hidden');
    }
    return () => { document.body.classList.remove('overflow-hidden'); }
  }, [showDraftLightbox]);

  const [rating, setRating] = useState(0);
  const [feedback, setFeedback] = useState('');
  const [isEditingFeedback, setIsEditingFeedback] = useState(false);
  const [feedbackSuccess, setFeedbackSuccess] = useState(false);

  useEffect(() => {
     if (order && order.rating && !isEditingFeedback) {
        setRating(order.rating);
        setFeedback(order.feedback || '');
     }
  }, [order, isEditingFeedback]);

  const handleSubmitFeedback = async () => {
    if (!order) return;
    setIsSubmittingAction(true);
    try {
      if (order.testimonialId) {
          await deleteTestimonial(order.testimonialId);
      }
      await updateOrder({ ...order, rating, feedback, isFeedbackRead: false, testimonialId: '' });
      setIsEditingFeedback(false);
      setFeedbackSuccess(true);
      setTimeout(() => setFeedbackSuccess(false), 5000);
    } catch (e) {
      console.error(e);
      toast("Failed to submit feedback.");
    } finally {
      setIsSubmittingAction(false);
    }
  };

  // Fetch specific order if ID is in URL
  useEffect(() => {
    const idFromUrl = searchParams.get('id');
    if (idFromUrl) {
      setTrackingId(idFromUrl);
      setError('');
      setIsLoading(true);
      const unsubscribe = listenToOrderById(idFromUrl, (foundOrder, fetchError) => {
        setIsLoading(false);
        if (foundOrder) {
          setOrder(foundOrder);
          setError('');
        } else {
          setOrder(null);
          const isPermissionError = fetchError && (fetchError.message.includes('permission') || (fetchError as any).code === 'permission-denied');
          
          if (isPermissionError) {
             setError('Sign in required to view this project securely.');
             if (!user && !searchParams.get('auth')) {
                const params = new URLSearchParams(searchParams);
                params.set('auth', 'login');
                navigate(`/tracking?${params.toString()}`, { replace: true });
             }
          } else {
             setError('Order not found.');
          }
        }
      });
      return () => unsubscribe();
    } else {
      setOrder(null);
      setIsLoading(false);
    }
  }, [searchParams, user, navigate]);

  // Fetch list of orders for logged-in user
  useEffect(() => {
    if (user && !searchParams.get('id')) {
      const unsubscribe = listenToOrdersByClientId(user.id, (myOrders) => {
        setUserOrders(myOrders);
      });
      return () => unsubscribe();
    }
  }, [user, searchParams]);

  const copyToClipboard = (text: string, e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(text);
    toast(`Order ID ${text} copied!`);
  };

  const onEditClick = (orderId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    navigate(`/order?edit=${orderId}`);
  };

  const onHelpClick = (o: Order, e: React.MouseEvent) => {
    e.stopPropagation();
    window.open(`https://api.whatsapp.com/send?phone=94712132855&text=${encodeURIComponent(`Help with order ${o.id}`)}`, '_blank');
  };

  const handleApprove = async () => {
    if (!order) return;
    setIsSubmittingAction(true);
    try {
      const updatedOrder = { ...order, status: OrderStatus.WAITING_PAYMENT };
      await updateOrder(updatedOrder);
      import('../services/telegramService').then(({ sendPaymentAwaitedNotification }) => {
          sendPaymentAwaitedNotification(updatedOrder).catch(console.error);
      }).catch(console.error);
      closeLightbox();
    } catch (err) {
      toast("Failed to approve draft.");
    } finally {
      setIsSubmittingAction(false);
    }
  };

  const handleSubmitRevision = async () => {
    if (!order || !revisionNotes.trim()) return;
    setIsSubmittingAction(true);
    try {
      const notes = revisionNotes.trim();
      await updateOrder({ 
        ...order, 
        status: OrderStatus.REVISION, 
        revisionNotes: notes 
      });
      import('../services/telegramService').then(({ sendRevisionRequestedNotification }) => {
          sendRevisionRequestedNotification(order, notes).catch(console.error);
      }).catch(console.error);
      setIsRevisionMode(false);
      setRevisionNotes('');
      closeLightbox();
    } catch (err) {
      toast("Failed to submit revision.");
    } finally {
      setIsSubmittingAction(false);
    }
  };

  const confirmCancel = async () => {
    if (!order) return;
    setShowCancelConfirm(false);
    try {
      await cancelOrder(order.id);
    } catch (err) {
      toast("Failed to cancel order.");
    }
  };

  const handleCancel = () => {
    setShowCancelConfirm(true);
  };

  const STATUS_FLOW = [
    { id: OrderStatus.PENDING, label: 'PLACED' },
    { id: OrderStatus.REVIEWING, label: 'REVIEWING' },
    { id: OrderStatus.IN_PROGRESS, label: 'PROCESSING' },
    { id: OrderStatus.DRAFT_SENT, label: 'DRAFT' },
    { id: OrderStatus.WAITING_PAYMENT, label: 'PAYMENT' },
    { id: OrderStatus.COMPLETED, label: 'DONE' }
  ];

  const getCurrentStepIndex = (status: OrderStatus) => {
    if (status === OrderStatus.REVISION) return 3;
    if (status === OrderStatus.CANCELLED) return -1;
    return STATUS_FLOW.findIndex(s => s.id === status);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen pt-24 flex flex-col items-center justify-center gap-6 animate-fade-in">
        <Helmet>
          <title>Project Tracking | Ranthula | Buisness portfolio</title>
        </Helmet>
        <Loader2 className="animate-spin text-purple-600" size={48} />
        <p className="text-gray-500 dark:text-slate-400 font-bold uppercase tracking-[0.3em] text-xs">Syncing...</p>
      </div>
    );
  }

  // 1. Detailed View (Single Order)
  if (order) {
    const isFilesDeleted = order.isDeletedByAdmin === true;
    const activeIndex = getCurrentStepIndex(order.status);
    const hasDraft = !!order.draftImg;

    return (
      <div className="min-h-screen pt-24 px-4 pb-12 max-w-7xl mx-auto print:p-0 print:pt-0 print:m-0 print:min-h-0 print:w-full relative">
        <ConfirmationDialog 
            isOpen={showCancelConfirm}
            title="Cancel Order"
            message="Are you sure you want to cancel this order? This action cannot be undone."
            confirmText="Yes, Cancel Order"
            onConfirm={confirmCancel}
            onCancel={() => setShowCancelConfirm(false)}
        />
        <Helmet>
          <title>Order #{order.id} | Tracking</title>
          <meta name="robots" content="noindex, nofollow" />
        </Helmet>
        <PrintableInvoice order={order} />
        <div className="print:hidden">
          <button 
            onClick={() => { setOrder(null); setSearchParams({}); }} 
            className="fixed z-50 inline-flex items-center gap-1.5 text-purple-600 dark:text-purple-400 hover:text-purple-700 dark:hover:text-purple-300 active:scale-[0.96] bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border border-purple-150 dark:border-slate-800 px-4 py-2.5 md:px-5 md:py-2.5 rounded-full shadow-lg font-bold text-xs uppercase tracking-wider transition-all duration-300 ease-in-out top-[4.5rem] left-4 md:top-8 md:left-28 opacity-100 translate-y-0 scale-100"
          >
             <ChevronLeft size={16} strokeWidth={3} className="text-purple-600 dark:text-purple-400" />
             <span>Back to Projects</span>
          </button>
        </div>

        <div className="max-w-3xl mx-auto print:hidden">
          <div className="bg-white dark:bg-slate-800/80 border border-zinc-300 dark:border-slate-600/50 rounded-[2rem] p-6 md:p-12 relative overflow-hidden shadow-[0_15px_50px_rgba(0,0,0,0.07)] dark:shadow-[0_15px_50px_rgba(0,0,0,0.6)] dark:ring-1 dark:ring-white/5">
             <div className="flex justify-between items-start mb-8 md:mb-10">
               <div>
                 <h2 className="text-2xl md:text-4xl font-display text-gray-900 dark:text-slate-100 mb-2">{order.serviceType}</h2>
                 <div className="text-xs font-mono text-zinc-500 font-bold uppercase tracking-wider">{order.id}</div>
               </div>
               <div className={`px-4 py-2 rounded-full text-[10px] font-black uppercase tracking-widest border ${order.status === OrderStatus.COMPLETED ? 'bg-green-50 text-green-700 border-green-200 dark:bg-green-900/30 dark:text-green-400 dark:border-green-800 shadow-sm' : order.status === OrderStatus.WAITING_PAYMENT ? 'bg-orange-50 text-orange-700 border-orange-200 dark:bg-orange-900/30 dark:text-orange-400 dark:border-orange-800 shadow-sm' : 'bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-900/30 dark:text-purple-400 dark:border-purple-800 shadow-sm'}`}>
                 {order.status}
               </div>
             </div>
             
             <div className="relative pl-4 md:pl-6 space-y-8 md:space-y-10 my-8 md:my-12 w-full max-w-full sm:max-w-sm">
                <div className="absolute left-[23px] md:left-[31px] top-2 bottom-2 w-0.5 bg-zinc-300 dark:bg-slate-700"></div>
                {STATUS_FLOW.map((s, idx) => {
                   const isCompleted = idx <= activeIndex;
                   const isCurrent = idx === activeIndex;
                   return (
                     <div key={s.id} className="relative flex items-center gap-6">
                        <div className={`w-3.5 h-3.5 rounded-full border-2 z-10 transition-all duration-500 ${isCompleted ? 'bg-purple-600 border-purple-600 shadow-sm scale-110' : 'bg-white dark:bg-slate-800 border-zinc-400 dark:border-slate-500 shadow-inner'}`}></div>
                        <div className={`${isCompleted ? 'text-gray-900 dark:text-slate-100 font-extrabold' : 'text-zinc-500 dark:text-slate-400 font-medium'} ${isCurrent ? 'font-black text-purple-600 dark:text-purple-400 font-display' : ''} text-[10px] md:text-[11px] uppercase tracking-[0.2em]`}>{s.label}</div>
                     </div>
                   );
                })}
             </div>

             <div className="space-y-4">
                {order.status === OrderStatus.WAITING_PAYMENT && (
                   <div className="p-6 bg-orange-50 border border-orange-200 rounded-3xl flex flex-col items-center gap-2 text-center animate-fade-in mb-4 shadow-sm">
                      <div className="flex items-center gap-2 text-orange-600 font-bold uppercase tracking-widest text-sm">
                        <DollarSign size={18} /> Payment Required
                      </div>
                      <p className="text-gray-500 dark:text-slate-400 text-[10px] font-medium uppercase tracking-wider font-sans">Please contact admin to complete payment.</p>
                   </div>
                )}

                {/* Light Mode: Completed assets listing */}
                {order.status === OrderStatus.COMPLETED && (
                   <div className="space-y-4">
                      {order.finalFiles && order.finalFiles.length > 0 && (
                         <div className="p-8 bg-green-50/50 border border-green-200 rounded-3xl animate-fade-in shadow-sm">
                            <div className="flex items-center gap-3 text-green-700 font-black uppercase tracking-[0.2em] text-[10px] mb-6">
                              <CheckCircle2 size={18} /> Final Assets Ready
                            </div>
                            <div className="space-y-3">
                              {order.finalFiles.length > 1 && (
                                <button
                                  onClick={async () => {
                                    if (isDownloadingAll) return;
                                    setIsDownloadingAll(true);
                                    setDownloadProgress(0);
                                    await handleBulkDownload(
                                      order.finalFiles.map(f => ({ url: f.data, name: f.name })),
                                      `Order_${order.id}_Files`,
                                      (prog) => setDownloadProgress(prog)
                                    );
                                    setIsDownloadingAll(false);
                                  }}
                                  disabled={isDownloadingAll}
                                  className="w-full flex items-center justify-center gap-2 p-4 bg-gray-900 hover:bg-black text-white rounded-2xl transition-all shadow-md mb-4"
                                >
                                  {isDownloadingAll ? (
                                    <><Loader2 size={18} className="animate-spin" /> Preparing {downloadProgress}/{order.finalFiles.length}...</>
                                  ) : (
                                    <><ArrowDown size={18} /> Download All Files ({order.finalFiles.length})</>
                                  )}
                                </button>
                              )}
                              {order.finalFiles.map((f, i) => (
                                 <button 
                                   key={i} 
                                   onClick={(e) => {
                                     e.preventDefault();
                                     handleSingleDownload(f.data, f.name);
                                   }}
                                   className="w-full flex items-center justify-between p-4 bg-blue-600 hover:bg-blue-700 text-white border border-blue-700 rounded-2xl group transition-all shadow-md group-hover:shadow-lg"
                                 >
                                    <div className="flex items-center gap-4">
                                       <div className="p-2 bg-white/20 rounded-lg text-white group-hover:scale-110 transition-transform">
                                          <ImageIcon size={16} />
                                       </div>
                                       <span className="text-xs font-bold text-white truncate max-w-[180px] text-left">{f.name}</span>
                                    </div>
                                    <div className="flex items-center gap-2 bg-white/20 px-3 py-1.5 rounded-lg text-white font-bold uppercase tracking-wider text-[10px]">
                                       <Download size={14} className="group-hover:-translate-y-0.5 transition-transform animate-bounce" />
                                       Download File
                                    </div>
                                 </button>
                              ))}
                            </div>
                            
                            <div className="mt-6 pt-6 border-t border-green-200/50 flex flex-col sm:flex-row gap-3 sm:gap-4">
                              <button onClick={() => window.print()} className="flex-1 flex items-center justify-center gap-2 bg-white dark:bg-slate-900 hover:bg-gray-50 dark:hover:bg-slate-800 dark:bg-slate-800 border border-gray-300 dark:border-slate-600 text-gray-700 dark:text-slate-300 font-bold uppercase tracking-widest text-[10px] py-4 rounded-xl transition-colors shadow-sm">
                                 <Printer size={16} /> Print Invoice
                              </button>
                              <button disabled={isDownloadingInvoice} onClick={async () => {
                                 setIsDownloadingInvoice(true);
                                 try {
                                    await downloadInvoice(order);
                                 } finally {
                                    setIsDownloadingInvoice(false);
                                 }
                              }} className="flex-1 flex items-center justify-center gap-2 bg-white dark:bg-slate-900 hover:bg-green-50 border border-green-600 text-green-700 font-bold uppercase tracking-widest text-[10px] py-4 rounded-xl transition-colors shadow-sm disabled:opacity-50">
                                 {isDownloadingInvoice ? <Loader2 size={16} className="animate-spin" /> : <Download size={16} />} {isDownloadingInvoice ? 'Preparing...' : 'Download (PDF)'}
                              </button>
                            </div>
                         </div>
                      )}

                      {(!order.rating || isEditingFeedback) && (
                         <div className="p-8 bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-3xl animate-fade-in shadow-sm mt-4">
                           <h4 className="text-lg font-display text-gray-900 dark:text-slate-100 mb-4">{isEditingFeedback ? 'Edit your rating' : 'How was your experience?'}</h4>
                           <div className="flex justify-center gap-2 mb-6">
                             {[1, 2, 3, 4, 5].map((star) => (
                               <button key={star} onClick={() => setRating(star)} className={`text-4xl transition-colors hover:scale-110 ${rating >= star ? 'text-yellow-400' : 'text-gray-300 hover:text-yellow-200'}`}>
                                 ★
                               </button>
                             ))}
                           </div>
                           {(rating > 0) && (
                             <div className="animate-fade-in">
                               <textarea
                                 value={feedback}
                                 onChange={e => setFeedback(e.target.value)}
                                 placeholder="Tell us what you liked (or didn't like)..."
                                 className="w-full bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-xl p-4 outline-none focus:border-purple-500 min-h-[100px] text-sm mb-6 resize-none shadow-sm font-medium"
                               />
                               <div className="flex gap-2">
                                  {isEditingFeedback && (
                                     <button
                                       onClick={() => {
                                          setIsEditingFeedback(false);
                                          setRating(order.rating || 0);
                                          setFeedback(order.feedback || '');
                                       }}
                                       className="w-1/3 bg-gray-200 hover:bg-gray-300 text-gray-700 dark:text-slate-300 rounded-xl py-4 font-black uppercase text-[10px] tracking-widest transition-all shadow-sm"
                                     >
                                       Cancel
                                     </button>
                                  )}
                                  <button
                                    onClick={handleSubmitFeedback}
                                    disabled={!rating || isSubmittingAction}
                                    className="flex-1 bg-purple-600 hover:bg-purple-700 text-white rounded-xl py-4 font-black uppercase text-[10px] tracking-widest disabled:opacity-50 transition-all shadow-md"
                                  >
                                    Submit Feedback
                                  </button>
                               </div>
                             </div>
                           )}
                         </div>
                      )}

                      {(order.rating && !isEditingFeedback) && (
                        <div className="p-6 bg-purple-50 border border-purple-100 rounded-2xl flex flex-col items-center gap-3 text-center shadow-sm mt-4 relative">
                          <CheckCircle2 className="text-purple-600 mb-1" size={28} />
                          {feedbackSuccess ? (
                             <>
                               <span className="text-sm font-bold text-gray-900 dark:text-slate-100">Successfully updated!</span>
                               <span className="text-xs text-gray-500 dark:text-slate-400">Your updated review has been submitted to admins.</span>
                             </>
                          ) : (
                             <>
                               <span className="text-sm font-bold text-gray-900 dark:text-slate-100">Thank you for your feedback!</span>
                               <div className="flex gap-1 text-lg my-1">
                                  {[1, 2, 3, 4, 5].map(s => <span key={s} className={s <= (order.rating || 0) ? 'text-yellow-400' : 'text-gray-300'}>★</span>)}
                               </div>
                               {order.feedback && <p className="text-xs text-gray-600 dark:text-slate-400 italic">"{order.feedback}"</p>}
                               <button 
                                  onClick={() => setIsEditingFeedback(true)}
                                  className="mt-2 text-xs font-bold text-purple-600 hover:text-purple-700 flex items-center gap-1 bg-white dark:bg-slate-900 px-3 py-1.5 rounded-full border border-purple-200 shadow-sm"
                               >
                                  <Edit2 size={12} /> Edit Review
                               </button>
                             </>
                          )}
                        </div>
                      )}
                   </div>
                )}

                {hasDraft && (
                  <button onClick={openLightbox} className="w-full bg-purple-600 hover:bg-purple-700 text-white py-5 rounded-2xl font-black text-xs uppercase tracking-[0.2em] flex items-center justify-center gap-3 hover:scale-[1.02] transition-all shadow-sm">
                    <Eye size={18} /> View Draft / Proof
                  </button>
                )}

                {(order.status === OrderStatus.PENDING || order.status === OrderStatus.REVIEWING) && (
                  <button onClick={handleCancel} className="w-full bg-red-50 hover:bg-red-100 border border-red-200 text-red-650 py-5 rounded-2xl font-black text-xs uppercase tracking-[0.2em] flex items-center justify-center gap-3 transition-all font-sans">
                    <Trash2 size={18} /> Cancel Order
                  </button>
                )}

                <button onClick={(e) => onHelpClick(order, e)} className="w-full bg-green-50 hover:bg-green-100 border border-green-200 text-green-700 py-5 rounded-2xl font-black text-xs uppercase tracking-[0.2em] flex items-center justify-center gap-3 transition-all font-sans shadow-sm">
                  <MessageCircle size={18} /> Contact Support
                </button>
             </div>
          </div>
        </div>

        {/* Draft Lightbox Modal - FIXED SCROLLING */}
        {showDraftLightbox && (
          <div className="fixed inset-0 z-[200] flex items-start justify-center p-4 overflow-y-auto">
             <div className="fixed inset-0 bg-black/95 backdrop-blur-xl" onClick={() => !isRevisionMode && closeLightbox()}></div>
             
             <div className="relative w-full max-w-lg bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-[3rem] overflow-hidden shadow-2xl animate-fade-in my-8">
                <div className="relative aspect-[3/4] bg-gray-100 dark:bg-slate-800 flex items-center justify-center border-b border-gray-200 dark:border-slate-700">
                   {order.draftImg ? (
                     <div className="relative w-full h-full">
                       <img src={order.draftImg} loading="lazy" className="w-full h-full object-contain pointer-events-none select-none" alt="Draft Preview" />
                       {/* Watermark/Warning UI */}
                       <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none select-none opacity-20 overflow-hidden">
                          <span className="text-4xl font-black uppercase tracking-[0.5em] text-gray-950 rotate-45 mb-40">PREVIEW ONLY</span>
                          <span className="text-4xl font-black uppercase tracking-[0.5em] text-gray-950 rotate-45">PREVIEW ONLY</span>
                       </div>
                       <div className="absolute top-6 left-1/2 -translate-x-1/2 bg-red-50 border border-red-150 px-4 py-2 rounded-full flex items-center gap-2 whitespace-nowrap z-20 shadow-sm">
                          <ShieldAlert size={14} className="text-red-600" />
                          <span className="text-[10px] font-black uppercase tracking-widest text-red-600">Screen Capture Disabled</span>
                       </div>
                     </div>
                   ) : (
                     <div className="text-gray-400 italic text-sm">No preview available.</div>
                   )}
                   <button onClick={closeLightbox} className="absolute top-6 right-6 bg-white/80 dark:bg-slate-900/80 hover:bg-gray-100 dark:hover:bg-slate-800 p-3 rounded-full text-gray-600 dark:text-slate-400 hover:text-gray-900 dark:hover:text-slate-100 transition-all border border-gray-200 dark:border-slate-700 z-50 shadow-sm">
                     <X size={20} />
                   </button>
                </div>

                <div className="p-8 md:p-10 bg-white dark:bg-slate-900 border-t border-gray-200 dark:border-slate-700">
                   <h4 className="text-2xl font-display text-gray-900 dark:text-slate-100 mb-2">{order.serviceType}</h4>
                   <p className="text-gray-400 font-mono text-xs uppercase tracking-widest mb-8">{order.id}</p>

                   {isRevisionMode ? (
                     <div className="space-y-6 animate-fade-in">
                        <div className="bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-2xl p-4">
                           <label className="text-[10px] font-black text-purple-600 uppercase tracking-widest mb-2 block">Your Feedback</label>
                           <textarea 
                             value={revisionNotes}
                             onChange={(e) => setRevisionNotes(e.target.value)}
                             placeholder="What would you like us to change? Please be specific about colors, layout, or text."
                             className="w-full bg-transparent border-none text-gray-900 dark:text-slate-100 text-sm outline-none placeholder:text-gray-400 min-h-[120px] resize-none"
                             autoFocus
                           />
                        </div>
                        <div className="flex flex-col sm:flex-row gap-2 sm:gap-4">
                           <button onClick={() => setIsRevisionMode(false)} className="flex-1 py-4 text-gray-400 font-bold uppercase text-[10px] tracking-widest hover:text-gray-900 dark:text-slate-100 transition-colors">Cancel</button>
                           <button 
                             onClick={handleSubmitRevision} 
                             disabled={!revisionNotes.trim() || isSubmittingAction}
                             className="flex-1 bg-purple-600 hover:bg-purple-700 text-white py-4 rounded-xl font-black uppercase text-[10px] tracking-widest transition-all disabled:opacity-50 shadow-sm"
                           >
                             {isSubmittingAction ? 'Submitting...' : 'Send Revision'}
                           </button>
                        </div>
                     </div>
                   ) : (
                     <div className="space-y-8 animate-fade-in">
                        <div className="bg-purple-50 border border-purple-100 rounded-2xl p-6">
                           <div className="flex items-center gap-3 text-purple-700 font-black uppercase tracking-widest text-[11px] mb-2">
                              <CheckCircle2 size={16} /> Latest Draft Status
                           </div>
                           <p className="text-gray-650 text-[11px] font-medium leading-relaxed font-sans">
                             Please review the artwork carefully. Check for spelling, layout, and colors.
                           </p>
                        </div>

                        <div className="space-y-4">
                           <button onClick={() => setIsRevisionMode(true)} className="w-full py-4 border border-gray-200 dark:border-slate-700 rounded-xl text-gray-700 dark:text-slate-300 font-bold uppercase text-[10px] tracking-widest hover:bg-gray-50 dark:hover:bg-slate-800 dark:bg-slate-800 transition-all flex items-center justify-center gap-3 font-sans shadow-sm">
                              <Clock size={16} /> Request Revision
                           </button>
                           <button onClick={handleApprove} disabled={isSubmittingAction} className="w-full bg-purple-600 hover:bg-purple-700 text-white py-5 rounded-xl font-bold uppercase text-[10px] tracking-[0.2em] transition-all flex items-center justify-center gap-3 shadow-md font-sans">
                              <Check size={18} /> Approve & Proceed
                           </button>
                        </div>
                        <p className="text-[9px] text-center text-gray-400 uppercase font-semibold tracking-widest px-4 leading-relaxed font-sans">
                          By approving, you confirm that the artwork is final. You will be asked to complete payment.
                        </p>
                     </div>
                   )}
                </div>
             </div>
          </div>
        )}
      </div>
    );
  }

  // 2. List View (Grid of Cards)
  return (
    <div className="min-h-screen pt-24 px-4 pb-12 max-w-7xl mx-auto">
      <Helmet>
        <title>Project Tracking | Ranthula | Buisness portfolio</title>
        <meta name="description" content="Track your projects with Ranthul." />
      </Helmet>
        <div className="print:hidden">
           <Link 
             to="/" 
             className="fixed z-50 inline-flex items-center gap-1.5 text-purple-600 dark:text-purple-400 hover:text-purple-700 dark:hover:text-purple-300 active:scale-[0.96] bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border border-purple-150 dark:border-slate-800 px-4 py-2.5 md:px-5 md:py-2.5 rounded-full shadow-lg font-bold text-xs uppercase tracking-wider transition-all duration-300 ease-in-out top-[4.5rem] left-4 md:top-8 md:left-28 opacity-100 translate-y-0 scale-100"
           >
             <ChevronLeft size={16} strokeWidth={3} className="text-purple-600 dark:text-purple-400" />
             <span>Back to Home</span>
           </Link>
        </div>

       <div className="mb-12 flex flex-col md:flex-row justify-between items-center gap-8">
          <div>
            <h1 className="text-5xl font-display font-medium text-gray-900 dark:text-slate-100 mb-2 uppercase tracking-tight">Active Projects</h1>
            <p className="text-gray-500 dark:text-slate-400 text-lg font-light">Keep track of your creative requests (Real-time updates).</p>
          </div>
          <div className="flex flex-col sm:flex-row items-center gap-4 w-full md:w-auto">
             <div className="relative w-full sm:w-64">
               <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
               <input 
                 type="text" 
                 placeholder="Search orders..." 
                 value={searchQuery}
                 onChange={(e) => setSearchQuery(e.target.value)}
                 className="w-full bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-full pl-10 pr-4 py-3 outline-none focus:border-purple-600 focus:ring-2 focus:ring-purple-600/20 text-sm shadow-sm transition-all"
               />
             </div>
             <Link to="/order" className="w-full sm:w-auto shrink-0 bg-purple-600 text-white px-8 py-4.5 rounded-full font-bold shadow-md hover:bg-purple-700 hover:scale-[1.01] transition-all flex items-center justify-center gap-3 uppercase text-xs tracking-widest border border-purple-700">
                <Package size={20} /> New Order
             </Link>
          </div>
       </div>

       {error && (
         <div className="mb-8 p-6 bg-red-50 border border-red-200 rounded-2xl flex flex-col items-center justify-center text-center">
            <ShieldAlert className="text-red-500 mb-2" size={32} />
            <p className="text-red-700 font-bold">{error}</p>
            {!user && (
               <button onClick={() => {
                  const params = new URLSearchParams(searchParams);
                  params.set('auth', 'login');
                  navigate(`/tracking?${params.toString()}`, { replace: false });
               }} className="mt-4 px-6 py-2 bg-red-600 text-white text-xs font-bold uppercase tracking-widest rounded-full hover:bg-red-700 transition-colors">
                 Sign In
               </button>
            )}
         </div>
       )}

       <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
         {userOrders.filter(o => o.id.toLowerCase().includes(searchQuery.toLowerCase()) || (o.serviceType && o.serviceType.toLowerCase().includes(searchQuery.toLowerCase()))).map((o) => {
           const isFilesDeleted = o.isDeletedByAdmin === true;
           
           return (
           <div key={o.id} onClick={() => setSearchParams({ id: o.id })} className="group relative bg-white dark:bg-slate-800/80 border border-zinc-300 dark:border-slate-600/50 hover:border-purple-400 rounded-2xl transition-all duration-300 hover:bg-gray-50 dark:hover:bg-slate-700/50 overflow-hidden flex flex-col h-full shadow-[0_10px_35px_rgba(0,0,0,0.06)] dark:shadow-[0_10px_35px_rgba(0,0,0,0.4)] dark:ring-1 dark:ring-white/5 hover:shadow-xl cursor-pointer">
             <div className="p-6 pb-0 flex-grow relative z-10">
                 <div className="flex justify-between items-start mb-6">
                   <div className="flex items-center gap-2">
                       {o.status === OrderStatus.PENDING && (
                          <div className="relative flex h-2 w-2 mr-1">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
                          </div>
                       )}
                       <div className="px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border border-purple-300 bg-purple-50 text-purple-700 shadow-sm">
                         {o.status}
                       </div>
                   </div>
                   
                   <div onClick={(e) => copyToClipboard(o.id, e)} className="flex items-center gap-2 cursor-pointer group/id hover:bg-gray-100 dark:hover:bg-slate-700 dark:bg-slate-800 px-2.5 py-1.5 -mr-2 rounded-lg transition-colors border border-transparent hover:border-zinc-250">
                     <span className="text-[10px] font-black text-gray-500 dark:text-slate-400 uppercase tracking-widest">ID</span>
                     <div className="text-xs font-mono text-gray-600 dark:text-slate-400 group-hover/id:text-purple-600 transition-colors uppercase font-bold">{o.id}</div>
                     <Copy size={12} className="text-gray-400 group-hover/id:text-purple-600 opacity-0 group-hover/id:opacity-100 transition-all" />
                   </div>
                 </div>
                 
                 <div className="mb-2 flex flex-wrap items-center gap-2">
                    <h3 className="text-xl font-display font-black text-gray-900 dark:text-slate-100 group-hover:text-purple-600 transition-colors">{o.serviceType}</h3>
                    {isFilesDeleted && (
                        <span className="px-2 py-0.5 bg-red-50 text-red-650 border border-red-150 text-[9px] font-bold uppercase rounded-md tracking-wider">
                            Files Deleted
                        </span>
                    )}
                 </div>
                 
                 <p className="text-gray-550 text-sm line-clamp-2 mb-6 font-sans leading-relaxed">{o.requirements}</p>
             </div>
             
             <div className="p-6 pt-4 border-t border-zinc-200 flex flex-wrap justify-between items-center gap-y-3 relative z-50 bg-gray-50/70 pointer-events-auto">
                <div className="flex flex-col">
                    <span className="text-[10px] text-gray-400 font-bold uppercase">Created</span>
                    <span className="text-xs text-gray-700 dark:text-slate-300 font-mono font-bold">{new Date(o.createdAt).toLocaleDateString()}</span>
                </div>
                
                <div className="flex items-center gap-2 bg-transparent">
                   <button onClick={(e) => onHelpClick(o, e)} className="flex items-center gap-2 px-3.5 py-2.5 rounded-full bg-white dark:bg-slate-900 hover:bg-green-50 text-green-700 transition-all border border-zinc-300 hover:border-green-350 shadow-sm">
                       <MessageCircle size={15} />
                       <span className="text-[9px] font-black uppercase tracking-wider">Help</span>
                   </button>
                   {(o.status === OrderStatus.PENDING || o.status === OrderStatus.REVIEWING) && <button onClick={(e) => onEditClick(o.id, e)} className="p-3 rounded-full bg-white dark:bg-slate-900 hover:bg-gray-100 dark:hover:bg-slate-700 dark:bg-slate-800 text-gray-650 transition-all border border-zinc-300 shadow-sm"><Edit2 size={14} /></button>}
                </div>
             </div>
           </div>
           );
         })}
       </div>
    </div>
  );
};
