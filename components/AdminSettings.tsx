import React, { useState, useEffect } from 'react';
import { getPortfolioItems, getServicesConfig, addPortfolioItem, updatePortfolioItem, deletePortfolioItem, updateServiceConfig, PortfolioItem, ServiceItem, updateAdminPassword, getAdminEmails, updateAdminEmails, getDiscountsConfig, updateDiscountsConfig } from '../services/dataService';
import { SERVICES as DEFAULT_SERVICES, PORTFOLIO_ITEMS as DEFAULT_PORTFOLIO } from '../constants';
import { Save, Loader2, Plus, Trash2, Key, UserPlus, ShieldCheck, Mail, Eye, EyeOff, Tag, Edit3 } from 'lucide-react';
import { User } from '../types';

interface AdminSettingsProps {
    user?: User | null;
}

export const AdminSettings: React.FC<AdminSettingsProps> = ({ user }) => {
    const [serviceConfigs, setServiceConfigs] = useState<Record<string, ServiceItem>>({});
    const [showServiceModal, setShowServiceModal] = useState(false);
    const [editingService, setEditingService] = useState<any>(null);
    const [portfolio, setPortfolio] = useState<PortfolioItem[]>([]);
    const [loading, setLoading] = useState(false);
    const [newPassword, setNewPassword] = useState('');
    const [adminEmails, setAdminEmails] = useState<string[]>([]);
    const [emailInput, setEmailInput] = useState('');
    const [updatingAdmins, setUpdatingAdmins] = useState(false);
    
    // Discounts
    const [globalDiscount, setGlobalDiscount] = useState(0);
    const [isGlobalDiscountActive, setIsGlobalDiscountActive] = useState(false);

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        setLoading(true);
        try {
            const configs = await getServicesConfig();
            const loadedConfigs: Record<string, ServiceItem> = { ...configs };
            DEFAULT_SERVICES.forEach(s => {
                if (!loadedConfigs[s.id]) {
                    loadedConfigs[s.id] = { id: s.id, price: s.price, title: s.title };
                } else {
                    loadedConfigs[s.id] = { ...loadedConfigs[s.id], title: loadedConfigs[s.id].title || s.title };
                }
            });
            setServiceConfigs(loadedConfigs);

            const items = await getPortfolioItems();
            if (items.length > 0) {
                setPortfolio(items);
            } else {
                setPortfolio(DEFAULT_PORTFOLIO.map(p => ({ ...p, id: String(p.id) })));
            }

            const emails = await getAdminEmails();
            setAdminEmails(emails);
            
            const discountInfo = await getDiscountsConfig();
            setGlobalDiscount(discountInfo.globalDiscount);
            setIsGlobalDiscountActive(discountInfo.isActive);
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    const handleSavePrices = async () => {
        setLoading(true);
        try {
            for (const key in serviceConfigs) {
                const s = serviceConfigs[key];
                const payload: any = { 
                    price: s.price || 0,
                    hidden: s.hidden,
                    discountPercentage: s.discountPercentage || 0
                };
                if (s.isCustom) {
                    payload.isCustom = true;
                    payload.title = s.title;
                    payload.description = s.description;
                    payload.image = s.image;
                    payload.features = s.features || [];
                }
                await updateServiceConfig(key, payload);
            }
            await updateDiscountsConfig({ globalDiscount, isActive: isGlobalDiscountActive });
            alert("Services updated successfully.");
        } catch (e) {
            console.error(e);
            alert("Error updating services");
        } finally {
            setLoading(false);
        }
    };

    const handleAddPortfolio = () => {
        const item: PortfolioItem = {
            title: 'New Portfolio Item',
            description: 'Item description',
            category: 'Uncategorized',
            img: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&q=80&w=1200'
        };
        setPortfolio([...portfolio, item]);
    };

    const handlePortfolioChange = (index: number, field: keyof PortfolioItem, value: string) => {
        const newPortfolio = [...portfolio];
        newPortfolio[index] = { ...newPortfolio[index], [field]: value };
        setPortfolio(newPortfolio);
    };

    const handleSavePortfolioItem = async (index: number) => {
        const item = portfolio[index];
        setLoading(true);
        try {
            if (item.id && !Number.isInteger(Number(item.id))) {
                await updatePortfolioItem(item.id, item);
            } else {
                // If it is a default item falling back or new item, add it
                const obj = { ...item };
                delete obj.id;
                const ref = await addPortfolioItem(obj);
                const newPortfolio = [...portfolio];
                newPortfolio[index].id = ref.id;
                setPortfolio(newPortfolio);
            }
            alert("Saved item successfully.");
        } catch (e) {
            console.error(e);
            alert("Error saving item");
        } finally {
            setLoading(false);
        }
    };

    const handleDeletePortfolioItem = async (index: number) => {
        const item = portfolio[index];
        if (item.id && !Number.isInteger(Number(item.id))) {
            setLoading(true);
            try {
                await deletePortfolioItem(item.id);
            } catch (e) {
                console.error(e);
            }
            setLoading(false);
        }
        setPortfolio(portfolio.filter((_, i) => i !== index));
    };

    const handleSavePassword = async () => {
        if (!newPassword) return;
        setLoading(true);
        try {
            await updateAdminPassword(newPassword);
            alert("Admin password updated successfully.");
            setNewPassword('');
        } catch (e) {
            console.error(e);
            alert("Error updating password");
        } finally {
            setLoading(false);
        }
    };

    const handleAddAdminEmail = async (e: React.FormEvent) => {
        e.preventDefault();
        const trimmed = emailInput.trim().toLowerCase();
        if (!trimmed) return;
        
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(trimmed)) {
            return;
        }

        if (trimmed === 'ranthuls112@gmail.com') {
            return;
        }

        if (adminEmails.includes(trimmed)) {
            return;
        }

        setUpdatingAdmins(true);
        try {
            const updated = [...adminEmails, trimmed];
            await updateAdminEmails(updated);
            setAdminEmails(updated);
            setEmailInput('');
        } catch (err) {
            console.error(err);
        } finally {
            setUpdatingAdmins(false);
        }
    };

    const handleRemoveAdminEmail = async (emailToRemove: string) => {
        setUpdatingAdmins(true);
        try {
            const updated = adminEmails.filter(email => email !== emailToRemove);
            await updateAdminEmails(updated);
            setAdminEmails(updated);
        } catch (err) {
            console.error(err);
        } finally {
            setUpdatingAdmins(false);
        }
    };

    return (
        <>
            <div className="space-y-8 pb-12">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Security Info & Password */}
                <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-6">
                <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                    <Key size={20} className="text-blue-600" /> Security Settings
                </h3>
                <p className="text-sm text-gray-500 mb-4">Change the admin panel access password here.</p>
                <div className="flex items-center gap-4 max-w-sm">
                         <input 
                              type="password" 
                              value={newPassword}
                              onChange={e => setNewPassword(e.target.value)}
                              placeholder="New Admin Password"
                              className="flex-1 border border-gray-300 rounded-lg px-4 py-2 outline-none focus:border-blue-500 transition-colors"
                         />
                         <button 
                             onClick={handleSavePassword} 
                             disabled={!newPassword || loading} 
                             className="bg-gray-900 text-white hover:bg-gray-800 px-4 py-2 rounded-lg text-sm font-semibold flex items-center gap-2 transition-colors disabled:opacity-50"
                         >
                             {loading && <Loader2 size={16} className="animate-spin" />}
                             Update
                         </button>
                    </div>
                </div>

                {/* Authorized Administrators (Add/Remove Users) */}
                <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-6">
                    <h3 className="text-lg font-bold text-gray-900 mb-2 flex items-center gap-2">
                        <ShieldCheck size={20} className="text-green-600" /> Authorized Admins
                    </h3>
                    <p className="text-sm text-gray-500 mb-4">Grant secondary admin privileges to other registered user emails.</p>
                    
                    <form onSubmit={handleAddAdminEmail} className="flex gap-3 mb-6">
                        <div className="relative flex-1">
                            <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                            <input 
                                type="email" 
                                value={emailInput}
                                onChange={e => setEmailInput(e.target.value)}
                                placeholder="e.g. colleague@example.com"
                                className="w-full bg-gray-50 border border-gray-300 rounded-xl pl-10 pr-4 py-2.5 outline-none focus:border-purple-600 focus:bg-white transition-all text-sm font-sans placeholder:text-gray-400"
                            />
                        </div>
                        <button 
                            type="submit"
                            disabled={!emailInput.trim() || updatingAdmins}
                            className="bg-purple-600 hover:bg-purple-700 text-white px-5 py-2.5 rounded-xl text-sm font-bold flex items-center gap-2 transition-all shadow-md disabled:opacity-50"
                        >
                            {updatingAdmins ? <Loader2 size={16} className="animate-spin" /> : <UserPlus size={16} />}
                            Add
                        </button>
                    </form>

                    <div className="space-y-2 max-h-[160px] overflow-y-auto pr-1">
                        {/* Always Root Owner */}
                        <div className="flex items-center justify-between p-3.5 bg-purple-50/55 border border-purple-100 rounded-xl">
                            <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-full bg-purple-150 flex items-center justify-center text-purple-700 text-xs font-black">👑</div>
                                <div>
                                    <div className="text-xs font-mono font-bold text-gray-900">ranthuls112@gmail.com</div>
                                    <div className="text-[10px] text-purple-600 font-bold tracking-wider uppercase">System Owner</div>
                                </div>
                            </div>
                            <span className="text-[10px] bg-purple-100 text-purple-700 border border-purple-200 uppercase font-black px-2 py-0.5 rounded-full scale-90">ROOT</span>
                        </div>

                        {adminEmails.map(email => (
                            <div key={email} className="flex items-center justify-between p-3.5 bg-gray-50 border border-gray-200 rounded-xl">
                                <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center text-gray-500 text-xs font-black">👤</div>
                                    <div>
                                        <div className="text-xs font-mono font-bold text-gray-700">{email}</div>
                                        <div className="text-[10px] text-gray-400 font-bold uppercase">Secondary Admin</div>
                                    </div>
                                </div>
                                <button 
                                    type="button"
                                    onClick={() => handleRemoveAdminEmail(email)}
                                    disabled={updatingAdmins}
                                    className="text-gray-400 hover:text-red-500 hover:bg-red-50 p-2 rounded-lg transition-colors disabled:opacity-50"
                                    title="Revoke Admin Access"
                                >
                                    <Trash2 size={15} />
                                </button>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
            
            <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-6 mb-8">
                <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                    <Tag size={20} className="text-rose-500" /> Discounts Manager
                </h3>
                <p className="text-sm text-gray-500 mb-6">Set global discounts or service-specific percentage overrides.</p>
                
                <div className="flex items-center gap-6 p-5 bg-rose-50/50 border border-rose-100 rounded-xl mb-6">
                    <div className="flex items-center gap-3">
                        <label className="relative inline-flex items-center cursor-pointer">
                            <input type="checkbox" checked={isGlobalDiscountActive} onChange={(e) => setIsGlobalDiscountActive(e.target.checked)} className="sr-only peer" />
                            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-rose-500"></div>
                        </label>
                        <span className="text-sm font-bold text-gray-900">Enable Global Seasonal Discount</span>
                    </div>
                    
                    {isGlobalDiscountActive && (
                        <div className="flex items-center gap-2">
                            <input 
                                type="number" 
                                min="0" 
                                max="100" 
                                value={globalDiscount}
                                onChange={(e) => setGlobalDiscount(Number(e.target.value))}
                                className="w-20 border border-gray-300 rounded-lg px-3 py-1.5 outline-none focus:border-rose-500 font-mono text-sm text-center"
                            />
                            <span className="text-sm font-bold text-gray-700">% OFF applied globally to all services</span>
                        </div>
                    )}
                </div>

                <h3 className="text-lg font-bold text-gray-900 mb-6 flex justify-between items-center">
                    Services Configuration
                    <div className="flex gap-3">
                        <button onClick={() => { setEditingService(null); setShowServiceModal(true); }} className="bg-purple-600 text-white hover:bg-purple-700 px-4 py-2 rounded-lg text-sm font-semibold flex items-center gap-2 transition-colors">
                            <Plus size={16} /> New Service
                        </button>
                        <button onClick={handleSavePrices} disabled={loading} className="bg-blue-600 text-white hover:bg-blue-700 px-4 py-2 rounded-lg text-sm font-semibold flex items-center gap-2 transition-colors disabled:opacity-50">
                            {loading && <Loader2 size={16} className="animate-spin" />}
                            <Save size={16} /> Save Services
                        </button>
                    </div>
                </h3>
                <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
                    {Object.values(serviceConfigs).map(s => (
                        <div key={s.id} className={`border border-gray-200 rounded-lg p-4 flex items-center justify-between ${s.hidden ? 'bg-gray-100 opacity-70' : 'bg-gray-50'}`}>
                            <span className="font-medium text-gray-700 text-sm truncate pr-2 max-w-[200px] md:max-w-xs" title={s.title}>{s.title}</span>
                            <div className="flex items-center gap-4 shrink-0">
                                <div className="flex items-center gap-2">
                                    <span className="text-gray-400 text-sm font-bold hidden sm:block">LKR</span>
                                    <input 
                                        type="number"
                                        min="0"
                                        value={s.price ?? ''}
                                        onChange={(e) => setServiceConfigs({...serviceConfigs, [s.id]: { ...s, price: Number(e.target.value) }})}
                                        className="w-24 border border-gray-300 rounded px-2 py-1 outline-none focus:border-blue-500 font-mono text-sm text-right"
                                        placeholder="Base Price"
                                        title="Base Price"
                                    />
                                </div>
                                <div className="flex items-center gap-1 border-l border-gray-200 pl-4 ml-2">
                                    <Tag size={12} className="text-rose-400" />
                                    <input 
                                        type="number"
                                        min="0"
                                        max="100"
                                        value={s.discountPercentage ?? ''}
                                        onChange={(e) => setServiceConfigs({...serviceConfigs, [s.id]: { ...s, discountPercentage: Number(e.target.value) }})}
                                        className="w-16 border border-gray-300 rounded px-2 py-1 outline-none focus:border-rose-500 font-mono text-sm text-center text-rose-600 bg-rose-50/20 placeholder:text-gray-300"
                                        title="Specific % Discount for this service"
                                        placeholder="0%"
                                    />
                                    <span className="text-gray-400 text-xs font-bold">%</span>
                                </div>
                                {s.isCustom && (
                                   <button onClick={() => { setEditingService(s); setShowServiceModal(true); }} className="p-2 text-purple-600 hover:text-purple-800 transition-colors bg-purple-50 rounded-lg">
                                      <Edit3 size={16} />
                                   </button>
                                )}
                                <button 
                                    onClick={() => setServiceConfigs({...serviceConfigs, [s.id]: { ...s, hidden: !s.hidden }})} 
                                    className={`p-2 rounded-lg transition-colors ${s.hidden ? 'text-gray-400 hover:text-blue-600' : 'text-blue-600 hover:text-gray-400'}`}
                                    title={s.hidden ? "Show Service" : "Hide Service"}
                                >
                                    {s.hidden ? <EyeOff size={18} /> : <Eye size={18} />}
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

        </div>

        {showServiceModal && (
            <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
               <div className="bg-white rounded-3xl p-8 max-w-lg w-full max-h-[90vh] overflow-y-auto">
                   <h3 className="text-2xl font-bold font-display mb-6">{editingService ? 'Edit Custom Service' : 'Add New Service'}</h3>
                   <div className="space-y-4">
                       <div>
                           <label className="block text-xs font-bold uppercase tracking-widest mb-2 text-gray-500">Service Title</label>
                           <input type="text" defaultValue={editingService?.title} id="modal_service_title" className="w-full border border-gray-300 rounded-xl p-3 outline-none focus:border-purple-500" />
                       </div>
                       <div>
                           <label className="block text-xs font-bold uppercase tracking-widest mb-2 text-gray-500">Description</label>
                           <textarea defaultValue={editingService?.description} id="modal_service_desc" className="w-full border border-gray-300 rounded-xl p-3 outline-none focus:border-purple-500 min-h-[80px]" />
                       </div>
                       <div>
                           <label className="block text-xs font-bold uppercase tracking-widest mb-2 text-gray-500">Image URL</label>
                           <input type="text" defaultValue={editingService?.image || 'https://picsum.photos/600/800'} id="modal_service_image" className="w-full border border-gray-300 rounded-xl p-3 outline-none focus:border-purple-500" />
                       </div>
                       <div>
                           <label className="block text-xs font-bold uppercase tracking-widest mb-2 text-gray-500">Initial Price (LKR)</label>
                           <input type="number" defaultValue={editingService?.price || 0} id="modal_service_price" className="w-full border border-gray-300 rounded-xl p-3 outline-none focus:border-purple-500" />
                       </div>
                   </div>
                   <div className="flex gap-4 mt-8">
                       <button onClick={() => setShowServiceModal(false)} className="flex-1 py-3 text-gray-500 font-bold uppercase tracking-widest text-xs hover:bg-gray-50 rounded-xl transition-colors">Cancel</button>
                       <button 
                          onClick={() => {
                              const t = (document.getElementById('modal_service_title') as HTMLInputElement).value;
                              const d = (document.getElementById('modal_service_desc') as HTMLTextAreaElement).value;
                              const i = (document.getElementById('modal_service_image') as HTMLInputElement).value;
                              const p = Number((document.getElementById('modal_service_price') as HTMLInputElement).value);
                              if (!t) return alert("Title required");
                              
                              const id = editingService ? editingService.id : `s_custom_${Date.now()}`;
                              setServiceConfigs(prev => ({
                                  ...prev,
                                  [id]: {
                                      id,
                                      title: t,
                                      description: d,
                                      image: i,
                                      price: p,
                                      isCustom: true,
                                      hidden: editingService?.hidden || false,
                                      discountPercentage: editingService?.discountPercentage || 0,
                                      features: editingService?.features || []
                                  }
                              }));
                              setShowServiceModal(false);
                          }} 
                          className="flex-1 bg-purple-600 text-white py-3 rounded-xl font-bold uppercase tracking-widest text-xs hover:bg-purple-700 transition-colors"
                        >
                           Save
                       </button>
                   </div>
               </div>
            </div>
        )}

        </>
    );
};
