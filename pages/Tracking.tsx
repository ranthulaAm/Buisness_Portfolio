import { toast } from "react-hot-toast";
import React, { useState, useEffect, useRef } from 'react';
import { Helmet } from 'react-helmet-async';
import { useSearchParams, Link, useNavigate } from 'react-router-dom';
import { Package, CheckCircle2, AlertCircle, Clock, DollarSign, Download, Home, MessageCircle, Edit2, Trash2, Eye, Copy, Loader2, Info, X, Send, ShieldAlert, Check, ImageIcon, Search, ArrowDown, Printer, ChevronLeft, ZoomIn, ZoomOut, Move, RotateCcw, ChevronRight, Shield } from 'lucide-react';
import { listenToOrderById, updateOrder, cancelOrder, listenToOrdersByClientId } from '../services/storageService';
import { getInvoiceConfig, deleteTestimonial } from '../services/dataService';
import { downloadInvoice } from '../utils/invoiceGenerator';
import { Order, OrderStatus, User } from '../types';
import { handleSingleDownload, handleBulkDownload } from '../utils/downloadHelpers';
import { PrintableInvoice } from '../components/PrintableInvoice';
import { ConfirmationDialog } from '../components/ConfirmationDialog';

interface ZoomableDraftViewerProps {
  src: string;
}

export function ZoomableDraftViewer({ src }: ZoomableDraftViewerProps) {
  const [scale, setScale] = useState(1);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const dragStart = useRef({ x: 0, y: 0 });

  // Touch gesture state for pinch-to-zoom
  const touchStartDist = useRef<number | null>(null);
  const touchStartScale = useRef<number>(1);
  const lastTap = useRef<number>(0);

  // Reset zoom and pan when image source changes
  useEffect(() => {
    setScale(1);
    setPosition({ x: 0, y: 0 });
  }, [src]);

  const onStart = (clientX: number, clientY: number) => {
    if (scale === 1) return;
    setIsDragging(true);
    dragStart.current = { x: clientX - position.x, y: clientY - position.y };
  };

  const onMove = (clientX: number, clientY: number) => {
    if (!isDragging) return;
    
    let newX = clientX - dragStart.current.x;
    let newY = clientY - dragStart.current.y;

    if (containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      const maxDragX = (rect.width * (scale - 1)) / 2;
      const maxDragY = (rect.height * (scale - 1)) / 2;
      
      newX = Math.max(-maxDragX, Math.min(maxDragX, newX));
      newY = Math.max(-maxDragY, Math.min(maxDragY, newY));
    }

    setPosition({ x: newX, y: newY });
  };

  const onEnd = () => {
    setIsDragging(false);
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    onStart(e.clientX, e.clientY);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    onMove(e.clientX, e.clientY);
  };

  const handleMouseUpOrLeave = () => {
    onEnd();
  };

  // Support double-click to toggle zoom on desktop
  const handleDoubleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    if (scale > 1) {
      setScale(1);
      setPosition({ x: 0, y: 0 });
    } else {
      setScale(2.5);
      setPosition({ x: 0, y: 0 });
    }
  };

  // Support multitouch pinching & double-tap to zoom on mobile
  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 1) {
      const now = Date.now();
      if (now - lastTap.current < 300) {
        // Double tap toggle
        e.preventDefault();
        if (scale > 1) {
          setScale(1);
          setPosition({ x: 0, y: 0 });
        } else {
          setScale(2.5);
          setPosition({ x: 0, y: 0 });
        }
      } else {
        onStart(e.touches[0].clientX, e.touches[0].clientY);
      }
      lastTap.current = now;
    } else if (e.touches.length === 2) {
      // Pinch gesture start
      const dist = Math.hypot(
        e.touches[0].clientX - e.touches[1].clientX,
        e.touches[0].clientY - e.touches[1].clientY
      );
      touchStartDist.current = dist;
      touchStartScale.current = scale;
      setIsDragging(false);
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (e.touches.length === 1 && !touchStartDist.current) {
      onMove(e.touches[0].clientX, e.touches[0].clientY);
    } else if (e.touches.length === 2 && touchStartDist.current) {
      e.preventDefault();
      const dist = Math.hypot(
        e.touches[0].clientX - e.touches[1].clientX,
        e.touches[0].clientY - e.touches[1].clientY
      );
      const factor = dist / touchStartDist.current;
      const nextScale = Math.max(1, Math.min(touchStartScale.current * factor, 4));
      setScale(nextScale);
      
      if (nextScale === 1) {
        setPosition({ x: 0, y: 0 });
      }
    }
  };

  const handleTouchEnd = () => {
    touchStartDist.current = null;
    onEnd();
  };

  return (
    <div className="relative w-full h-full overflow-hidden select-none" onDoubleClick={handleDoubleClick}>
      <div 
        ref={containerRef}
        className={`relative w-full h-full overflow-hidden flex items-center justify-center bg-zinc-950 ${scale > 1 ? 'cursor-grab active:cursor-grabbing' : 'cursor-default'}`}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUpOrLeave}
        onMouseLeave={handleMouseUpOrLeave}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        <div 
          style={{
            transform: `translate(${position.x}px, ${position.y}px) scale(${scale})`,
            transition: isDragging ? 'none' : 'transform 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
          }}
          className="w-full h-full flex items-center justify-center"
        >
          <img 
            src={src} 
            loading="lazy" 
            className="max-w-full max-h-full object-contain pointer-events-none select-none transition-transform duration-200" 
            alt="Draft Preview" 
          />
        </div>

        {/* Floating instructions when zoomed */}
        {scale > 1 && (
          <div className="absolute bottom-4 right-4 bg-black/80 backdrop-blur-md px-3 py-1.5 rounded-full flex items-center gap-2 pointer-events-none text-white text-[10px] font-bold tracking-wider uppercase">
            <Move size={12} className="text-purple-400" /> Drag to Pan
          </div>
        )}
      </div>
    </div>
  );
}

interface TrackingProps {
  user: User | null;
}

export const Tracking: React.FC<TrackingProps> = ({ user }) => {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();

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
  const [activeDraftIndex, setActiveDraftIndex] = useState(0);
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
         setActiveDraftIndex(0);
     } else if (lightboxParam !== 'true' && showDraftLightbox) {
         setShowDraftLightbox(false);
         setIsRevisionMode(false);
     }
  }, [lightboxParam]);

  // Back button param sync for Cancel confirmation dialog
  const cancelConfirmParam = searchParams.get('cancel_confirm');
  useEffect(() => {
     if (cancelConfirmParam === 'true' && !showCancelConfirm) {
         setShowCancelConfirm(true);
     } else if (cancelConfirmParam !== 'true' && showCancelConfirm) {
         setShowCancelConfirm(false);
     }
  }, [cancelConfirmParam]);

  const openLightbox = () => {
      setActiveDraftIndex(0);
      setSearchParams(prev => { prev.set('lightbox', 'true'); return prev; }, { replace: false });
  };

  const closeLightbox = () => {
      setActiveDraftIndex(0);
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
    setSearchParams(prev => { prev.delete('cancel_confirm'); return prev; }, { replace: false });
    try {
      await cancelOrder(order.id);
    } catch (err) {
      toast("Failed to cancel order.");
    }
  };

  const handleCancel = () => {
    setSearchParams(prev => { prev.set('cancel_confirm', 'true'); return prev; }, { replace: false });
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
          <title>Project Tracking | Ranthula | Business Portfolio</title>
          <meta name="description" content="Track and coordinate your design, branding, and development projects in real-time with Ranthula." />
        </Helmet>
        <Loader2 className="animate-spin text-purple-600" size={48} />
        <p className="text-gray-500 dark:text-gray-400 font-bold uppercase tracking-[0.3em] text-xs">Syncing...</p>
      </div>
    );
  }

  // 1. Detailed View (Single Order)
  if (order) {
    const isFilesDeleted = order.isDeletedByAdmin === true;
    const activeIndex = getCurrentStepIndex(order.status);
    const hasDraft = !!order.draftImg || (!!order.draftImgs && order.draftImgs.length > 0);

    return (
      <div className="min-h-screen pt-24 px-4 pb-12 max-w-7xl mx-auto print:p-0 print:pt-0 print:m-0 print:min-h-0 print:w-full relative">
        <ConfirmationDialog 
            isOpen={showCancelConfirm}
            title="Cancel Order"
            message="Are you sure you want to cancel this order? This action cannot be undone."
            confirmText="Yes, Cancel Order"
            onConfirm={confirmCancel}
            onCancel={() => setSearchParams(prev => { prev.delete('cancel_confirm'); return prev; }, { replace: false })}
        />
        <Helmet>
          <title>Order #{order.id} | Tracking</title>
          <meta name="robots" content="noindex, nofollow" />
        </Helmet>
        <PrintableInvoice order={order} />
        <div className="print:hidden">
          
        </div>

        <div className="max-w-3xl mx-auto print:hidden">
          <div className="bg-white dark:bg-zinc-800/80 border border-zinc-300 dark:border-zinc-600/50 rounded-[2rem] p-6 md:p-12 relative overflow-hidden shadow-[0_15px_50px_rgba(0,0,0,0.07)] dark:shadow-[0_15px_50px_rgba(0,0,0,0.6)] dark:ring-1 dark:ring-white/5">
             <div className="flex justify-between items-start mb-8 md:mb-10">
               <div>
                 <h2 className="text-2xl md:text-4xl font-display text-gray-900 dark:text-white mb-2">{order.serviceType}</h2>
                 <div className="text-xs font-mono text-zinc-500 font-bold uppercase tracking-wider">{order.id}</div>
               </div>
               <div className={`px-4 py-2 rounded-full text-[10px] font-black uppercase tracking-widest border ${order.status === OrderStatus.COMPLETED ? 'bg-green-50 text-green-700 border-green-200 dark:bg-green-900/30 dark:text-green-400 dark:border-green-800 shadow-sm' : order.status === OrderStatus.WAITING_PAYMENT ? 'bg-orange-50 text-orange-700 border-orange-200 dark:bg-orange-900/30 dark:text-orange-400 dark:border-orange-800 shadow-sm' : 'bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-900/30 dark:text-purple-400 dark:border-purple-800 shadow-sm'}`}>
                 {order.status}
               </div>
             </div>
             
             <div className="relative pl-4 md:pl-6 space-y-8 md:space-y-10 my-8 md:my-12 w-full max-w-full sm:max-w-sm">
                <div className="absolute left-[23px] md:left-[31px] top-2 bottom-2 w-0.5 bg-zinc-300 dark:bg-zinc-700"></div>
                {STATUS_FLOW.map((s, idx) => {
                   const isCompleted = idx <= activeIndex;
                   const isCurrent = idx === activeIndex;
                   return (
                     <div key={s.id} className="relative flex items-center gap-6">
                        <div className={`w-3.5 h-3.5 rounded-full border-2 z-10 transition-all duration-500 ${isCompleted ? 'bg-purple-600 border-purple-600 shadow-sm scale-110' : 'bg-white dark:bg-zinc-800 border-zinc-400 dark:border-slate-500 shadow-inner'}`}></div>
                        <div className={`${isCompleted ? 'text-gray-900 dark:text-white font-extrabold' : 'text-zinc-500 dark:text-gray-400 font-medium'} ${isCurrent ? 'font-black text-purple-600 dark:text-purple-400 font-display' : ''} text-[10px] md:text-[11px] uppercase tracking-[0.2em]`}>{s.label}</div>
                     </div>
                   );
                })}
             </div>

             <div className="space-y-4">
                {order.status === OrderStatus.WAITING_PAYMENT && (
                   <div className="p-6 bg-orange-50 dark:bg-orange-950/20 border border-orange-200 dark:border-orange-800/30 rounded-3xl flex flex-col items-center gap-2 text-center animate-fade-in mb-4 shadow-sm">
                      <div className="flex items-center gap-2 text-orange-600 font-bold uppercase tracking-widest text-sm">
                        <DollarSign size={18} /> Payment Required
                      </div>
                      <p className="text-gray-500 dark:text-gray-400 text-[10px] font-medium uppercase tracking-wider font-sans">Please contact admin to complete payment.</p>
                   </div>
                )}

                {/* Light Mode: Completed assets listing */}
                {order.status === OrderStatus.COMPLETED && (
                   <div className="space-y-4">
                      {order.finalFiles && order.finalFiles.length > 0 && (
                         <div className="p-4 sm:p-8 bg-green-50/50 dark:bg-green-900/20 border border-green-200 dark:border-green-800/50 rounded-3xl animate-fade-in shadow-sm">
                            <div className="flex items-center gap-3 text-green-700 dark:text-green-400 font-black uppercase tracking-[0.2em] text-[10px] mb-6">
                              <CheckCircle2 size={18} /> Final Assets Ready
                            </div>
                            <div className="flex flex-col gap-3">
                              <div className="bg-white/60 dark:bg-zinc-900/40 rounded-2xl p-5 mb-1 flex justify-between items-center border border-green-200/60 dark:border-green-800/50">
                                <div className="flex items-center gap-4">
                                   <div className="p-3.5 bg-purple-100 dark:bg-purple-900/40 rounded-xl text-purple-600 dark:text-purple-400 shrink-0">
                                      <Package size={24} />
                                   </div>
                                   <div>
                                      <h4 className="text-gray-900 dark:text-white font-bold text-sm tracking-wide">Delivery Package</h4>
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
                                className="w-full flex items-center justify-center gap-3 py-6 bg-gray-900 dark:bg-white hover:bg-black dark:hover:bg-gray-100 text-white dark:text-gray-900 rounded-2xl transition-all shadow-xl dark:shadow-white/10 hover:shadow-2xl dark:hover:shadow-white/20 font-black uppercase tracking-widest text-sm group border-2 border-transparent hover:border-gray-700 dark:hover:border-white"
                              >
                                {isDownloadingAll ? (
                                  <><Loader2 size={20} className="animate-spin" /> Preparing {order.finalFiles.length > 1 ? `${downloadProgress}/${order.finalFiles.length}` : 'File'}...</>
                                ) : (
                                  <><ArrowDown size={20} className="group-hover:-translate-y-0.5 transition-transform animate-bounce" /> {order.finalFiles.length > 1 ? `Download All Files` : 'Download Final Asset'}</>
                                )}
                              </button>
                            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
                              <button onClick={() => window.print()} className="flex-1 flex items-center justify-center gap-2 bg-white dark:bg-zinc-900 hover:bg-gray-50 dark:hover:bg-slate-800 border border-gray-300 dark:border-zinc-600 text-gray-700 dark:text-gray-300 font-bold uppercase tracking-widest text-[10px] py-4 rounded-xl transition-colors shadow-sm">
                                 <Printer size={16} /> Print Invoice
                              </button>
                              <button disabled={isDownloadingInvoice} onClick={async () => {
                                 setIsDownloadingInvoice(true);
                                 try {
                                    await downloadInvoice(order);
                                 } finally {
                                    setIsDownloadingInvoice(false);
                                 }
                              }} className="flex-1 flex items-center justify-center gap-2 bg-white dark:bg-zinc-900 hover:bg-green-50 dark:hover:bg-green-900/40 border border-green-600 dark:border-green-500 text-green-700 dark:text-green-400 font-bold uppercase tracking-widest text-[10px] py-4 rounded-xl transition-colors shadow-sm disabled:opacity-50">
                                 {isDownloadingInvoice ? <Loader2 size={16} className="animate-spin" /> : <Download size={16} />} {isDownloadingInvoice ? 'Preparing...' : 'Download (PDF)'}
                              </button>
                            </div>
                          </div>
                         </div>
                      )}

                      {(!order.rating || isEditingFeedback) && (
                         <div className="p-8 bg-gray-50 dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-3xl animate-fade-in shadow-sm mt-4">
                           <h4 className="text-lg font-display text-gray-900 dark:text-white mb-4">{isEditingFeedback ? 'Edit your rating' : 'How was your experience?'}</h4>
                           <div className="flex justify-center gap-2 mb-6">
                             {[1, 2, 3, 4, 5].map((star) => (
                               <button key={star} onClick={() => setRating(star)} className={`text-4xl transition-colors hover:scale-110 ${rating >= star ? 'text-yellow-400' : 'text-gray-300 dark:text-slate-600 hover:text-yellow-200 dark:hover:text-yellow-400/50'}`}>
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
                                 className="w-full bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-700 rounded-xl p-4 outline-none focus:border-purple-500 min-h-[100px] text-sm mb-6 resize-none shadow-sm font-medium"
                               />
                               <div className="flex gap-2">
                                  {isEditingFeedback && (
                                     <button
                                       onClick={() => {
                                          setIsEditingFeedback(false);
                                          setRating(order.rating || 0);
                                          setFeedback(order.feedback || '');
                                       }}
                                       className="w-1/3 bg-gray-200 hover:bg-gray-300 text-gray-700 dark:text-gray-300 rounded-xl py-4 font-black uppercase text-[10px] tracking-widest transition-all shadow-sm"
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
                        <div className="p-6 bg-purple-50 dark:bg-purple-900/20 border border-purple-100 dark:border-purple-800/50 rounded-2xl flex flex-col items-center gap-3 text-center shadow-sm mt-4 relative">
                          <CheckCircle2 className="text-purple-600 dark:text-purple-400 mb-1" size={28} />
                          {feedbackSuccess ? (
                             <>
                               <span className="text-sm font-bold text-gray-900 dark:text-white">Successfully updated!</span>
                               <span className="text-xs text-gray-500 dark:text-gray-400">Your updated review has been submitted to admins.</span>
                             </>
                          ) : (
                             <>
                               <span className="text-sm font-bold text-gray-900 dark:text-white">Thank you for your feedback!</span>
                               <div className="flex gap-1 text-lg my-1">
                                  {[1, 2, 3, 4, 5].map(s => <span key={s} className={s <= (order.rating || 0) ? 'text-yellow-400' : 'text-gray-300 dark:text-slate-600'}>★</span>)}
                               </div>
                               {order.feedback && <p className="text-xs text-gray-600 dark:text-gray-300 italic">"{order.feedback}"</p>}
                               <button 
                                  onClick={() => setIsEditingFeedback(true)}
                                  className="mt-2 text-xs font-bold text-purple-600 dark:text-purple-400 hover:text-purple-700 flex items-center gap-1 bg-white dark:bg-zinc-800 px-4 py-2 rounded-full border border-purple-200 dark:border-zinc-700 shadow-sm transition-colors"
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
                  <button onClick={handleCancel} className="w-full bg-red-50 dark:bg-red-900/20 hover:bg-red-100 dark:hover:bg-red-900/40 border border-red-200 dark:border-red-800/50 text-red-650 dark:text-red-400 py-5 rounded-2xl font-black text-xs uppercase tracking-[0.2em] flex items-center justify-center gap-3 transition-all font-sans">
                    <Trash2 size={18} /> Cancel Order
                  </button>
                )}

                <button onClick={(e) => onHelpClick(order, e)} className="w-full bg-green-50 dark:bg-green-900/20 hover:bg-green-100 dark:hover:bg-green-900/40 border border-green-200 dark:border-green-800/50 text-green-700 dark:text-green-400 py-5 rounded-2xl font-black text-xs uppercase tracking-[0.2em] flex items-center justify-center gap-3 transition-all font-sans shadow-sm">
                  <MessageCircle size={18} /> Contact Support
                </button>
             </div>
          </div>
        </div>

        {/* Draft Lightbox Modal - FIXED SCROLLING */}
        {showDraftLightbox && (() => {
          const drafts = order.draftImgs || (order.draftImg ? [order.draftImg] : []);
          const hasMultipleDrafts = drafts.length > 1;
          const activeDraft = drafts[activeDraftIndex] || order.draftImg || '';
          
          return (
            <div className="fixed inset-0 z-[200] flex items-center justify-center p-0 md:p-4 overflow-hidden animate-fade-in">
               <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" onClick={() => !isRevisionMode && closeLightbox()}></div>
               
               <div className="relative w-full max-w-6xl h-[100dvh] md:h-[90vh] bg-white dark:bg-zinc-900 border-0 md:border border-gray-200/60 dark:border-zinc-700 rounded-none md:rounded-2xl overflow-y-auto md:overflow-hidden shadow-2xl flex flex-col animate-slide-up">
                  
                  {/* Header */}
                  <div className="px-5 md:px-8 py-4 md:py-6 border-b border-gray-100 dark:border-zinc-700 flex items-center justify-between bg-white dark:bg-zinc-900 z-20 shrink-0">
                    <div>
                      <h4 className="text-xl md:text-2xl font-black text-gray-900 dark:text-white font-sans">{order.serviceType}</h4>
                      <p className="text-[10px] md:text-[11px] text-gray-500 font-mono font-bold uppercase tracking-widest mt-0.5">{order.id}</p>
                    </div>
                    <button onClick={closeLightbox} className="p-2 rounded-full bg-gray-50 dark:bg-zinc-800 hover:bg-gray-100 dark:hover:bg-slate-700 text-gray-500 hover:text-gray-900 dark:hover:text-slate-100 transition-colors border border-gray-200/50 dark:border-zinc-700 shadow-sm active:scale-[0.96]">
                      <X size={20} strokeWidth={2.5} />
                    </button>
                  </div>

                  {/* Main Content Area */}
                  <div className="flex-grow flex flex-col md:flex-row overflow-visible md:overflow-hidden">
                    
                    {/* Left Column: Preview Viewbox & Thumbnails */}
                    <div className="w-full md:w-[60%] lg:w-[65%] flex-grow md:flex-grow-0 md:h-full bg-zinc-950 flex flex-col overflow-hidden border-b md:border-b-0 md:border-r border-gray-150 dark:border-zinc-700">
                      
                      {/* Viewbox */}
                      <div className="relative h-[380px] md:h-0 md:flex-grow w-full flex items-center justify-center bg-zinc-950 overflow-hidden">
                        {activeDraft ? (
                          <div className="relative w-full h-full">
                            {/* Zoom Engine */}
                            <ZoomableDraftViewer src={activeDraft} />

                            {/* Secure Preview Warning Indicator */}
                            <div className="absolute top-4 left-4 bg-black/75 backdrop-blur-md px-3 py-1.5 rounded-full flex items-center gap-2 pointer-events-none text-white text-[9px] font-black tracking-widest uppercase z-10 border border-white/10">
                              <Shield size={12} className="text-red-400 animate-pulse" />
                              <span>Watermarked Preview</span>
                            </div>

                            {/* Mobile / Responsive Floating Version Indicator */}
                            {hasMultipleDrafts && (
                              <div className="absolute top-4 right-4 bg-black/75 backdrop-blur-md px-3 py-1.5 rounded-full pointer-events-none text-white text-[9px] font-bold tracking-wider z-10 border border-white/10">
                                Draft {activeDraftIndex + 1} of {drafts.length}
                              </div>
                            )}

                            {/* Left/Right controls (Overlay for multiple drafts) */}
                            {hasMultipleDrafts && (
                              <>
                                <button 
                                  onClick={() => setActiveDraftIndex(prev => (prev - 1 + drafts.length) % drafts.length)}
                                  className="absolute left-4 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-black/60 hover:bg-black/85 backdrop-blur-md text-white flex items-center justify-center transition-all z-20 border border-white/10 shadow-lg active:scale-95"
                                  title="Previous Draft"
                                >
                                  <ChevronLeft size={20} />
                                </button>
                                <button 
                                  onClick={() => setActiveDraftIndex(prev => (prev + 1) % drafts.length)}
                                  className="absolute right-4 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-black/60 hover:bg-black/85 backdrop-blur-md text-white flex items-center justify-center transition-all z-20 border border-white/10 shadow-lg active:scale-95"
                                  title="Next Draft"
                                >
                                  <ChevronRight size={20} />
                                </button>
                              </>
                            )}
                          </div>
                        ) : (
                          <div className="text-gray-400 italic text-sm">No preview available.</div>
                        )}
                      </div>

                      {/* Mobile Dot Indicators */}
                      {hasMultipleDrafts && (
                        <div className="md:hidden flex justify-center gap-1.5 py-3 bg-zinc-950/40 border-b border-gray-150 dark:border-zinc-700">
                          {drafts.map((_, idx) => (
                            <button
                              key={idx}
                              onClick={() => setActiveDraftIndex(idx)}
                              className={`w-1.5 h-1.5 rounded-full transition-all ${activeDraftIndex === idx ? 'bg-purple-500 w-3' : 'bg-gray-400/55'}`}
                            />
                          ))}
                        </div>
                      )}

                      {/* Desktop Version Thumbnails strip */}
                      {hasMultipleDrafts && (
                        <div className="hidden md:block px-6 py-4 border-t border-gray-150 dark:border-zinc-700 bg-zinc-950 text-white shrink-0">
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-[10px] font-black uppercase tracking-wider text-purple-400">
                              Version History
                            </span>
                            <span className="text-[10px] font-mono text-zinc-400">
                              Draft {activeDraftIndex + 1} of {drafts.length}
                            </span>
                          </div>
                          <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-thin">
                            {drafts.map((draftUrl, idx) => (
                              <button 
                                key={idx}
                                onClick={() => setActiveDraftIndex(idx)}
                                className={`relative w-12 h-12 rounded-lg overflow-hidden border-2 transition-all shrink-0 ${activeDraftIndex === idx ? 'border-purple-500 scale-105 shadow-md' : 'border-transparent opacity-50 hover:opacity-100'}`}
                              >
                                <img src={draftUrl} className="w-full h-full object-cover" alt={`Thumb ${idx + 1}`} />
                                <div className="absolute inset-0 bg-black/30 flex items-center justify-center text-[9px] text-white font-bold font-mono">
                                  #{idx + 1}
                                </div>
                              </button>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Right Column: Actions, guidelines and inputs */}
                    <div className="w-full md:w-[40%] lg:w-[35%] md:h-full flex flex-col bg-white dark:bg-zinc-900 overflow-visible md:overflow-y-auto">
                      <div className="p-5 md:p-8 flex-grow flex flex-col justify-between gap-5">
                        {isRevisionMode ? (
                          <div className="space-y-4 animate-fade-in flex-grow flex flex-col">
                            <div className="bg-gray-50 dark:bg-zinc-700/50 border border-gray-200 dark:border-zinc-700 rounded-2xl p-4 flex-grow flex flex-col min-h-[120px] md:min-h-[160px]">
                              <label className="text-[10px] font-black text-purple-600 dark:text-purple-400 uppercase tracking-widest mb-1.5 block shrink-0">
                                Revision Notes for Draft #{activeDraftIndex + 1}
                              </label>
                              <textarea 
                                value={revisionNotes}
                                onChange={(e) => setRevisionNotes(e.target.value)}
                                placeholder="Please specify changes for this version: colors, layout, details, etc."
                                className="w-full bg-transparent border-none text-gray-900 dark:text-white text-sm outline-none placeholder:text-gray-400 flex-grow resize-none"
                                autoFocus
                              />
                            </div>
                            <div className="flex flex-col md:flex-row gap-3 shrink-0">
                              <button onClick={() => setIsRevisionMode(false)} className="w-full justify-center md:flex-1 py-4 md:py-3 rounded-2xl md:rounded-none bg-gray-100/80 md:bg-transparent dark:bg-zinc-800/80 dark:md:bg-transparent text-gray-700 md:text-gray-500 hover:text-gray-900 dark:text-gray-200 dark:md:text-slate-350 dark:hover:text-white font-bold uppercase text-[12px] md:text-[10px] tracking-widest transition-all active:scale-[0.96]">
                                Cancel
                              </button>
                              <button 
                                onClick={handleSubmitRevision} 
                                disabled={!revisionNotes.trim() || isSubmittingAction}
                                className="w-full justify-center md:flex-1 bg-purple-600 hover:bg-purple-700 text-white py-4 md:py-3 rounded-2xl md:rounded-xl font-black uppercase text-[14px] md:text-[10px] tracking-widest transition-all disabled:opacity-50 shadow-lg active:scale-[0.96]"
                              >
                                {isSubmittingAction ? 'Submitting...' : 'Send'}
                              </button>
                            </div>
                          </div>
                        ) : (
                          <div className="space-y-4 md:space-y-6 animate-fade-in flex-grow flex flex-col justify-between">
                            <div className="hidden md:block space-y-4">
                              <div className="bg-purple-50 dark:bg-purple-950/20 border border-purple-100 dark:border-purple-800/30 rounded-2xl p-4">
                                <div className="flex items-center gap-2.5 text-purple-700 dark:text-purple-300 font-black uppercase tracking-widest text-[10px] mb-1.5">
                                  <CheckCircle2 size={14} /> Draft Revision & Approval
                                </div>
                                <p className="text-gray-600 dark:text-purple-200/90 text-[11px] leading-relaxed font-medium">
                                  Carefully examine layout, spelling, and colors on Draft #{activeDraftIndex + 1}. Request revisions if changes are needed, or click Approve to proceed.
                                </p>
                              </div>
                            </div>
                            <div className="space-y-4 shrink-0 pb-4 md:pb-0">
                              <div className="grid grid-cols-1 gap-3">
                                <button onClick={() => setIsRevisionMode(true)} className="w-full py-4 md:py-3.5 border border-gray-200 dark:border-zinc-700 rounded-2xl md:rounded-xl text-gray-700 dark:text-gray-300 font-bold uppercase text-[14px] md:text-[10px] tracking-widest hover:bg-gray-50 dark:hover:bg-slate-800 transition-all flex items-center justify-center gap-2 shadow-sm active:scale-[0.96] bg-white dark:bg-zinc-900">
                                  <Clock size={16} className="md:w-3.5 md:h-3.5" /> Revision
                                </button>
                                <button onClick={handleApprove} disabled={isSubmittingAction} className="w-full bg-purple-600 hover:bg-purple-700 text-white py-4 md:py-3.5 rounded-2xl md:rounded-xl font-bold uppercase text-[14px] md:text-[10px] tracking-widest transition-all flex items-center justify-center gap-2 shadow-lg active:scale-[0.96]">
                                  <Check size={18} className="md:w-4 md:h-4" /> Approve
                                </button>
                              </div>
                              
                              <p className="text-[10px] md:text-[9px] text-center text-gray-500 md:text-gray-400 uppercase font-bold md:font-semibold tracking-widest px-4 leading-relaxed mt-2">
                                Approving commits this version as final and initiates delivery.
                              </p>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>

                  </div>
               </div>
            </div>
          );
        })()}
      </div>
    );
  }

  // 2. List View (Grid of Cards)
  return (
    <div className="min-h-screen pt-24 px-4 pb-12 max-w-7xl mx-auto">
      <Helmet>
        <title>Project Tracking | Ranthula | Business Portfolio</title>
        <meta name="description" content="Track, search, and monitor your active branding and digital design projects in real-time with Ranthula." />
      </Helmet>
        <div className="print:hidden">
           
        </div>

       <div className="mb-12 flex flex-col md:flex-row justify-between items-center gap-8">
          <div>
            <h1 className="text-5xl font-display font-medium text-gray-900 dark:text-white mb-2 uppercase tracking-tight">Active Projects</h1>
            <p className="text-gray-500 dark:text-gray-400 text-lg font-light">Keep track of your creative requests (Real-time updates).</p>
          </div>
          <div className="flex flex-col sm:flex-row items-center gap-4 w-full md:w-auto">
             <div className="relative w-full sm:w-64">
               <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
               <input 
                 type="text" 
                 placeholder="Search orders..." 
                 value={searchQuery}
                 onChange={(e) => setSearchQuery(e.target.value)}
                 className="w-full bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-700 rounded-full pl-10 pr-4 py-3 outline-none focus:border-purple-600 focus:ring-2 focus:ring-purple-600/20 text-sm shadow-sm transition-all"
               />
             </div>
             <Link to="/order" className="w-full sm:w-auto shrink-0 bg-purple-600 text-white px-8 py-4.5 rounded-full font-bold shadow-md hover:bg-purple-700 hover:scale-[1.01] transition-all flex items-center justify-center gap-3 uppercase text-xs tracking-widest border border-purple-700">
                <Package size={20} /> New Order
             </Link>
          </div>
       </div>

       {error && (
         <div className="mb-8 p-6 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900/30 rounded-2xl flex flex-col items-center justify-center text-center">
             <ShieldAlert className="text-red-500 dark:text-red-400 mb-2" size={32} />
             <p className="text-red-700 dark:text-red-400 font-bold">{error}</p>
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
           <div key={o.id} onClick={() => setSearchParams({ id: o.id })} className="group relative bg-white dark:bg-zinc-800/80 border border-zinc-300 dark:border-zinc-600/50 hover:border-purple-400 rounded-2xl transition-all duration-300 hover:bg-gray-50 dark:hover:bg-slate-700/50 overflow-hidden flex flex-col h-full shadow-[0_10px_35px_rgba(0,0,0,0.06)] dark:shadow-[0_10px_35px_rgba(0,0,0,0.4)] dark:ring-1 dark:ring-white/5 hover:shadow-xl cursor-pointer">
             <div className="p-6 pb-0 flex-grow relative z-10">
                 <div className="flex justify-between items-start mb-6">
                   <div className="flex items-center gap-2">
                       {o.status === OrderStatus.PENDING && (
                          <div className="relative flex h-2 w-2 mr-1">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
                          </div>
                       )}
                       <div className="px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border border-purple-300 dark:border-purple-500/30 bg-purple-50 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 shadow-sm">
                         {o.status}
                       </div>
                   </div>
                   
                   <div onClick={(e) => copyToClipboard(o.id, e)} className="flex items-center gap-2 cursor-pointer group/id hover:bg-gray-100 dark:hover:bg-slate-700 dark:bg-zinc-800 px-2.5 py-1.5 -mr-2 rounded-lg transition-colors border border-transparent hover:border-zinc-250">
                     <span className="text-[10px] font-black text-gray-500 dark:text-gray-400 uppercase tracking-widest">ID</span>
                     <div className="text-xs font-mono text-gray-600 dark:text-gray-400 group-hover/id:text-purple-600 transition-colors uppercase font-bold">{o.id}</div>
                     <Copy size={12} className="text-gray-400 group-hover/id:text-purple-600 opacity-0 group-hover/id:opacity-100 transition-all" />
                   </div>
                 </div>
                 
                 <div className="mb-2 flex flex-wrap items-center gap-2">
                    <h3 className="text-xl font-display font-black text-gray-900 dark:text-white group-hover:text-purple-600 transition-colors">{o.serviceType}</h3>
                    {isFilesDeleted && (
                        <span className="px-2 py-0.5 bg-red-50 dark:bg-red-900/30 text-red-650 dark:text-red-400 border border-red-150 dark:border-red-800/50 text-[9px] font-bold uppercase rounded-md tracking-wider">
                            Files Deleted
                        </span>
                    )}
                 </div>
                 
                 <p className="text-gray-550 text-sm line-clamp-2 mb-6 font-sans leading-relaxed">{o.requirements}</p>
             </div>
             
             <div className="p-6 pt-4 border-t border-zinc-200 dark:border-zinc-700 flex flex-wrap justify-between items-center gap-y-3 relative z-50 bg-gray-50/70 dark:bg-zinc-800/70 pointer-events-auto">
                <div className="flex flex-col">
                    <span className="text-[10px] text-gray-400 font-bold uppercase">Created</span>
                    <span className="text-xs text-gray-700 dark:text-gray-300 font-mono font-bold">{new Date(o.createdAt).toLocaleDateString()}</span>
                </div>
                
                <div className="flex items-center gap-2 bg-transparent">
                   <button onClick={(e) => onHelpClick(o, e)} className="flex items-center gap-2 px-3.5 py-2.5 rounded-full bg-white dark:bg-zinc-900 hover:bg-green-50 dark:hover:bg-green-900/40 text-green-700 transition-all border border-zinc-300 dark:border-zinc-700 hover:border-green-350 dark:hover:border-green-800/50 shadow-sm">
                       <MessageCircle size={15} />
                       <span className="text-[9px] font-black uppercase tracking-wider">Help</span>
                   </button>
                   {(o.status === OrderStatus.PENDING || o.status === OrderStatus.REVIEWING) && <button onClick={(e) => onEditClick(o.id, e)} className="p-3 rounded-full bg-white dark:bg-zinc-900 hover:bg-gray-100 dark:hover:bg-slate-700 dark:bg-zinc-800 text-gray-650 transition-all border border-zinc-300 shadow-sm"><Edit2 size={14} /></button>}
                </div>
             </div>
           </div>
           );
         })}
       </div>
    </div>
  );
};
