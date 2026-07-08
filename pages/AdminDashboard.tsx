import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet-async';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { listenToOrders, updateOrder } from '../services/storageService';
import { deleteFileFromUrl } from '../services/fileUploadService';
import { sendStatusUpdateEmail } from '../services/emailService';
import { listenToContacts, ContactMessage, addTestimonial } from '../services/dataService';
import { Order, OrderStatus, User } from '../types';
import { uploadFileWithProgress } from '../services/fileUploadService';
import { downloadInvoice } from '../utils/invoiceGenerator';
import { AdminSettings } from '../components/AdminSettings';
import { AdminPortfolio } from '../components/AdminPortfolio';
import { AdminSkills } from '../components/AdminSkills';
import { AdminEducation } from '../components/AdminEducation';
import { AdminExperience } from '../components/AdminExperience';
import { AdminContacts } from '../components/AdminContacts';
import { AdminTestimonials } from '../components/AdminTestimonials';
import { AdminInvoice } from '../components/AdminInvoice';
import { AdminEmail } from '../components/AdminEmail';
import { AdminShares } from '../components/AdminShares';
import { ClientActivityChart } from '../components/ClientActivityChart';
import { Search, MessageSquare, MessageCircle, Layout as LayoutIcon, LogOut, ChevronRight, Save, User as UserIcon, X, AlertCircle, Download, Music, Copy, Check, Upload, ImageIcon, FileBox, RefreshCw, DollarSign, ChevronUp, ChevronDown, Loader2, Trash2, Bell, BarChart2, List, Settings, Briefcase, GraduationCap, Award, Mail, Plus, Star, ArrowLeft, Receipt } from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from 'recharts';

interface AdminDashboardProps {
  user?: User | null;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({ user }) => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const tabFromUrl = searchParams.get('tab');
  
  const [activeTab, setActiveTab] = useState<'orders' | 'reviews' | 'charts' | 'settings' | 'portfolio' | 'skills' | 'experience' | 'education' | 'contacts' | 'testimonials' | 'invoice' | 'email'>(
    (tabFromUrl as any) || 'orders'
  );

  useEffect(() => {
    if (tabFromUrl) {
      setActiveTab(tabFromUrl as any);
    }
  }, [tabFromUrl]);

  const handleTabChange = (tab: 'orders' | 'reviews' | 'charts' | 'settings' | 'portfolio' | 'skills' | 'experience' | 'education' | 'contacts' | 'testimonials' | 'invoice' | 'email') => {
    setActiveTab(tab);
    setSearchParams({ tab });
  };

  const [orders, setOrders] = useState<Order[]>([]);
  const [contacts, setContacts] = useState<ContactMessage[]>([]);
  const [searchTerm, setSearchTerm] = useState('');

  const [filterStatus, setFilterStatus] = useState<string>('All');
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  
  // Progress State
  const [uploadProgress, setUploadProgress] = useState<{ [key: string]: number }>({});
  
  // Edit States for the Modal
  const [editStatus, setEditStatus] = useState<OrderStatus>(OrderStatus.PENDING);
  const [editEta, setEditEta] = useState('');
  
  // Deliverable States
  const [draftImage, setDraftImage] = useState<string | null>(null);
  const [finalFiles, setFinalFiles] = useState<{ name: string; type: string; data: string }[]>([]);

  const orderIdFromUrl = searchParams.get('order');

  useEffect(() => {
    if (orderIdFromUrl && orders.length > 0) {
      const o = orders.find(x => x.id === orderIdFromUrl);
      if (o && (!selectedOrder || selectedOrder.id !== o.id)) {
        openOrder(o, false);
      }
    } else if (!orderIdFromUrl && selectedOrder) {
      closeOrder(false);
    }
  }, [orderIdFromUrl, orders]);

  useEffect(() => {
    setIsLoading(true);
    const unsubscribeOrders = listenToOrders((data) => {
      setOrders(data);
      setIsLoading(false);
    });
    
    const unsubscribeContacts = listenToContacts((data) => {
      setContacts(data);
    });

    return () => {
      unsubscribeOrders();
      unsubscribeContacts();
    };
  }, []);

  const handleLogout = () => {
    sessionStorage.removeItem('admin_auth');
    navigate('/');
  };

  const toggleSort = () => {
    setSortOrder(prev => prev === 'desc' ? 'asc' : 'desc');
  };

  const openOrder = (order: Order, updateUrl = true) => {
    if (!order) return;
    setSelectedOrder(order);
    setEditStatus(order.status);
    setEditEta(order.estimatedCompletion);
    setDraftImage(order.draftImg || null);
    setFinalFiles(order.finalFiles || []);
    setUploadProgress({});
    if (updateUrl) {
      setSearchParams(prev => { prev.set('order', order.id); return prev; }, { replace: false });
    }
  };

  const handleAddTestimonial = async () => {
    if (!selectedOrder) return;
    try {
       await addTestimonial({
           clientName: selectedOrder.clientName,
           projectRole: selectedOrder.serviceType,
           feedback: selectedOrder.feedback || '',
           order: 0
       });
       alert("Testimonial added to public website!");
    } catch (e) {
       console.error(e);
       alert("Failed to add testimonial.");
    }
  };

  const closeOrder = (updateUrl = true) => {
    setSelectedOrder(null);
    setDraftImage(null);
    setFinalFiles([]);
    setUploadProgress({});
    if (updateUrl) {
      setSearchParams(prev => { prev.delete('order'); return prev; }, { replace: false });
    }
  };

  const handleDraftUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && selectedOrder) {
      const MAX_SIZE_MB = 1000;
      const BLOCKED_TYPES = ["application/x-msdownload", "application/x-sh", "application/x-bat", "application/x-executable"];
      
      if (file.size > MAX_SIZE_MB * 1024 * 1024) {
        alert(`File ${file.name} exceeds ${MAX_SIZE_MB}MB limit.`);
        return;
      }
      if (BLOCKED_TYPES.includes(file.type) || file.name.match(/\.(exe|bat|sh|cmd)$/i)) {
        alert(`File ${file.name} has an unsupported file type.`);
        return;
      }

      const path = `${selectedOrder.clientId}/uploads/${selectedOrder.id}/drafts/${Date.now()}_${file.name}`;
      try {
          const url = await uploadFileWithProgress(file, path, (p) => {
            setUploadProgress(prev => ({ ...prev, draft: p }));
          });
          setDraftImage(url);
          // Auto update status suggestion
          if (editStatus !== OrderStatus.DRAFT_SENT) {
             setEditStatus(OrderStatus.DRAFT_SENT);
          }
      } catch (err) {
          console.error("Draft upload failed", err);
          alert("Failed to upload draft.");
      } finally {
          setUploadProgress(prev => {
            const n = { ...prev };
            delete n.draft;
            return n;
          });
      }
    }
  };

  const removeDraft = async () => {
      if (draftImage) {
          await deleteFileFromUrl(draftImage);
      }
      setDraftImage(null);
  };

  const handleFinalFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0 || !selectedOrder) return;
    
    const fileList = Array.from(files) as File[];
    
    // Client-side validation
    const validFiles: File[] = [];
    const MAX_SIZE_MB = 1000; // 1GB limit per file
    const BLOCKED_TYPES = ["application/x-msdownload", "application/x-sh", "application/x-bat", "application/x-executable"];
    
    for (const f of fileList) {
      if (f.size > MAX_SIZE_MB * 1024 * 1024) {
        alert(`File ${f.name} exceeds ${MAX_SIZE_MB}MB limit.`);
        continue;
      }
      if (BLOCKED_TYPES.includes(f.type) || f.name.match(/\.(exe|bat|sh|cmd)$/i)) {
        alert(`File ${f.name} has an unsupported file type.`);
        continue;
      }
      validFiles.push(f);
    }
    
    if (validFiles.length === 0) return;
    
    // Process queue sequentially to prevent WebSocket/UI freeze
    try {
      const newFiles = [];
      for (const f of validFiles) {
        setUploadProgress(prev => ({ ...prev, [f.name]: 0 }));
        try {
          const path = `${selectedOrder.clientId}/uploads/${selectedOrder.id}/final_assets/${Date.now()}_${f.name}`;
          const url = await uploadFileWithProgress(f, path, (p) => {
            setUploadProgress(prev => ({ ...prev, [f.name]: p }));
          });
          newFiles.push({ name: f.name, type: f.type || "application/octet-stream", data: url });
          // Update partial state so UI shows progress before full batch is done
          setFinalFiles(prev => [...prev, { name: f.name, type: f.type || "application/octet-stream", data: url }]);
        } catch (fileErr) {
          console.error(`Failed to upload ${f.name}`, fileErr);
          alert(`Failed to upload ${f.name}`);
        } finally {
          setUploadProgress(prev => {
            const n = { ...prev };
            delete n[f.name];
            return n;
          });
        }
      }
    } catch (err) {
      alert("Error processing uploads.");
    }
    
    // Clear input
    e.target.value = "";
  };

  const removeFinalFile = async (index: number) => {
      const file = finalFiles[index];
      if (file && file.data) {
          await deleteFileFromUrl(file.data);
      }
      setFinalFiles(prev => prev.filter((_, idx) => idx !== index));
  };

  const saveChanges = async () => {
    if (!selectedOrder) return;
    const hasStatusChanged = editStatus !== selectedOrder.status;
    const updatedOrder = {
      ...selectedOrder,
      status: editStatus,
      estimatedCompletion: editEta || "",
      draftImg: draftImage || null,
      finalFiles: finalFiles || [],
    };
    await updateOrder(updatedOrder);
    if (hasStatusChanged) {
       await sendStatusUpdateEmail(updatedOrder, editStatus);
       if (editStatus === OrderStatus.WAITING_PAYMENT) {
          import('../services/telegramService').then(({ sendPaymentAwaitedNotification }) => {
              sendPaymentAwaitedNotification(updatedOrder).catch(console.error);
          }).catch(console.error);
       }
       if(window.confirm("Status changed. Open WhatsApp to notify client?")) {
           sendWhatsAppNotification(updatedOrder, editStatus);
       }
    }
    closeOrder();
  };

  const markPaymentComplete = async () => {
      setEditStatus(OrderStatus.COMPLETED);
      alert("Payment Marked as Completed. Please remember to 'Save Changes' to notify the client.");
  };

  const copyPalette = (palette: string[]) => {
    navigator.clipboard.writeText(palette.join(', '));
    alert('Copied!');
  };

  const exportPalette = (palette: string[]) => {
      const content = `Palette: ${palette.join(', ')}`;
      const blob = new Blob([content], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `palette.txt`;
      a.click();
      URL.revokeObjectURL(url);
  };

  const sendWhatsAppNotification = (order: Order, status: OrderStatus) => {
      const appUrl = window.location.origin;
      const trackingLink = `${appUrl}/#/tracking?id=${order.id}`;
      const messageText = `Hi ${order.clientName},\n\nYour order (${order.id}) status has been updated to: *${status}*.\n\nYou can view the details and download assets here:\n${trackingLink}`;
      const url = `https://api.whatsapp.com/send?phone=${order.mobile.replace(/[^0-9]/g, '')}&text=${encodeURIComponent(messageText)}`;
      window.open(url, '_blank');
  };

  const handleQuickStatusChange = async (e: React.ChangeEvent<HTMLSelectElement>, order: Order) => {
      e.stopPropagation();
      const newStatus = e.target.value as OrderStatus;

      // Optimistic update
      setOrders(prev => prev.map(o => o.id === order.id ? { ...o, status: newStatus } : o));

      try {
          const updatedOrder = { ...order, status: newStatus };
          await updateOrder(updatedOrder);

          if (newStatus !== order.status) {
             sendStatusUpdateEmail(updatedOrder, newStatus).catch(console.error);
          }
          if (newStatus !== order.status && newStatus === OrderStatus.WAITING_PAYMENT) {
             import('../services/telegramService').then(({ sendPaymentAwaitedNotification }) => {
                 sendPaymentAwaitedNotification(updatedOrder).catch(console.error);
             }).catch(console.error);
          }
      } catch (error) {
          console.error("Failed to quick update status", error);
      }
  };

  const exportToCsv = () => {
    let csvStr = "ID,Client,Email,Service,Status,Price,Date\n";
    filteredOrders.forEach(o => {
      csvStr += `${o.id},"${o.clientName}","${o.email || ''}","${o.serviceType}",${o.status},${o.price || 0},${o.createdAt}\n`;
    });
    const blob = new Blob([csvStr], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `orders_${new Date().getTime()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const filteredOrders = orders.filter(o => {
      if (!o) return false;
      const matchesSearch = (o.clientName?.toLowerCase() || '').includes(searchTerm.toLowerCase()) || (o.id?.toLowerCase() || '').includes(searchTerm.toLowerCase());
      const matchesStatus = filterStatus === 'All' || o.status === filterStatus;
      
      let matchesDateRange = true;
      if (startDate || endDate) {
          if (o.createdAt) {
              const orderDate = new Date(o.createdAt).getTime();
              
              if (startDate && endDate) {
                  const s = new Date(startDate);
                  s.setHours(0, 0, 0, 0);
                  const e = new Date(endDate);
                  e.setHours(23, 59, 59, 999);
                  matchesDateRange = orderDate >= s.getTime() && orderDate <= e.getTime();
              } else if (startDate) {
                  const s = new Date(startDate);
                  s.setHours(0, 0, 0, 0);
                  matchesDateRange = orderDate >= s.getTime();
              } else if (endDate) {
                  const e = new Date(endDate);
                  e.setHours(23, 59, 59, 999);
                  matchesDateRange = orderDate <= e.getTime();
              }
          } else {
             matchesDateRange = false;
          }
      }

      return matchesSearch && matchesStatus && matchesDateRange;
  }).sort((a, b) => {
      const dateA = new Date(a.createdAt).getTime();
      const dateB = new Date(b.createdAt).getTime();
      return sortOrder === 'asc' ? dateA - dateB : dateB - dateA;
  });

  const alertsCount = orders.filter(o => o.status === OrderStatus.PENDING || o.status === OrderStatus.REVISION).length;

  const getMonthlyData = () => {
    const mapWithSortKey: Record<string, { count: number, display: string }> = {};
    filteredOrders.forEach(o => {
      if (o.createdAt) {
        const date = new Date(o.createdAt);
        const sortKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
        const display = date.toLocaleString('default', { month: 'short', year: 'numeric' });
        if (!mapWithSortKey[sortKey]) {
          mapWithSortKey[sortKey] = { count: 0, display };
        }
        mapWithSortKey[sortKey].count += 1;
      }
    });
    return Object.keys(mapWithSortKey).sort().map(key => ({
      name: mapWithSortKey[key].display,
      orders: mapWithSortKey[key].count
    }));
  };

  const getStatusData = () => {
    const dataMap: Record<string, number> = {};
    filteredOrders.forEach(o => {
      const status = o.status || 'Unknown';
      dataMap[status] = (dataMap[status] || 0) + 1;
    });
    return Object.keys(dataMap).map(key => ({
      name: key,
      value: dataMap[key]
    }));
  };

  const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4', '#eab308'];

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-800 text-gray-900 dark:text-slate-100 pb-12">
      <Helmet>
        <title>Admin Dashboard | Ranthula | Buisness portfolio</title>
        <meta name="robots" content="noindex, nofollow" />
      </Helmet>
      {/* Navigation */}
      <div className="bg-white dark:bg-slate-900 border-b border-gray-200 dark:border-slate-700 sticky top-0 z-30 px-4 md:px-8 py-4 flex justify-between items-center shadow-sm">
         <div className="flex items-center gap-3">
             <span className="font-bold text-lg tracking-tight pl-2">Admin Dashboard</span>
             <span className="bg-green-100 text-green-800 text-[10px] font-bold px-2 py-0.5 rounded border border-green-200">CLOUD MODE</span>
             {alertsCount > 0 && (
                <div className="flex items-center gap-1.5 bg-red-100 text-red-700 px-3 py-1 rounded-full border border-red-200 text-xs font-bold animate-pulse shadow-sm cursor-pointer hover:bg-red-200 transition-colors" title="New orders or revisions need your attention" onClick={() => setFilterStatus(OrderStatus.PENDING)}>
                  <Bell size={12} className="animate-bounce" /> {alertsCount}
                </div>
             )}
         </div>
         <div className="flex items-center gap-4">
             <button onClick={handleLogout} className="text-xs font-bold text-gray-500 dark:text-slate-400 hover:text-red-600 flex items-center gap-2 bg-gray-100 dark:bg-slate-800 hover:bg-red-50 px-3 py-2 rounded-lg transition-colors cursor-pointer">
                <LogOut size={14} /> Log Out
             </button>
         </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 md:px-8 pt-8">
        <div className="flex flex-col xl:flex-row justify-between xl:items-end mb-4 gap-4">
            <div>
              <h2 className="text-3xl font-bold text-gray-900 dark:text-slate-100 mb-1">Projects</h2>
              <p className="text-gray-500 dark:text-slate-400 text-sm">Manage client requests (Real-time Cloud Sync).</p>
            </div>
            
            <div className="flex flex-col sm:flex-row gap-3 w-full xl:w-auto items-center">
              <div className="flex items-center gap-2 bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-lg px-3 py-2.5 shadow-sm text-sm w-full sm:w-auto overflow-x-auto">
                 <span className="text-gray-500 dark:text-slate-400 font-medium whitespace-nowrap">From:</span>
                 <input 
                   type="date" 
                   value={startDate}
                   onChange={e => setStartDate(e.target.value)}
                   className="outline-none bg-transparent text-gray-700 dark:text-slate-300 min-w-max"
                 />
                 <span className="text-gray-300">|</span>
                 <span className="text-gray-500 dark:text-slate-400 font-medium whitespace-nowrap">To:</span>
                 <input 
                   type="date" 
                   value={endDate}
                   onChange={e => setEndDate(e.target.value)}
                   className="outline-none bg-transparent text-gray-700 dark:text-slate-300 min-w-max"
                 />
                 {(startDate || endDate) && (
                   <button onClick={() => { setStartDate(''); setEndDate(''); }} className="ml-1 text-gray-400 hover:text-red-500 bg-gray-50 dark:bg-slate-800 hover:bg-red-50 p-1 rounded transition-colors whitespace-nowrap">
                     <X size={14} />
                   </button>
                 )}
              </div>

              {activeTab === 'orders' && (
                  <>
                    <div className="relative flex-1 w-full sm:w-64">
                       <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                       <input 
                         value={searchTerm} 
                         onChange={e => setSearchTerm(e.target.value)}
                         placeholder="Search tracking ID, client..." 
                         className="w-full bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-lg pl-10 pr-4 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all flex-1"
                       />
                    </div>
                    <select
                      value={filterStatus}
                      onChange={e => setFilterStatus(e.target.value)}
                      className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-700 text-gray-700 dark:text-slate-300 py-2.5 px-4 rounded-lg text-sm outline-none focus:border-blue-500"
                    >
                       <option value="All">All Statuses</option>
                       {Object.values(OrderStatus).map(status => (
                         <option key={status} value={status}>{status}</option>
                       ))}
                    </select>
                    <div className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-700 text-gray-400 p-2.5 rounded-lg transition-all shrink-0" title="Sync Status">
                      <RefreshCw size={16} className={isLoading ? 'animate-spin' : ''} />
                    </div>
                  </>
              )}
            </div>
        </div>

        <div className="flex gap-4 border-b border-gray-200 dark:border-slate-700 mb-6 px-4 overflow-x-auto whitespace-nowrap">
          <button 
            className={`pb-3 px-2 font-semibold text-sm border-b-2 transition-colors flex items-center gap-2 relative ${activeTab === 'orders' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 dark:text-slate-400 hover:text-gray-700 dark:text-slate-300'}`}
            onClick={() => handleTabChange('orders')}
          >
            <List size={16} /> Orders
            {orders.filter(o => o.status === OrderStatus.PENDING).length > 0 && (
              <span className="min-w-4 h-4 px-1.5 bg-red-500 text-white text-[10px] font-bold rounded-full absolute -top-1 -right-2 flex items-center justify-center">
                {orders.filter(o => o.status === OrderStatus.PENDING).length}
              </span>
            )}
          </button>
          <button 
            className={`pb-3 px-2 font-semibold text-sm border-b-2 transition-colors flex items-center gap-2 ${activeTab === 'charts' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 dark:text-slate-400 hover:text-gray-700 dark:text-slate-300'}`}
            onClick={() => handleTabChange('charts')}
          >
            <BarChart2 size={16} /> Analytics
          </button>
          <button 
            className={`pb-3 px-2 font-semibold text-sm border-b-2 transition-colors flex items-center gap-2 ${activeTab === 'portfolio' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 dark:text-slate-400 hover:text-gray-700 dark:text-slate-300'}`}
            onClick={() => handleTabChange('portfolio')}
          >
            <ImageIcon size={16} /> Portfolio
          </button>
          <button 
            className={`pb-3 px-2 font-semibold text-sm border-b-2 transition-colors flex items-center gap-2 ${activeTab === 'skills' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 dark:text-slate-400 hover:text-gray-700 dark:text-slate-300'}`}
            onClick={() => handleTabChange('skills')}
          >
            <Award size={16} /> Skills
          </button>
          <button 
            className={`pb-3 px-2 font-semibold text-sm border-b-2 transition-colors flex items-center gap-2 ${activeTab === 'experience' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 dark:text-slate-400 hover:text-gray-700 dark:text-slate-300'}`}
            onClick={() => handleTabChange('experience')}
          >
            <Briefcase size={16} /> Experience
          </button>
          <button 
             className={`pb-3 px-2 font-semibold text-sm border-b-2 transition-colors flex items-center gap-2 ${activeTab === 'education' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 dark:text-slate-400 hover:text-gray-700 dark:text-slate-300'}`}
             onClick={() => handleTabChange('education')}
           >
             <GraduationCap size={16} /> Education
           </button>
          <button 
            className={`pb-3 px-2 font-semibold text-sm border-b-2 transition-colors flex items-center gap-2 relative ${activeTab === 'contacts' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 dark:text-slate-400 hover:text-gray-700 dark:text-slate-300'}`}
            onClick={() => handleTabChange('contacts')}
          >
            <Mail size={16} /> Contacts
            {contacts.filter(c => !c.isRead).length > 0 && (
              <span className="min-w-4 h-4 px-1.5 bg-red-500 text-white text-[10px] font-bold rounded-full absolute -top-1 -right-2 flex items-center justify-center">
                {contacts.filter(c => !c.isRead).length}
              </span>
            )}
          </button>
          <button 
            className={`pb-3 px-2 font-semibold text-sm border-b-2 transition-colors flex items-center gap-2 relative ${activeTab === 'reviews' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 dark:text-slate-400 hover:text-gray-700 dark:text-slate-300'}`}
            onClick={() => handleTabChange('reviews')}
          >
            <Star size={16} /> Reviews & Testimonials
            {orders.filter(o => o.rating && !o.isFeedbackRead).length > 0 && (
              <span className="min-w-4 h-4 px-1.5 bg-red-500 text-white text-[10px] font-bold rounded-full absolute -top-1 -right-2 flex items-center justify-center">
                {orders.filter(o => o.rating && !o.isFeedbackRead).length}
              </span>
            )}
          </button>
          <button 
            className={`pb-3 px-2 font-semibold text-sm border-b-2 transition-colors flex items-center gap-2 ${activeTab === 'settings' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 dark:text-slate-400 hover:text-gray-700 dark:text-slate-300'}`}
            onClick={() => handleTabChange('settings')}
          >
            <Settings size={16} /> Settings & Prices
          </button>
          <button 
            className={`pb-3 px-2 font-semibold text-sm border-b-2 transition-colors flex items-center gap-2 ${activeTab === 'invoice' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 dark:text-slate-400 hover:text-gray-700 dark:text-slate-300'}`}
            onClick={() => handleTabChange('invoice')}
          >
            <Receipt size={16} /> Invoice Template
          </button>
          <button 
            className={`pb-3 px-2 font-semibold text-sm border-b-2 transition-colors flex items-center gap-2 ${activeTab === 'email' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 dark:text-slate-400 hover:text-gray-700 dark:text-slate-300'}`}
            onClick={() => handleTabChange('email')}
          >
            <Mail size={16} /> Email Template
          </button>
          <button 
            className={`pb-3 px-2 font-semibold text-sm border-b-2 transition-colors flex items-center gap-2 ${activeTab === 'shares' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 dark:text-slate-400 hover:text-gray-700 dark:text-slate-300'}`}
            onClick={() => handleTabChange('shares' as any)}
          >
            <FileBox size={16} /> Shared Files
          </button>
        </div>

        {activeTab === 'orders' ? (
          <div className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-xl shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                    <thead>
                        <tr className="bg-gray-50/50 border-b border-gray-200 dark:border-slate-700 text-xs font-semibold text-gray-500 dark:text-slate-400 uppercase tracking-wider">
                            <th className="p-4 pl-6">ID / Client</th>
                            <th className="p-4">Service</th>
                            <th className="p-4">Status</th>
                            <th className="p-4 cursor-pointer hover:bg-gray-100 dark:hover:bg-slate-700 dark:bg-slate-800 transition-colors select-none group" onClick={toggleSort}>
                                <div className="flex items-center gap-1 text-gray-700 dark:text-slate-300">
                                    Date
                                    {sortOrder === 'asc' ? <ChevronUp size={14} className="text-gray-500 dark:text-slate-400" /> : <ChevronDown size={14} className="text-gray-500 dark:text-slate-400" />}
                                </div>
                            </th>
                            <th className="p-4 text-right pr-6">Action</th>
                        </tr>
                    </thead>
                    <tbody className="text-sm divide-y divide-gray-100">
                        {filteredOrders.length > 0 ? filteredOrders.map(o => (
                            <tr key={o?.id || Math.random()} className={`hover:bg-gray-50 dark:hover:bg-slate-800 dark:bg-slate-800 transition-colors group cursor-pointer relative ${o?.status === OrderStatus.CANCELLED ? 'opacity-60 bg-red-50/10' : ''}`} onClick={() => openOrder(o)}>
                                <td className="p-4 pl-6">
                                    <div className="flex items-center gap-4">
                                        {o?.status === OrderStatus.PENDING && !o.isDeletedByAdmin && (
                                            <div className="relative flex h-3 w-3 shrink-0">
                                              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                                              <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.5)]"></span>
                                            </div>
                                        )}
                                        <div className="flex flex-col relative">
                                          {o?.status === OrderStatus.REVISION && <span className="absolute -left-4 top-1.5 w-2 h-2 rounded-full bg-orange-500 animate-pulse"></span>}
                                          <span className={`font-medium ${o?.status === OrderStatus.CANCELLED ? 'text-gray-400 line-through' : 'text-gray-900 dark:text-slate-100'}`}>{o?.clientName}</span>
                                          <span className="text-xs font-mono text-gray-400 uppercase tracking-tighter">{o?.id}</span>
                                        </div>
                                    </div>
                                </td>
                                <td className="p-4 text-gray-600 dark:text-slate-400">
                                    {o?.serviceType}
                                    {o.isDeletedByAdmin && <span className="ml-2 text-[9px] bg-red-100 text-red-600 px-1 rounded uppercase font-bold">Files Deleted</span>}
                                </td>
                                <td className="p-4" onClick={(e) => e.stopPropagation()}>
                                    <div className="relative inline-flex">
                                        <select
                                            value={o?.status}
                                            onChange={(e) => handleQuickStatusChange(e, o)}
                                            className={`appearance-none outline-none cursor-pointer pr-8 pl-3 py-1 rounded-full text-xs font-medium border transition-colors ${
                                                o?.status === OrderStatus.COMPLETED ? 'bg-green-50 text-green-700 border-green-200 hover:bg-green-100' :
                                                o?.status === OrderStatus.REVISION ? 'bg-orange-100 text-orange-800 border-orange-200' :
                                                o?.status === OrderStatus.IN_PROGRESS ? 'bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100' :
                                                o?.status === OrderStatus.CANCELLED ? 'bg-red-50 text-red-600 border-red-200 hover:bg-red-100' :
                                                o?.status === OrderStatus.WAITING_PAYMENT ? 'bg-orange-50 text-orange-700 border-orange-200 hover:bg-orange-100' :
                                                o?.status === OrderStatus.PENDING ? 'bg-red-50 text-red-700 border-red-200 ring-1 ring-red-500/20 hover:bg-red-100' :
                                                'bg-gray-100 dark:bg-slate-800 text-gray-700 dark:text-slate-300 border-gray-200 dark:border-slate-700 hover:bg-gray-200'
                                            }`}
                                        >
                                            {Object.values(OrderStatus).map(status => (
                                                <option key={status} value={status}>{status}</option>
                                            ))}
                                        </select>
                                        <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-current opacity-70">
                                            <ChevronDown size={12} />
                                        </div>
                                    </div>
                                </td>
                                <td className="p-4 text-gray-500 dark:text-slate-400 text-xs">{o?.createdAt ? new Date(o.createdAt).toLocaleDateString() : 'N/A'}</td>
                                <td className="p-4 text-right pr-6">
                                    <div className="flex items-center justify-end gap-2">
                                        <button onClick={() => openOrder(o)} className="text-gray-400 hover:text-blue-600 transition-colors p-2 hover:bg-blue-50 rounded-full">
                                            <ChevronRight size={18} />
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        )) : (
                            <tr>
                                <td colSpan={5} className="p-12 text-center text-gray-400 text-sm">
                                    {isLoading ? 'Syncing...' : 'No projects found.'}
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
              </div>
          </div>
        ) : activeTab === 'charts' ? (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
               <div className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-xl shadow-sm p-6 flex flex-col justify-center items-center text-center">
                  <DollarSign size={32} className="text-green-500 mb-2" />
                  <h3 className="text-sm font-bold text-gray-500 dark:text-slate-400 uppercase tracking-widest mb-1">Total Earned</h3>
                  <div className="text-3xl font-bold text-gray-900 dark:text-slate-100 mb-4">LKR {filteredOrders.filter(o => o.status === OrderStatus.COMPLETED).reduce((acc, curr) => acc + (curr.price || 0), 0).toLocaleString()}</div>
                  <p className="text-xs text-gray-400">from {filteredOrders.filter(o => o.status === OrderStatus.COMPLETED).length} completed projects.</p>
               </div>
               <div className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-xl shadow-sm p-6 flex flex-col justify-center items-center text-center md:col-span-2">
                  <h3 className="text-sm font-bold text-gray-800 dark:text-slate-200 mb-2">Export Project Data</h3>
                  <p className="text-xs text-gray-500 dark:text-slate-400 mb-6 max-w-sm">Download current filtered records (.CSV format) to import into Google Sheets or Excel.</p>
                  <button onClick={exportToCsv} className="bg-blue-600 text-white font-bold px-6 py-2 rounded-lg text-sm hover:bg-blue-700 transition flex items-center gap-2">
                     <Download size={16} /> Download CSV
                  </button>
               </div>
            </div>

            <ClientActivityChart orders={filteredOrders} />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-xl shadow-sm p-6">
                <h3 className="text-lg font-bold text-gray-900 dark:text-slate-100 mb-6">Orders by Month</h3>
                <div className="h-[300px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={getMonthlyData()}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                      <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#6B7280', fontSize: 12}} dy={10} />
                      <YAxis axisLine={false} tickLine={false} tick={{fill: '#6B7280', fontSize: 12}} />
                      <RechartsTooltip cursor={{fill: '#F3F4F6'}} contentStyle={{borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'}} />
                      <Bar dataKey="orders" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-xl shadow-sm p-6">
                <h3 className="text-lg font-bold text-gray-900 dark:text-slate-100 mb-6">Orders by Status</h3>
                <div className="h-[300px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={getStatusData()}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={100}
                        paddingAngle={2}
                        dataKey="value"
                      >
                        {getStatusData().map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <RechartsTooltip contentStyle={{borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'}} />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          </div>
        ) : activeTab === 'reviews' ? (
          <div className="space-y-12">
            <div className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-xl shadow-sm p-6 space-y-6">
              <h3 className="text-xl font-bold">Client Reviews from Orders</h3>
              {orders.filter(o => o.rating).length === 0 ? (
                <div className="p-8 text-center text-gray-500 dark:text-slate-400 bg-gray-50 dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700 border-dashed">No reviews yet.</div>
              ) : (
                 <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                   {orders.filter(o => o.rating).sort((a,b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).map(o => (
                      <div key={o.id} className={`border ${!o.isFeedbackRead ? 'border-red-300 bg-red-50/20' : 'border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-900'} shadow-sm p-6 rounded-2xl relative overflow-hidden transition-all hover:shadow-md`}>
                          {!o.isFeedbackRead && (
                             <div className="absolute top-4 right-4 z-10">
                               <span className="bg-red-500 text-white text-[10px] font-bold uppercase tracking-widest px-2.5 py-1 rounded-full shadow-sm flex items-center gap-1.5">
                                  <span className="w-1.5 h-1.5 bg-white dark:bg-slate-900 rounded-full animate-pulse"></span>
                                  NEW
                               </span>
                             </div>
                          )}
                          <div className="flex justify-between items-start mb-4 relative z-0 pr-16">
                             <div>
                                 <h4 className="font-bold text-gray-900 dark:text-slate-100 border-b border-gray-200 dark:border-slate-700 pb-1">{o.clientName}</h4>
                                 <span className="text-xs text-purple-600 font-bold uppercase tracking-wider">{o.serviceType}</span>
                             </div>
                             <div className="flex gap-0.5 text-lg">
                                 {[1,2,3,4,5].map(s => <span key={s} className={s <= (o.rating||0) ? 'text-yellow-400' : 'text-gray-200'}>★</span>)}
                             </div>
                          </div>
                          {o.feedback && <p className="italic text-gray-700 dark:text-slate-300 text-sm mb-6 pb-4 border-b border-gray-100 dark:border-slate-700">"{o.feedback}"</p>}
                          
                          <div className="flex gap-3">
                              {!o.isFeedbackRead && (
                                  <button onClick={() => updateOrder({...o, isFeedbackRead: true})} className="flex-1 bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-700 hover:border-gray-300 dark:border-slate-600 text-gray-700 dark:text-slate-300 text-xs uppercase tracking-widest font-black py-2.5 rounded-xl transition-all">Mark Read</button>
                              )}
                              <button onClick={async () => { 
                                 try {
                                     const ref = await addTestimonial({
                                         clientName: o.clientName,
                                         projectRole: o.serviceType,
                                         feedback: o.feedback || '',
                                         order: 0,
                                         rating: o.rating
                                     });
                                     await updateOrder({...o, isFeedbackRead: true, testimonialId: ref.id}); 
                                     alert("Testimonial added to public website!");
                                 } catch (e) {
                                     console.error(e);
                                     alert("Failed to add testimonial.");
                                 }
                              }} className="flex-1 bg-yellow-50 text-yellow-700 hover:bg-yellow-100 border border-yellow-200 text-xs uppercase tracking-widest font-black py-2.5 rounded-xl transition-all shadow-sm">Publish</button>
                              <button onClick={() => { updateOrder({...o, isFeedbackRead: true}); openOrder({...o, isFeedbackRead: true}); }} className="flex-1 bg-purple-600 text-white hover:bg-purple-700 text-xs uppercase tracking-widest font-black py-2.5 rounded-xl transition-all shadow-sm">View Details</button>
                          </div>
                      </div>
                   ))}
                 </div>
              )}
            </div>
            
            <div className="pt-4 border-t border-gray-200 dark:border-slate-700">
               <h3 className="text-xl font-bold mb-4">Manual Testimonials</h3>
               <AdminTestimonials />
            </div>
          </div>
        ) : activeTab === 'portfolio' ? (
          <AdminPortfolio />
        ) : activeTab === 'skills' ? (
          <AdminSkills />
        ) : activeTab === 'experience' ? (
          <AdminExperience />
        ) : activeTab === 'education' ? (
          <AdminEducation />
        ) : activeTab === 'contacts' ? (
          <AdminContacts />
        ) : activeTab === 'settings' ? (
          <AdminSettings user={user} />
        ) : activeTab === 'invoice' ? (
          <AdminInvoice />
        ) : activeTab === 'email' ? (
          <AdminEmail />
        ) : activeTab === 'shares' as any ? (
          <AdminShares />
        ) : null}
      </div>

      {selectedOrder && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
              <div className="absolute inset-0 bg-black/40 backdrop-blur-sm transition-opacity" onClick={() => closeOrder(true)}></div>
              <div className="relative bg-white dark:bg-slate-900 rounded-2xl w-full max-w-5xl h-[90vh] shadow-2xl flex flex-col animate-fade-in border border-gray-200 dark:border-slate-700 overflow-hidden">
                  <div className="px-8 py-6 border-b border-gray-100 dark:border-slate-700 flex justify-between items-start bg-white dark:bg-slate-900 z-10 shrink-0">
                      <div className="flex items-start gap-4">
                          <button onClick={() => closeOrder(true)} className="p-1.5 mt-1 text-gray-400 hover:text-gray-900 dark:text-slate-100 bg-gray-50 dark:bg-slate-800 hover:bg-gray-100 dark:hover:bg-slate-700 dark:bg-slate-800 rounded-full transition-colors hidden sm:block">
                              <ArrowLeft size={20} />
                          </button>
                          <div>
                              <div className="flex items-center gap-3">
                                 <h2 className="text-2xl font-bold text-gray-900 dark:text-slate-100">{selectedOrder?.serviceType}</h2>
                                 {selectedOrder?.status === OrderStatus.COMPLETED && (
                                    <div className="bg-green-100 text-green-800 text-[10px] uppercase font-bold px-2 py-1 rounded border border-green-200 flex items-center gap-1">
                                        <Check size={12} /> Approved by Client
                                    </div>
                                 )}
                              </div>
                              <div className="flex items-center gap-3 mt-1 text-sm text-gray-500 dark:text-slate-400">
                                 <span className="font-mono bg-gray-100 dark:bg-slate-800 px-2 py-0.5 rounded text-gray-700 dark:text-slate-300 uppercase">{selectedOrder?.id}</span>
                                 <span>•</span>
                                 <span className="flex items-center gap-1"><UserIcon size={14} /> {selectedOrder?.clientName}</span>
                              </div>
                          </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <button onClick={() => closeOrder(true)} className="flex items-center gap-2 text-gray-600 dark:text-slate-400 font-medium hover:text-gray-900 dark:text-slate-100 bg-gray-50 dark:bg-slate-800 hover:bg-gray-100 dark:hover:bg-slate-700 dark:bg-slate-800 px-3 py-1.5 rounded-full transition-colors sm:hidden">
                            <ArrowLeft size={16} /> Back
                        </button>
                        <button onClick={() => closeOrder(true)} className="text-gray-400 hover:text-gray-900 dark:text-slate-100 bg-gray-50 dark:bg-slate-800 hover:bg-gray-100 dark:hover:bg-slate-700 dark:bg-slate-800 p-2 rounded-full transition-colors hidden sm:block">
                            <X size={20} />
                        </button>
                      </div>
                  </div>

                  <div className="flex-1 overflow-y-auto p-8 grid grid-cols-1 md:grid-cols-3 gap-8 bg-gray-50/50">
                      
                      {/* COLUMN 1: CONTROLS */}
                      <div className="md:col-span-1 space-y-6">
                          <div className="bg-white dark:bg-slate-900 p-5 rounded-xl border border-gray-200 dark:border-slate-700 shadow-sm">
                              <h3 className="text-xs font-bold uppercase text-gray-400 tracking-wider mb-4">Project Controls</h3>
                              <div className="mb-4">
                                <label className="text-xs font-semibold text-gray-700 dark:text-slate-300 mb-1.5 block">Status</label>
                                <select 
                                  value={editStatus} 
                                  onChange={e => setEditStatus(e.target.value as OrderStatus)}
                                  className="w-full bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-lg px-3 py-2 text-sm text-gray-900 dark:text-slate-100 outline-none focus:border-blue-500 focus:bg-white dark:bg-slate-900"
                                >
                                    {Object.values(OrderStatus).map(s => <option key={s} value={s}>{s}</option>)}
                                </select>
                              </div>
                              <div className="mb-6">
                                <label className="text-xs font-semibold text-gray-700 dark:text-slate-300 mb-1.5 block">Estimated Completion</label>
                                <input 
                                  value={editEta}
                                  onChange={e => setEditEta(e.target.value)}
                                  className="w-full bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-lg px-3 py-2 text-sm text-gray-900 dark:text-slate-100 outline-none focus:border-blue-500 focus:bg-white dark:bg-slate-900"
                                />
                              </div>
                              {selectedOrder?.status === OrderStatus.WAITING_PAYMENT && (
                                <button onClick={markPaymentComplete} className="w-full mt-2 bg-green-600 text-white py-3 rounded-lg font-bold text-xs uppercase tracking-wider hover:bg-green-700 transition-all flex items-center justify-center gap-2 shadow-lg hover:shadow-green-600/30">
                                   <DollarSign size={16} /> Confirm Payment
                                </button>
                              )}
                          </div>

                          <div className="bg-white dark:bg-slate-900 p-5 rounded-xl border border-gray-200 dark:border-slate-700 shadow-sm">
                             <h3 className="text-xs font-bold uppercase text-gray-400 tracking-wider mb-4">Deliverables</h3>
                             <label className="block w-full cursor-pointer group">
                                <div className="w-full h-32 border-2 border-dashed border-gray-200 dark:border-slate-700 rounded-lg flex flex-col items-center justify-center gap-2 hover:bg-gray-50 dark:hover:bg-slate-800 dark:bg-slate-800 hover:border-blue-300 transition-colors relative overflow-hidden">
                                   {uploadProgress.draft !== undefined ? (
                                      <div className="flex flex-col items-center gap-2 w-full px-4">
                                          <div className="w-full bg-gray-100 dark:bg-slate-800 rounded-full h-1.5 overflow-hidden">
                                              <div className="bg-blue-600 h-full transition-all duration-300" style={{ width: `${uploadProgress.draft}%` }}></div>
                                          </div>
                                          <span className="text-[10px] font-bold text-blue-600">{Math.round(uploadProgress.draft)}%</span>
                                      </div>
                                   ) : draftImage ? (
                                     <div className="relative w-full h-full">
                                         <img src={draftImage} className="w-full h-full object-cover opacity-50" alt="Draft" />
                                         <button onClick={(e) => { e.preventDefault(); removeDraft(); }} className="absolute top-2 right-2 bg-red-500 text-white p-1 rounded-full z-20 hover:bg-red-600"><X size={12} /></button>
                                     </div>
                                   ) : (
                                     <Upload className="text-gray-300 group-hover:text-blue-500" />
                                   )}
                                   <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                                      <span className="text-xs font-bold text-gray-500 dark:text-slate-400 bg-white/80 dark:bg-slate-900/80 px-2 py-1 rounded shadow-sm">
                                        {draftImage ? 'Change Preview' : uploadProgress.draft ? 'Uploading...' : 'Upload Preview'}
                                      </span>
                                   </div>
                                </div>
                                <input type="file" onChange={handleDraftUpload} className="hidden" accept="image/*" />
                             </label>
                             <div className="text-[10px] text-gray-400 mt-2 text-center">Uploading sets status to 'Draft Sent'</div>
                          </div>

                          <div className="bg-white dark:bg-slate-900 p-6 rounded-xl border border-gray-200 dark:border-slate-700 shadow-sm">
                             <h3 className="text-xs font-bold uppercase text-gray-400 tracking-wider mb-4">Final Assets</h3>
                             <label className="block w-full cursor-pointer group mb-4">
                                <div className="w-full h-32 border-2 border-dashed border-gray-200 dark:border-slate-700 rounded-xl flex flex-col items-center justify-center gap-3 hover:bg-gray-50 dark:hover:bg-slate-800 dark:bg-slate-800 hover:border-blue-300 transition-all bg-gray-50/30">
                                    <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center group-hover:bg-blue-100 transition-colors">
                                        <Upload size={20} className="text-blue-500" />
                                    </div>
                                    <span className="text-xs font-bold text-gray-600 dark:text-slate-400">Upload Final Files</span>
                                </div>
                                <input type="file" onChange={handleFinalFileUpload} className="hidden" multiple />
                             </label>
                             <div className="space-y-3">
                                {Object.keys(uploadProgress).filter(k => k !== 'draft').map(fileName => (
                                    <div key={fileName} className="bg-blue-50/50 border border-blue-100 p-3 rounded-lg animate-pulse">
                                        <div className="flex justify-between items-center mb-2">
                                            <span className="text-[10px] font-bold text-blue-800 truncate flex-1">{fileName}</span>
                                            <span className="text-[10px] font-bold text-blue-600">{Math.round(uploadProgress[fileName])}%</span>
                                        </div>
                                        <div className="w-full bg-blue-100 rounded-full h-1 overflow-hidden">
                                            <div className="bg-blue-600 h-full transition-all duration-300" style={{ width: `${uploadProgress[fileName]}%` }}></div>
                                        </div>
                                    </div>
                                ))}
                                {finalFiles.length > 0 ? finalFiles.map((f, i) => (
                                    <div key={i} className="flex items-center justify-between bg-white dark:bg-slate-900 p-3 rounded-xl border border-gray-100 dark:border-slate-700 group shadow-sm hover:border-gray-200 dark:border-slate-700 transition-all">
                                        <div className="flex items-center gap-3 overflow-hidden">
                                           <div className="p-2 bg-gray-50 dark:bg-slate-800 rounded-lg group-hover:bg-gray-100 dark:hover:bg-slate-700 dark:bg-slate-800 transition-colors">
                                              <FileBox size={16} className="text-gray-400" />
                                           </div>
                                           <span className="text-xs text-gray-700 dark:text-slate-300 font-medium truncate max-w-[150px]">{f.name}</span>
                                        </div>
                                        <button onClick={() => removeFinalFile(i)} className="text-gray-300 hover:text-red-500 transition-colors p-1 rounded-full hover:bg-red-50"><X size={16}/></button>
                                    </div>
                                )) : <div className="text-center text-xs text-gray-400 italic">No final files added.</div>}
                             </div>
                          </div>

                          <div className="bg-white dark:bg-slate-900 p-6 rounded-xl border border-gray-200 dark:border-slate-700 shadow-sm">
                              <h3 className="text-xs font-bold uppercase text-gray-400 tracking-wider mb-4">Communication</h3>
                              <button onClick={() => selectedOrder && sendWhatsAppNotification(selectedOrder, selectedOrder.status)} className="w-full bg-emerald-50 text-emerald-600 py-4 rounded-xl font-bold text-xs uppercase tracking-widest border border-emerald-100 hover:bg-emerald-100 transition-all flex items-center justify-center gap-3 shadow-sm hover:shadow-emerald-100">
                                  <MessageCircle size={18} /> WhatsApp Update
                              </button>
                          </div>
                          <div className="bg-white dark:bg-slate-900 p-6 rounded-xl border border-gray-200 dark:border-slate-700 shadow-sm mt-6">
                              <h3 className="text-xs font-bold uppercase text-gray-400 tracking-wider mb-4 flex items-center gap-2">
                                <Receipt size={14} /> Invoice & Billing
                              </h3>
                              <button onClick={() => selectedOrder && downloadInvoice(selectedOrder)} className="w-full bg-blue-50 text-blue-700 py-4 rounded-xl font-bold text-xs uppercase tracking-widest border border-blue-100 hover:bg-blue-100 transition-all flex items-center justify-center gap-3 shadow-sm hover:shadow-blue-100">
                                  <Download size={18} /> Download Invoice
                              </button>
                          </div>
                      </div>

                      {/* COLUMN 2 & 3: DETAILS */}
                      <div className="md:col-span-2 space-y-6">
                           {selectedOrder?.status === OrderStatus.REVISION && (
                               <div className="bg-orange-50 border border-orange-200 p-4 rounded-xl flex items-start gap-4">
                                   <AlertCircle className="text-orange-500 shrink-0 mt-0.5" size={18} />
                                   <div>
                                       <h4 className="text-orange-800 font-bold text-sm">Revision Requested</h4>
                                       <p className="text-orange-700 text-sm mt-1">{selectedOrder.revisionNotes || "No notes provided."}</p>
                                   </div>
                               </div>
                           )}

                           {selectedOrder?.isDeletedByAdmin && (
                               <div className="bg-red-50 border border-red-200 p-4 rounded-xl flex items-center gap-4">
                                   <div className="bg-red-100 p-2 rounded-full"><Trash2 className="text-red-500" size={20} /></div>
                                   <div>
                                       <h4 className="text-red-800 font-bold text-sm">Files Erased</h4>
                                       <p className="text-red-700 text-xs mt-0.5">Admin has removed the assets for this project.</p>
                                   </div>
                               </div>
                           )}

                           {selectedOrder?.rating && (
                               <div className="bg-yellow-50 border border-yellow-200 p-6 rounded-xl shadow-sm">
                                   <div className="flex justify-between items-start mb-4">
                                       <div>
                                           <h4 className="text-yellow-800 font-bold text-sm mb-2">Client Feedback</h4>
                                           <div className="flex gap-1">
                                               {[1, 2, 3, 4, 5].map((star) => (
                                                 <span key={star} className={`text-xl ${selectedOrder.rating! >= star ? 'text-yellow-400' : 'text-yellow-200'}`}>
                                                     ★
                                                 </span>
                                               ))}
                                           </div>
                                       </div>
                                       <button onClick={handleAddTestimonial} className="bg-white dark:bg-slate-900 border border-yellow-300 text-yellow-700 hover:bg-yellow-100 px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-widest transition-colors shadow-sm">
                                           Add to Testimonials
                                       </button>
                                   </div>
                                   {selectedOrder.feedback && (
                                       <p className="text-yellow-900 text-sm italic border-t border-yellow-200/50 pt-4 mt-2">"{selectedOrder.feedback}"</p>
                                   )}
                               </div>
                           )}

                           <div className="bg-white dark:bg-slate-900 p-6 rounded-xl border border-gray-200 dark:border-slate-700 shadow-sm">
                              <h3 className="text-sm font-bold text-gray-900 dark:text-slate-100 mb-4 pb-2 border-b border-gray-100 dark:border-slate-700 flex items-center gap-2">
                                <Download size={16} className="text-gray-400" /> Client Assets
                              </h3>
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                 <div>
                                   <span className="text-gray-400 block text-xs uppercase tracking-wider mb-3">Uploaded Files</span>
                                   {selectedOrder?.files && selectedOrder.files.length > 0 ? (
                                     <div className="space-y-2">
                                       {selectedOrder.files.map((f, i) => (
                                          <a key={i} href={f.data} download={f.name} target="_blank" rel="noopener noreferrer" className="flex items-center justify-between p-3 bg-gray-50 dark:bg-slate-800 hover:bg-blue-50 border border-gray-200 dark:border-slate-700 rounded-lg group transition-colors cursor-pointer">
                                              <div className="flex items-center gap-3 overflow-hidden">
                                                 <div className="bg-white dark:bg-slate-900 p-1.5 rounded border border-gray-200 dark:border-slate-700 text-gray-500 dark:text-slate-400"><ImageIcon size={14} /></div>
                                                 <span className="text-sm text-gray-700 dark:text-slate-300 font-medium truncate">{f.name}</span>
                                              </div>
                                              <Download size={14} className="text-gray-400 group-hover:text-blue-500" />
                                          </a>
                                       ))}
                                     </div>
                                   ) : (
                                     <div className="text-gray-400 italic text-sm bg-gray-50 dark:bg-slate-800 p-3 rounded-lg text-center">No files uploaded.</div>
                                   )}
                                 </div>
                                 <div>
                                   <span className="text-gray-400 block text-xs uppercase tracking-wider mb-3">Voice Briefs</span>
                                   {selectedOrder?.voiceClips && selectedOrder.voiceClips.length > 0 ? (
                                     <div className="space-y-2">
                                       {selectedOrder.voiceClips.map((v, i) => (
                                          <div key={i} className="bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-lg p-3">
                                             <div className="flex items-center gap-2 mb-2">
                                                <Music size={14} className="text-purple-500" />
                                                <span className="text-xs font-bold text-gray-700 dark:text-slate-300">{v.name}</span>
                                             </div>
                                             <audio controls src={v.data} className="w-full h-8" />
                                          </div>
                                       ))}
                                     </div>
                                   ) : (
                                      <div className="text-gray-400 italic text-sm bg-gray-50 dark:bg-slate-800 p-3 rounded-lg text-center">No voice notes.</div>
                                   )}
                                 </div>
                              </div>
                           </div>
                           <div className="bg-white dark:bg-slate-900 p-6 rounded-xl border border-gray-200 dark:border-slate-700 shadow-sm">
                               <div className="flex justify-between items-center mb-4 pb-2 border-b border-gray-100 dark:border-slate-700">
                                  <h3 className="text-sm font-bold text-gray-900 dark:text-slate-100 flex items-center gap-2"><LayoutIcon size={16} className="text-gray-400" /> Specifications</h3>
                                  <button onClick={() => selectedOrder && exportPalette(selectedOrder.colorPalette)} className="text-[10px] font-bold text-gray-500 dark:text-slate-400 hover:text-blue-600 flex items-center gap-1 uppercase tracking-wider">
                                    <Download size={12} /> Export Palette
                                  </button>
                               </div>
                               <div className="grid grid-cols-2 gap-6 text-sm">
                                   {selectedOrder?.dimensions && (
                                       <div>
                                           <span className="text-gray-400 block text-xs uppercase tracking-wider mb-1">Dimensions</span>
                                           <span className="font-mono text-gray-800 dark:text-slate-200 bg-gray-100 dark:bg-slate-800 px-2 py-1 rounded inline-block uppercase">{selectedOrder.dimensions.width}x{selectedOrder.dimensions.height}{selectedOrder.dimensions.unit} ({selectedOrder.dimensions.ppi}ppi)</span>
                                       </div>
                                   )}
                                   <div>
                                        <div className="flex justify-between items-center mb-1">
                                           <span className="text-gray-400 block text-xs uppercase tracking-wider">Palette</span>
                                           <button onClick={() => selectedOrder && copyPalette(selectedOrder.colorPalette)} className="text-gray-400 hover:text-gray-600 dark:text-slate-400"><Copy size={10} /></button>
                                        </div>
                                        <div className="flex gap-1.5 mt-1 flex-wrap">
                                            {selectedOrder?.colorPalette.map(c => <div key={c} className="w-8 h-8 rounded-full border border-gray-200 dark:border-slate-700 shadow-sm" style={{backgroundColor: c}}></div>)}
                                        </div>
                                   </div>
                                   <div className="col-span-2">
                                       <span className="text-gray-400 block text-xs uppercase tracking-wider mb-2">Project Brief</span>
                                       <div className="bg-gray-50 dark:bg-slate-800 p-4 rounded-lg border border-white dark:border-slate-800/5 text-gray-800 dark:text-slate-200 leading-relaxed whitespace-pre-wrap">
                                          {selectedOrder?.requirements}
                                       </div>
                                       
                                       {selectedOrder?.customFields && Object.keys(selectedOrder.customFields).length > 0 && (
                                           <div className="mt-6 pt-6 border-t border-gray-100 dark:border-slate-700 grid grid-cols-1 md:grid-cols-2 gap-4">
                                             {Object.entries(selectedOrder.customFields).map(([key, value]) => {
                                                if (!value) return null;
                                                return (
                                                  <div key={key} className="bg-gray-50 dark:bg-slate-800 p-3 rounded-lg border border-gray-100 dark:border-slate-700">
                                                    <span className="text-xs font-bold text-gray-400 uppercase tracking-wider block mb-1">{key}</span>
                                                    <div className="text-sm font-medium text-gray-800 dark:text-slate-200 break-words">
                                                      {Array.isArray(value) ? (
                                                        <ul className="list-disc list-inside space-y-1">
                                                          {value.map((item: any, i: number) => {
                                                            if (typeof item === 'string') return <li key={i}>{item}</li>;
                                                            if (item.platform && item.handle) return <li key={i}><span className="font-semibold">{item.platform}:</span> {item.handle}</li>;
                                                            if (item.title) return <li key={i}><span className="italic">{item.title}</span> {item.author ? `by ${item.author}` : ''}</li>;
                                                            return <li key={i}>{JSON.stringify(item)}</li>;
                                                          })}
                                                        </ul>
                                                      ) : (
                                                        value.toString()
                                                      )}
                                                    </div>
                                                  </div>
                                                );
                                             })}
                                           </div>
                                       )}
                                   </div>
                               </div>
                           </div>
                      </div>
                  </div>
                  
                  <div className="px-8 py-5 border-t border-gray-100 dark:border-slate-700 bg-white dark:bg-slate-900 flex justify-end items-center gap-4 z-10 shrink-0">
                      <button onClick={() => closeOrder()} className="px-6 py-2.5 rounded-lg text-gray-500 dark:text-slate-400 font-semibold hover:bg-gray-100 dark:hover:bg-slate-700 dark:bg-slate-800 transition-colors text-sm">Cancel</button>
                      <button onClick={saveChanges} disabled={Object.keys(uploadProgress).length > 0} className={`px-10 py-3.5 bg-blue-600 text-white font-bold rounded-xl flex items-center gap-3 text-xs uppercase tracking-widest shadow-xl shadow-blue-600/20 transition-all ${Object.keys(uploadProgress).length > 0 ? 'opacity-50 cursor-not-allowed' : 'hover:bg-blue-700'}`}>
                          {Object.keys(uploadProgress).length > 0 ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                          {Object.keys(uploadProgress).length > 0 ? 'Uploading...' : 'Save Changes'}
                      </button>
                  </div>
              </div>
          </div>
      )}
    </div>
  );
};