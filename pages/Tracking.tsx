import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet';
import { useSearchParams, Link, useNavigate } from 'react-router-dom';
import { Package, CheckCircle2, AlertCircle, Clock, DollarSign, Download, Home, MessageCircle, Edit2, Trash2, Eye, Copy, Loader2, Info, X, Send, ShieldAlert, Check, Image as ImageIcon } from 'lucide-react';
import { listenToOrderById, updateOrder, cancelOrder, listenToOrdersByClientId } from '../services/storageService';
import { Order, OrderStatus, User } from '../types';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

const downloadInvoice = (order: Order) => {
  const doc = new jsPDF();
  
  // Header
  doc.setFontSize(22);
  doc.setTextColor(147, 51, 234); // Purple 600
  doc.text("INVOICE / RECEIPT", 14, 20);
  
  doc.setFontSize(10);
  doc.setTextColor(100);
  doc.text(`Order ID: ${order.id}`, 14, 30);
  doc.text(`Date: ${new Date(order.createdAt).toLocaleDateString()}`, 14, 35);
  doc.text(`Status: ${order.status}`, 14, 40);
  
  // Client Info
  doc.setFontSize(12);
  doc.setTextColor(0);
  doc.text("Client Summary", 14, 55);
  doc.setFontSize(10);
  doc.setTextColor(100);
  doc.text(`Name: ${order.clientName}`, 14, 62);
  doc.text(`Email: ${order.email}`, 14, 67);
  doc.text(`Service: ${order.serviceType}`, 14, 72);
  doc.text(`Estimated Completion: ${order.estimatedCompletion}`, 14, 77);

  const tableData: any[][] = [
    [order.serviceType, `LKR ${order.originalPrice !== undefined ? order.originalPrice.toLocaleString() : order.price.toLocaleString()}`]
  ];

  if (order.discountApplied && order.discountApplied > 0 && order.originalPrice) {
    tableData.push([`Discount (${order.discountApplied}%)`, `- LKR ${(order.originalPrice - order.price).toLocaleString()}`]);
  }

  // Cost Details Table
  autoTable(doc, {
    startY: 90,
    head: [['Description', 'Amount']],
    body: tableData,
    foot: [['Total Paid', `LKR ${order.price.toLocaleString()}`]],
    theme: 'grid',
    headStyles: { fillColor: [147, 51, 234] },
    footStyles: { fillColor: [243, 244, 246], textColor: 0, fontStyle: 'bold' }
  });

  // Footer
  doc.setFontSize(9);
  doc.setTextColor(150);
  doc.text("Thank you for your business!", 14, (doc as any).lastAutoTable.finalY + 20);
  
  doc.save(`Invoice_${order.id}.pdf`);
};

interface TrackingProps {
  user: User | null;
}

export const Tracking: React.FC<TrackingProps> = ({ user }) => {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const [trackingId, setTrackingId] = useState(searchParams.get('id') || '');
  const [order, setOrder] = useState<Order | null>(null);
  const [userOrders, setUserOrders] = useState<Order[]>([]);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  // Modal States
  const [showDraftLightbox, setShowDraftLightbox] = useState(false);
  const [isRevisionMode, setIsRevisionMode] = useState(false);
  const [revisionNotes, setRevisionNotes] = useState('');
  const [isSubmittingAction, setIsSubmittingAction] = useState(false);
  
  // Body scroll lock for lightbox
  useEffect(() => {
    if (showDraftLightbox) {
      document.body.classList.add('overflow-hidden');
    } else {
      document.body.classList.remove('overflow-hidden');
    }
    return () => { document.body.classList.remove('overflow-hidden'); }
  }, [showDraftLightbox]);

  // Fetch specific order if ID is in URL
  useEffect(() => {
    const idFromUrl = searchParams.get('id');
    if (idFromUrl) {
      setTrackingId(idFromUrl);
      setError('');
      setIsLoading(true);
      const unsubscribe = listenToOrderById(idFromUrl, (foundOrder) => {
        setIsLoading(false);
        if (foundOrder) {
          setOrder(foundOrder);
          setError('');
        } else {
          setOrder(null);
          setError('Order not found.');
        }
      });
      return () => unsubscribe();
    } else {
      setOrder(null);
      setIsLoading(false);
    }
  }, [searchParams]);

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
    alert(`Order ID ${text} copied!`);
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
      await updateOrder({ ...order, status: OrderStatus.WAITING_PAYMENT });
      setShowDraftLightbox(false);
    } catch (err) {
      alert("Failed to approve draft.");
    } finally {
      setIsSubmittingAction(false);
    }
  };

  const handleSubmitRevision = async () => {
    if (!order || !revisionNotes.trim()) return;
    setIsSubmittingAction(true);
    try {
      await updateOrder({ 
        ...order, 
        status: OrderStatus.REVISION, 
        revisionNotes: revisionNotes.trim() 
      });
      setIsRevisionMode(false);
      setRevisionNotes('');
      setShowDraftLightbox(false);
    } catch (err) {
      alert("Failed to submit revision.");
    } finally {
      setIsSubmittingAction(false);
    }
  };

  const handleCancel = async () => {
    if (!order) return;
    if (window.confirm("Are you sure you want to cancel this order?")) {
      try {
        await cancelOrder(order.id);
      } catch (err) {
        alert("Failed to cancel order.");
      }
    }
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
          <title>Project Tracking | Ranthul's Portfolio</title>
        </Helmet>
        <Loader2 className="animate-spin text-purple-600" size={48} />
        <p className="text-gray-500 font-bold uppercase tracking-[0.3em] text-xs">Syncing...</p>
      </div>
    );
  }

  // 1. Detailed View (Single Order)
  if (order) {
    const isFilesDeleted = order.isDeletedByAdmin === true;
    const activeIndex = getCurrentStepIndex(order.status);
    const hasDraft = !!order.draftImg;

    return (
      <div className="min-h-screen pt-24 px-4 pb-12 max-w-7xl mx-auto">
        <Helmet>
          <title>Order #{order.id} | Tracking</title>
          <meta name="robots" content="noindex, nofollow" />
        </Helmet>
        <div className="mb-8">
          <button onClick={() => { setOrder(null); setSearchParams({}); }} className="inline-flex items-center gap-3 text-gray-600 hover:text-gray-900 transition-all group bg-white border border-gray-200 px-4 py-2 rounded-full shadow-sm">
             <Home size={18} />
             <span className="text-xs font-bold uppercase tracking-widest">Back to Projects</span>
          </button>
        </div>

        <div className="max-w-3xl mx-auto">
          <div className="bg-white border border-zinc-300 rounded-[2rem] p-8 md:p-12 relative overflow-hidden shadow-[0_15px_50px_rgba(0,0,0,0.07)]">
             <div className="flex justify-between items-start mb-10">
               <div>
                 <h2 className="text-3xl md:text-4xl font-display text-gray-900 mb-2">{order.serviceType}</h2>
                 <div className="text-xs font-mono text-zinc-500 font-bold uppercase tracking-wider">{order.id}</div>
               </div>
               <div className={`px-4 py-2 rounded-full text-[10px] font-black uppercase tracking-widest border ${order.status === OrderStatus.COMPLETED ? 'bg-green-50 text-green-700 border-green-200 shadow-sm' : order.status === OrderStatus.WAITING_PAYMENT ? 'bg-orange-50 text-orange-700 border-orange-200 shadow-sm' : 'bg-purple-50 text-purple-700 border-purple-200 shadow-sm'}`}>
                 {order.status}
               </div>
             </div>
             
             <div className="relative pl-6 space-y-10 my-12 max-w-sm">
                <div className="absolute left-[31px] top-2 bottom-2 w-0.5 bg-zinc-300"></div>
                {STATUS_FLOW.map((s, idx) => {
                   const isCompleted = idx <= activeIndex;
                   const isCurrent = idx === activeIndex;
                   return (
                     <div key={s.id} className="relative flex items-center gap-6">
                        <div className={`w-3.5 h-3.5 rounded-full border-2 z-10 transition-all duration-500 ${isCompleted ? 'bg-purple-600 border-purple-600 shadow-sm scale-110' : 'bg-white border-zinc-400 shadow-inner'}`}></div>
                        <div className={`${isCompleted ? 'text-zinc-900 font-extrabold' : 'text-zinc-400 font-medium'} ${isCurrent ? 'font-black text-purple-600 font-display' : ''} text-[11px] uppercase tracking-[0.2em]`}>{s.label}</div>
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
                      <p className="text-gray-500 text-[10px] font-medium uppercase tracking-wider font-sans">Please contact admin to complete payment.</p>
                   </div>
                )}

                {/* Light Mode: Completed assets listing */}
                {order.status === OrderStatus.COMPLETED && order.finalFiles && order.finalFiles.length > 0 && (
                   <div className="p-8 bg-green-50/50 border border-green-200 rounded-3xl animate-fade-in mb-4 shadow-sm">
                      <div className="flex items-center gap-3 text-green-700 font-black uppercase tracking-[0.2em] text-[10px] mb-6">
                        <CheckCircle2 size={18} /> Final Assets Ready
                      </div>
                      <div className="space-y-3">
                        {order.finalFiles.map((f, i) => (
                           <a 
                             key={i} 
                             href={f.data} 
                             download={f.name}
                             target="_blank" 
                             rel="noopener noreferrer"
                             className="flex items-center justify-between p-4 bg-white hover:bg-gray-50 border border-gray-200 rounded-2xl group transition-all shadow-sm"
                           >
                              <div className="flex items-center gap-4">
                                 <div className="p-2 bg-green-100 rounded-lg text-green-700 group-hover:scale-110 transition-transform">
                                    <ImageIcon size={16} />
                                 </div>
                                 <span className="text-xs font-bold text-gray-700 group-hover:text-gray-900 truncate max-w-[180px]">{f.name}</span>
                              </div>
                              <Download size={18} className="text-gray-400 group-hover:text-green-600 group-hover:scale-110 transition-all" />
                           </a>
                        ))}
                      </div>
                      
                      <div className="mt-6 pt-6 border-t border-green-200/50">
                        <button onClick={() => downloadInvoice(order)} className="w-full flex items-center justify-center gap-2 bg-white hover:bg-green-50 border border-green-600 text-green-700 font-bold uppercase tracking-widest text-[10px] py-4 rounded-xl transition-colors shadow-sm">
                           <Download size={16} /> Download Invoice (PDF)
                        </button>
                      </div>
                   </div>
                )}

                {hasDraft && (
                  <button onClick={() => setShowDraftLightbox(true)} className="w-full bg-purple-600 hover:bg-purple-700 text-white py-5 rounded-2xl font-black text-xs uppercase tracking-[0.2em] flex items-center justify-center gap-3 hover:scale-[1.02] transition-all shadow-sm">
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
             <div className="fixed inset-0 bg-black/95 backdrop-blur-xl" onClick={() => !isRevisionMode && setShowDraftLightbox(false)}></div>
             
             <div className="relative w-full max-w-lg bg-white border border-gray-200 rounded-[3rem] overflow-hidden shadow-2xl animate-fade-in my-8">
                <div className="relative aspect-[3/4] bg-gray-100 flex items-center justify-center border-b border-gray-150">
                   {order.draftImg ? (
                     <div className="relative w-full h-full">
                       <img src={order.draftImg} className="w-full h-full object-contain pointer-events-none select-none" alt="Draft Preview" />
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
                   <button onClick={() => setShowDraftLightbox(false)} className="absolute top-6 right-6 bg-white/80 hover:bg-gray-150 p-3 rounded-full text-gray-600 hover:text-gray-900 transition-all border border-gray-250 z-50 shadow-sm">
                     <X size={20} />
                   </button>
                </div>

                <div className="p-8 md:p-10 bg-white border-t border-gray-150">
                   <h4 className="text-2xl font-display text-gray-900 mb-2">{order.serviceType}</h4>
                   <p className="text-gray-400 font-mono text-xs uppercase tracking-widest mb-8">{order.id}</p>

                   {isRevisionMode ? (
                     <div className="space-y-6 animate-fade-in">
                        <div className="bg-gray-50 border border-gray-200 rounded-2xl p-4">
                           <label className="text-[10px] font-black text-purple-600 uppercase tracking-widest mb-2 block">Your Feedback</label>
                           <textarea 
                             value={revisionNotes}
                             onChange={(e) => setRevisionNotes(e.target.value)}
                             placeholder="What would you like us to change? Please be specific about colors, layout, or text."
                             className="w-full bg-transparent border-none text-gray-900 text-sm outline-none placeholder:text-gray-400 min-h-[120px] resize-none"
                             autoFocus
                           />
                        </div>
                        <div className="flex gap-4">
                           <button onClick={() => setIsRevisionMode(false)} className="flex-1 py-4 text-gray-400 font-bold uppercase text-[10px] tracking-widest hover:text-gray-900 transition-colors">Cancel</button>
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
                           <button onClick={() => setIsRevisionMode(true)} className="w-full py-4 border border-gray-200 rounded-xl text-gray-700 font-bold uppercase text-[10px] tracking-widest hover:bg-gray-50 transition-all flex items-center justify-center gap-3 font-sans shadow-sm">
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
        <title>Project Tracking | Ranthul's Portfolio</title>
        <meta name="description" content="Track your projects with Ranthul." />
      </Helmet>
       <div className="mb-12">
          <Link to="/" className="inline-flex items-center gap-3 text-gray-700 hover:text-gray-900 transition-all group bg-white border border-zinc-300 px-5 py-2.5 rounded-full shadow-[0_4px_12px_rgba(0,0,0,0.05)]">
            <Home size={18} className="text-purple-600 animate-float" />
            <span className="text-xs font-black uppercase tracking-widest">Back to Home</span>
          </Link>
       </div>

       <div className="mb-12 flex flex-col md:flex-row justify-between items-center gap-8">
          <div>
            <h1 className="text-5xl font-display font-medium text-gray-900 mb-2 uppercase tracking-tight">Active Projects</h1>
            <p className="text-gray-500 text-lg font-light">Keep track of your creative requests (Real-time updates).</p>
          </div>
          <Link to="/order" className="bg-purple-600 text-white px-8 py-4.5 rounded-full font-bold shadow-md hover:bg-purple-700 hover:scale-[1.01] transition-all flex items-center gap-3 uppercase text-xs tracking-widest border border-purple-700">
             <Package size={20} /> New Order
          </Link>
       </div>

       <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
         {userOrders.map((o) => {
           const isFilesDeleted = o.isDeletedByAdmin === true;
           
           return (
           <div key={o.id} onClick={() => setSearchParams({ id: o.id })} className="group relative bg-white border border-zinc-300 hover:border-purple-400 rounded-2xl transition-all duration-300 hover:bg-gray-50/20 overflow-hidden flex flex-col h-full shadow-[0_10px_35px_rgba(0,0,0,0.06)] hover:shadow-xl cursor-pointer">
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
                   
                   <div onClick={(e) => copyToClipboard(o.id, e)} className="flex items-center gap-2 cursor-pointer group/id hover:bg-gray-100 px-2.5 py-1.5 -mr-2 rounded-lg transition-colors border border-transparent hover:border-zinc-250">
                     <span className="text-[10px] font-black text-gray-500 uppercase tracking-widest">ID</span>
                     <div className="text-xs font-mono text-gray-600 group-hover/id:text-purple-600 transition-colors uppercase font-bold">{o.id}</div>
                     <Copy size={12} className="text-gray-400 group-hover/id:text-purple-600 opacity-0 group-hover/id:opacity-100 transition-all" />
                   </div>
                 </div>
                 
                 <div className="mb-2 flex flex-wrap items-center gap-2">
                    <h3 className="text-xl font-display font-black text-gray-900 group-hover:text-purple-600 transition-colors">{o.serviceType}</h3>
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
                    <span className="text-xs text-gray-700 font-mono font-bold">{new Date(o.createdAt).toLocaleDateString()}</span>
                </div>
                
                <div className="flex items-center gap-2 bg-transparent">
                   <button onClick={(e) => onHelpClick(o, e)} className="flex items-center gap-2 px-3.5 py-2.5 rounded-full bg-white hover:bg-green-50 text-green-700 transition-all border border-zinc-300 hover:border-green-350 shadow-sm">
                       <MessageCircle size={15} />
                       <span className="text-[9px] font-black uppercase tracking-wider">Help</span>
                   </button>
                   {(o.status === OrderStatus.PENDING || o.status === OrderStatus.REVIEWING) && <button onClick={(e) => onEditClick(o.id, e)} className="p-3 rounded-full bg-white hover:bg-gray-100 text-gray-650 transition-all border border-zinc-300 shadow-sm"><Edit2 size={14} /></button>}
                </div>
             </div>
           </div>
           );
         })}
       </div>
    </div>
  );
};
