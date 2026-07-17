import { toast } from "react-hot-toast";
import React, { useState, useEffect } from 'react';
import { getPortfolioItems, getServicesConfig, addPortfolioItem, updatePortfolioItem, deletePortfolioItem, updateServiceConfig, deleteServiceConfig, PortfolioItem, ServiceItem, updateAdminPassword, getAdminEmails, updateAdminEmails, getDiscountsConfig, updateDiscountsConfig, getDisplayConfig, updateDisplayConfig, DisplayConfig, getLuckyWheelConfig, updateLuckyWheelConfig } from '../services/dataService';
import { SERVICES as DEFAULT_SERVICES, PORTFOLIO_ITEMS as DEFAULT_PORTFOLIO } from '../constants';
import { Save, Loader2, Plus, Trash2, Key, UserPlus, ShieldCheck, Mail, Eye, EyeOff, Tag, Edit3, Upload } from 'lucide-react';
import { User, WheelSegment } from '../types';
import { uploadFileWithProgress } from '../services/fileUploadService';
import { MediaRenderer } from './MediaRenderer';

interface AdminSettingsProps {
    user?: User | null;
}

import { AdminFooterSettings } from './AdminFooterSettings';

export const AdminSettings: React.FC<AdminSettingsProps> = ({ user }) => {
    const [serviceConfigs, setServiceConfigs] = useState<Record<string, ServiceItem>>({});
    const [showServiceModal, setShowServiceModal] = useState(false);
    const [editingService, setEditingService] = useState<any>(null);
    const [uploadingServiceImage, setUploadingServiceImage] = useState(false);
    const [serviceImageProgress, setServiceImageProgress] = useState(0);
    const [serviceToDelete, setServiceToDelete] = useState<string | null>(null);
    const [portfolio, setPortfolio] = useState<PortfolioItem[]>([]);
    const [loading, setLoading] = useState(false);
    const [newPassword, setNewPassword] = useState('');
    const [adminEmails, setAdminEmails] = useState<string[]>([]);
    const [emailInput, setEmailInput] = useState('');
    const [updatingAdmins, setUpdatingAdmins] = useState(false);
    
    // Discounts
    const [globalDiscount, setGlobalDiscount] = useState(0);
    const [isGlobalDiscountActive, setIsGlobalDiscountActive] = useState(false);
    
    // Display Config
    const [showServiceAnimations, setShowServiceAnimations] = useState(false);
    const [enableServiceWheel, setEnableServiceWheel] = useState(true);
    const [enableDiscountWheel, setEnableDiscountWheel] = useState(true);
    const [luckyWheelSegments, setLuckyWheelSegments] = useState<WheelSegment[]>([]);

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
                    loadedConfigs[s.id] = { id: s.id, price: s.price, title: s.title, description: s.description, features: s.features, image: s.image };
                } else {
                    loadedConfigs[s.id] = { 
                        ...loadedConfigs[s.id], 
                        title: loadedConfigs[s.id].title || s.title,
                        description: loadedConfigs[s.id].description || s.description,
                        features: loadedConfigs[s.id].features || s.features,
                        image: loadedConfigs[s.id].image || s.image
                    };
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
            
            const displayInfo = await getDisplayConfig();
            setShowServiceAnimations(displayInfo.showServiceAnimations);
            setEnableServiceWheel(displayInfo.enableServiceWheel !== false);
            setEnableDiscountWheel(displayInfo.enableDiscountWheel !== false);

            const wheelConfigs = await getLuckyWheelConfig();
            setLuckyWheelSegments(wheelConfigs);
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
                    discountPercentage: s.discountPercentage || 0,
                    title: s.title,
                    description: s.description,
                    image: s.image,
                    features: s.features || []
                };
                if (s.isCustom) {
                    payload.isCustom = true;
                }
                await updateServiceConfig(key, payload);
            }
            await updateDiscountsConfig({ globalDiscount, isActive: isGlobalDiscountActive });
            await updateDisplayConfig({ showServiceAnimations, enableServiceWheel, enableDiscountWheel });
            await updateLuckyWheelConfig(luckyWheelSegments);
            toast("Services updated successfully.");
        } catch (e) {
            console.error(e);
            toast("Error updating services");
        } finally {
            setLoading(false);
        }
    };

    const handleServiceImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setUploadingServiceImage(true);
        setServiceImageProgress(0);

        try {
            const url = await uploadFileWithProgress(file, `services/${Date.now()}_${file.name}`, (progress) => {
                setServiceImageProgress(progress);
            });
            const input = document.getElementById('modal_service_image') as HTMLInputElement;
            if (input) input.value = url;
            
            // If editing, immediately update state so it reflects visually 
            // (though we really read straight from the DOM anyway)
            if (editingService) {
                setEditingService({ ...editingService, image: url });
            }
        } catch (error) {
            console.error("Upload error:", error);
            toast("Failed to upload image. Please try again.");
        } finally {
            setUploadingServiceImage(false);
            setServiceImageProgress(0);
        }
    };

    const handleDeleteService = (key: string) => {
        setServiceToDelete(key);
    };

    const confirmDeleteService = async () => {
        if (!serviceToDelete) return;
        setLoading(true);
        try {
            await deleteServiceConfig(serviceToDelete);
            const newConfigs = { ...serviceConfigs };
            delete newConfigs[serviceToDelete];
            setServiceConfigs(newConfigs);
        } catch (e) {
            console.error(e);
            toast("Error deleting service");
        } finally {
            setLoading(false);
            setServiceToDelete(null);
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
            toast("Saved item successfully.");
        } catch (e) {
            console.error(e);
            toast("Error saving item");
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
            toast("Admin password updated successfully.");
            setNewPassword('');
        } catch (e) {
            console.error(e);
            toast("Error updating password");
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
                <div className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-xl shadow-sm p-6">
                <h3 className="text-lg font-bold text-gray-900 dark:text-slate-100 mb-4 flex items-center gap-2">
                    <Key size={20} className="text-blue-600" /> Security Settings
                </h3>
                <p className="text-sm text-gray-500 dark:text-slate-400 mb-4">Change the admin panel access password here.</p>
                <div className="flex items-center gap-4 max-w-sm">
                         <input 
                              type="password" 
                              value={newPassword}
                              onChange={e => setNewPassword(e.target.value)}
                              placeholder="New Admin Password"
                              className="flex-1 border border-gray-300 dark:border-slate-600 rounded-lg px-4 py-2 outline-none focus:border-blue-500 transition-colors"
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
                <div className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-xl shadow-sm p-6">
                    <h3 className="text-lg font-bold text-gray-900 dark:text-slate-100 mb-2 flex items-center gap-2">
                        <ShieldCheck size={20} className="text-green-600" /> Authorized Admins
                    </h3>
                    <p className="text-sm text-gray-500 dark:text-slate-400 mb-4">Grant secondary admin privileges to other registered user emails.</p>
                    
                    <form onSubmit={handleAddAdminEmail} className="flex gap-3 mb-6">
                        <div className="relative flex-1">
                            <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                            <input 
                                type="email" 
                                value={emailInput}
                                onChange={e => setEmailInput(e.target.value)}
                                placeholder="e.g. colleague@example.com"
                                className="w-full bg-gray-50 dark:bg-slate-800 border border-gray-300 dark:border-slate-600 rounded-xl pl-10 pr-4 py-2.5 outline-none focus:border-purple-600 focus:bg-white dark:bg-slate-900 transition-all text-sm font-sans placeholder:text-gray-400"
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
                                    <div className="text-xs font-mono font-bold text-gray-900 dark:text-slate-100">ranthuls112@gmail.com</div>
                                    <div className="text-[10px] text-purple-600 font-bold tracking-wider uppercase">System Owner</div>
                                </div>
                            </div>
                            <span className="text-[10px] bg-purple-100 text-purple-700 border border-purple-200 uppercase font-black px-2 py-0.5 rounded-full scale-90">ROOT</span>
                        </div>

                        {adminEmails.map(email => (
                            <div key={email} className="flex items-center justify-between p-3.5 bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl">
                                <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center text-gray-500 dark:text-slate-400 text-xs font-black">👤</div>
                                    <div>
                                        <div className="text-xs font-mono font-bold text-gray-700 dark:text-slate-300">{email}</div>
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
            
            <div className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-xl shadow-sm p-6 mb-8">
                <h3 className="text-lg font-bold text-gray-900 dark:text-slate-100 mb-4 flex items-center gap-2">
                    <Tag size={20} className="text-rose-500" /> Discounts Manager
                </h3>
                <p className="text-sm text-gray-500 dark:text-slate-400 mb-6">Set global discounts or service-specific percentage overrides.</p>
                
                <div className="flex items-center gap-6 p-5 bg-rose-50/50 border border-rose-100 rounded-xl mb-6">
                    <div className="flex items-center gap-3">
                        <label className="relative inline-flex items-center cursor-pointer">
                            <input type="checkbox" checked={isGlobalDiscountActive} onChange={(e) => setIsGlobalDiscountActive(e.target.checked)} className="sr-only peer" />
                            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white dark:border-slate-800 after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white dark:bg-slate-900 after:border-gray-300 dark:border-slate-600 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-rose-500"></div>
                        </label>
                        <span className="text-sm font-bold text-gray-900 dark:text-slate-100">Enable Global Seasonal Discount</span>
                    </div>
                    
                    {isGlobalDiscountActive && (
                        <div className="flex items-center gap-2">
                            <input 
                                type="number" 
                                min="0" 
                                max="100" 
                                value={globalDiscount}
                                onChange={(e) => setGlobalDiscount(Number(e.target.value))}
                                className="w-20 border border-gray-300 dark:border-slate-600 rounded-lg px-3 py-1.5 outline-none focus:border-rose-500 font-mono text-sm text-center"
                            />
                            <span className="text-sm font-bold text-gray-700 dark:text-slate-300">% OFF applied globally to all services</span>
                        </div>
                    )}
                </div>

                {/* Display Settings */}
                <div className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-2xl p-6 mb-8">
                    <h4 className="text-sm font-bold text-gray-900 dark:text-slate-100 uppercase tracking-widest mb-4">Display Configurations</h4>
                    
                    <div className="flex flex-col gap-5">
                        <div>
                            <div className="flex items-center gap-3 mb-2">
                                <label className="relative inline-flex items-center cursor-pointer">
                                    <input 
                                        type="checkbox" 
                                        className="sr-only peer"
                                        checked={showServiceAnimations}
                                        onChange={(e) => setShowServiceAnimations(e.target.checked)}
                                    />
                                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-purple-600"></div>
                                </label>
                                <span className="text-sm font-bold text-gray-900 dark:text-slate-100">Show Abstract Animations Instead of Images</span>
                            </div>
                            <p className="text-xs text-gray-500 dark:text-slate-400">If enabled, the product images in the 'Select Mode' section on the homepage will be replaced by decorative abstract CSS animations.</p>
                        </div>

                        <div>
                            <div className="flex items-center gap-3 mb-2">
                                <label className="relative inline-flex items-center cursor-pointer">
                                    <input 
                                        type="checkbox" 
                                        className="sr-only peer"
                                        checked={enableServiceWheel}
                                        onChange={(e) => setEnableServiceWheel(e.target.checked)}
                                    />
                                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-purple-600"></div>
                                </label>
                                <span className="text-sm font-bold text-gray-900 dark:text-slate-100">Enable Service Picker Wheel</span>
                            </div>
                            <p className="text-xs text-gray-500 dark:text-slate-400">If disabled, the Service Picker mode on the Option Wheel will be hidden.</p>
                        </div>

                        <div>
                            <div className="flex items-center gap-3 mb-2">
                                <label className="relative inline-flex items-center cursor-pointer">
                                    <input 
                                        type="checkbox" 
                                        className="sr-only peer"
                                        checked={enableDiscountWheel}
                                        onChange={(e) => setEnableDiscountWheel(e.target.checked)}
                                    />
                                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-purple-600"></div>
                                </label>
                                <span className="text-sm font-bold text-gray-900 dark:text-slate-100">Enable Lucky Discount Wheel</span>
                            </div>
                            <p className="text-xs text-gray-500 dark:text-slate-400">If disabled, the Lucky Discount mode on the Option Wheel will be hidden.</p>
                        </div>
                    </div>
                </div>

                <div className="bg-white dark:bg-slate-800 rounded-3xl p-6 md:p-8 shadow-sm border border-gray-100 dark:border-slate-700 mb-8">
                    <h3 className="text-lg font-bold text-gray-900 dark:text-slate-100 mb-4 flex justify-between items-center">
                        Lucky Discount Wheel Configuration
                        <button onClick={handleSavePrices} disabled={loading} className="bg-blue-600 text-white hover:bg-blue-700 px-4 py-2 rounded-lg text-sm font-semibold flex items-center gap-2 transition-colors disabled:opacity-50">
                            {loading && <Loader2 size={16} className="animate-spin" />}
                            <Save size={16} /> Save Wheel
                        </button>
                    </h3>
                    <p className="text-sm text-gray-500 dark:text-slate-400 mb-6">Customize the 8 options on the lucky discount wheel.</p>
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                        {luckyWheelSegments.map((segment, index) => (
                            <div key={index} className="flex flex-col gap-2 p-4 border border-gray-200 dark:border-slate-700 rounded-xl bg-gray-50 dark:bg-slate-900">
                                <div className="flex items-center gap-2 mb-2">
                                    <span className="font-bold text-xs uppercase text-gray-400 w-24">Segment {index + 1}</span>
                                    <input 
                                        type="color" 
                                        value={segment.color}
                                        onChange={(e) => {
                                            const newSegments = [...luckyWheelSegments];
                                            newSegments[index].color = e.target.value;
                                            setLuckyWheelSegments(newSegments);
                                        }}
                                        className="w-8 h-8 rounded cursor-pointer"
                                    />
                                </div>
                                <input
                                    type="text"
                                    placeholder="Title (e.g. 10% OFF)"
                                    value={segment.title}
                                    onChange={(e) => {
                                        const newSegments = [...luckyWheelSegments];
                                        newSegments[index].title = e.target.value;
                                        setLuckyWheelSegments(newSegments);
                                    }}
                                    className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-sm focus:ring-2 focus:ring-purple-500 outline-none"
                                />
                                <div className="flex gap-2">
                                    <input
                                        type="text"
                                        placeholder="Promo Code"
                                        value={segment.promoCode || ''}
                                        onChange={(e) => {
                                            const newSegments = [...luckyWheelSegments];
                                            newSegments[index].promoCode = e.target.value;
                                            setLuckyWheelSegments(newSegments);
                                        }}
                                        className="w-1/2 px-3 py-2 rounded-lg border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-sm focus:ring-2 focus:ring-purple-500 outline-none"
                                    />
                                    <input
                                        type="number"
                                        min="0"
                                        placeholder="Win Probability %"
                                        value={segment.probability ?? 1}
                                        onChange={(e) => {
                                            const newSegments = [...luckyWheelSegments];
                                            newSegments[index].probability = parseFloat(e.target.value) || 0;
                                            setLuckyWheelSegments(newSegments);
                                        }}
                                        className="w-1/2 px-3 py-2 rounded-lg border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-sm focus:ring-2 focus:ring-purple-500 outline-none"
                                    />
                                </div>
                                <textarea
                                    placeholder="Description"
                                    value={segment.description || ''}
                                    onChange={(e) => {
                                        const newSegments = [...luckyWheelSegments];
                                        newSegments[index].description = e.target.value;
                                        setLuckyWheelSegments(newSegments);
                                    }}
                                    rows={2}
                                    className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-sm focus:ring-2 focus:ring-purple-500 outline-none resize-none"
                                />
                            </div>
                        ))}
                    </div>
                </div>

                <h3 className="text-lg font-bold text-gray-900 dark:text-slate-100 mb-6 flex justify-between items-center">
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
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                    {Object.values(serviceConfigs).map(s => (
                        <div key={s.id} className={`border border-gray-200 dark:border-slate-700 rounded-2xl overflow-hidden flex flex-col ${s.hidden ? 'bg-gray-100 dark:bg-slate-800 opacity-70' : 'bg-white dark:bg-slate-800 shadow-sm'}`}>
                            {s.image && (
                                <div className="h-40 w-full overflow-hidden relative">
                                    <MediaRenderer src={s.image} alt={s.title} className="w-full h-full object-cover" />
                                </div>
                            )}
                            <div className="p-5 flex flex-col flex-1">
                                <div className="flex justify-between items-start mb-2">
                                    <h4 className="font-bold text-gray-900 dark:text-slate-100 text-lg line-clamp-1">{s.title}</h4>
                                    {s.hidden && <span className="bg-gray-200 text-gray-600 text-[10px] px-2 py-0.5 rounded font-bold uppercase">Hidden</span>}
                                </div>
                                <p className="text-xs text-gray-500 dark:text-slate-400 line-clamp-2 mb-4">{s.description}</p>
                                
                                {s.features && s.features.length > 0 && (
                                    <ul className="mb-4 space-y-1">
                                        {s.features.slice(0, 3).map((f, i) => (
                                            <li key={i} className="text-xs text-gray-600 dark:text-slate-400 flex items-start gap-1.5"><span className="text-purple-500 mt-0.5">•</span> <span>{f}</span></li>
                                        ))}
                                        {s.features.length > 3 && <li className="text-xs text-gray-400 italic">+{s.features.length - 3} more</li>}
                                    </ul>
                                )}

                                <div className="mt-auto pt-4 border-t border-gray-100 dark:border-slate-700 flex flex-col gap-3">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                            <span className="text-gray-400 text-xs font-bold uppercase tracking-widest">Base (LKR)</span>
                                            <input 
                                                type="number"
                                                min="0"
                                                value={s.price ?? ''}
                                                onChange={(e) => setServiceConfigs({...serviceConfigs, [s.id]: { ...s, price: Number(e.target.value) }})}
                                                className="w-20 border border-gray-300 dark:border-slate-600 rounded px-2 py-1 outline-none focus:border-blue-500 font-mono text-sm text-right bg-white dark:bg-slate-900"
                                            />
                                        </div>
                                        <div className="flex items-center gap-1">
                                            <Tag size={12} className="text-rose-400" />
                                            <input 
                                                type="number"
                                                min="0"
                                                max="100"
                                                value={s.discountPercentage ?? ''}
                                                onChange={(e) => setServiceConfigs({...serviceConfigs, [s.id]: { ...s, discountPercentage: Number(e.target.value) }})}
                                                className="w-16 border border-gray-300 dark:border-slate-600 rounded px-2 py-1 outline-none focus:border-rose-500 font-mono text-sm text-center text-rose-600 bg-rose-50/20 placeholder:text-gray-300"
                                                placeholder="0%"
                                            />
                                            <span className="text-gray-400 text-xs font-bold">%</span>
                                        </div>
                                    </div>
                                    
                                    <div className="flex justify-end gap-2 mt-2">
                                        <button onClick={() => { setEditingService(s); setShowServiceModal(true); }} className="p-2 text-purple-600 hover:text-purple-800 transition-colors bg-purple-50 dark:bg-purple-900/30 rounded-lg">
                                           <Edit3 size={16} />
                                        </button>
                                        {s.isCustom && (
                                           <button onClick={() => handleDeleteService(s.id)} className="p-2 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-900/30 rounded-lg transition-colors" title="Delete custom service">
                                               <Trash2 size={16} />
                                           </button>
                                        )}
                                        <button 
                                            onClick={() => setServiceConfigs({...serviceConfigs, [s.id]: { ...s, hidden: !s.hidden }})} 
                                            className={`p-2 rounded-lg transition-colors ${s.hidden ? 'text-gray-400 hover:bg-gray-100 hover:text-blue-600' : 'text-blue-600 hover:bg-blue-50 hover:text-blue-800'} dark:hover:bg-slate-700`}
                                            title={s.hidden ? "Show Service" : "Hide Service"}
                                        >
                                            {s.hidden ? <EyeOff size={16} /> : <Eye size={16} />}
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

        </div>

        <AdminFooterSettings />

        {showServiceModal && (
            <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
               <div className="bg-white dark:bg-slate-900 rounded-3xl p-8 max-w-lg w-full max-h-[90vh] overflow-y-auto">
                   <h3 className="text-2xl font-bold font-display mb-6">{editingService ? 'Edit Custom Service' : 'Add New Service'}</h3>
                   <div className="space-y-4">
                       <div>
                           <label className="block text-xs font-bold uppercase tracking-widest mb-2 text-gray-500 dark:text-slate-400">Service Title</label>
                           <input type="text" defaultValue={editingService?.title} id="modal_service_title" className="w-full border border-gray-300 dark:border-slate-600 rounded-xl p-3 outline-none focus:border-purple-500" />
                       </div>
                       <div>
                           <label className="block text-xs font-bold uppercase tracking-widest mb-2 text-gray-500 dark:text-slate-400">Description</label>
                           <textarea defaultValue={editingService?.description} id="modal_service_desc" className="w-full border border-gray-300 dark:border-slate-600 rounded-xl p-3 outline-none focus:border-purple-500 min-h-[80px]" />
                       </div>
                       <div>
                           <label className="block text-xs font-bold uppercase tracking-widest mb-2 text-gray-500 dark:text-slate-400">Image</label>
                           <div className="flex flex-col gap-2">
                               <div className="flex gap-2">
                                   <input type="text" defaultValue={editingService?.image || 'https://picsum.photos/600/800'} id="modal_service_image" className="flex-1 border border-gray-300 dark:border-slate-600 rounded-xl p-3 outline-none focus:border-purple-500 bg-white dark:bg-slate-900" placeholder="https://..." />
                                   <div className="relative">
                                       <input type="file" accept="image/*,video/*" onChange={handleServiceImageUpload} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" disabled={uploadingServiceImage} />
                                       <button type="button" className="h-full px-4 border border-gray-300 dark:border-slate-600 rounded-xl flex items-center justify-center text-gray-500 hover:text-purple-600 hover:border-purple-600 transition-colors bg-gray-50 dark:bg-slate-800 disabled:opacity-50">
                                           {uploadingServiceImage ? <Loader2 size={20} className="animate-spin" /> : <Upload size={20} />}
                                       </button>
                                   </div>
                               </div>
                               {uploadingServiceImage && (
                                   <div className="w-full bg-gray-200 dark:bg-slate-700 rounded-full h-1.5 mt-1 overflow-hidden">
                                       <div className="bg-purple-600 h-1.5 rounded-full transition-all duration-300" style={{ width: `${serviceImageProgress}%` }}></div>
                                   </div>
                               )}
                           </div>
                       </div>
                       <div>
                           <label className="block text-xs font-bold uppercase tracking-widest mb-2 text-gray-500 dark:text-slate-400">Initial Price (LKR)</label>
                           <input type="number" defaultValue={editingService?.price || 0} id="modal_service_price" className="w-full border border-gray-300 dark:border-slate-600 rounded-xl p-3 outline-none focus:border-purple-500" />
                       </div>
                       <div>
                           <label className="block text-xs font-bold uppercase tracking-widest mb-2 text-gray-500 dark:text-slate-400">Features (One per line)</label>
                           <textarea defaultValue={editingService?.features?.join('\n') || ''} id="modal_service_features" placeholder="Feature 1&#10;Feature 2" className="w-full border border-gray-300 dark:border-slate-600 rounded-xl p-3 outline-none focus:border-purple-500 min-h-[100px] whitespace-pre" />
                       </div>
                   </div>
                   <div className="flex gap-4 mt-8">
                       <button onClick={() => setShowServiceModal(false)} className="flex-1 py-3 text-gray-500 dark:text-slate-400 font-bold uppercase tracking-widest text-xs hover:bg-gray-50 dark:hover:bg-slate-800 dark:bg-slate-800 rounded-xl transition-colors">Cancel</button>
                       <button 
                          onClick={() => {
                              const t = (document.getElementById('modal_service_title') as HTMLInputElement).value;
                              const d = (document.getElementById('modal_service_desc') as HTMLTextAreaElement).value;
                              const i = (document.getElementById('modal_service_image') as HTMLInputElement).value;
                              const p = Number((document.getElementById('modal_service_price') as HTMLInputElement).value);
                              const f = (document.getElementById('modal_service_features') as HTMLTextAreaElement).value;
                              if (!t) return toast("Title required");
                              
                              const id = editingService ? editingService.id : `s_custom_${Date.now()}`;
                              setServiceConfigs(prev => ({
                                  ...prev,
                                  [id]: {
                                      ...prev[id],
                                      id,
                                      title: t,
                                      description: d,
                                      image: i,
                                      price: p,
                                      isCustom: editingService ? editingService.isCustom : true,
                                      hidden: editingService?.hidden || false,
                                      discountPercentage: editingService?.discountPercentage || 0,
                                      features: f.split('\n').map(x => x.trim()).filter(Boolean)
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

        {serviceToDelete && (
            <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                <div className="bg-white dark:bg-slate-900 rounded-3xl p-8 max-w-sm w-full mx-auto shadow-2xl scale-100 transition-transform">
                    <h3 className="text-xl font-bold mb-4 text-gray-900 dark:text-slate-100">Delete Service?</h3>
                    <p className="text-gray-500 dark:text-slate-400 mb-8">Are you sure you want to delete this custom service? This action cannot be undone.</p>
                    <div className="flex gap-4">
                        <button onClick={() => setServiceToDelete(null)} disabled={loading} className="flex-1 py-3 text-gray-500 dark:text-slate-400 font-bold uppercase tracking-widest text-xs hover:bg-gray-50 dark:hover:bg-slate-800 rounded-xl transition-colors">Cancel</button>
                        <button onClick={confirmDeleteService} disabled={loading} className="flex-1 py-3 bg-rose-600 text-white font-bold uppercase tracking-widest text-xs hover:bg-rose-700 rounded-xl transition-colors disabled:opacity-50 flex justify-center items-center">
                            {loading ? <Loader2 size={16} className="animate-spin" /> : 'Delete'}
                        </button>
                    </div>
                </div>
            </div>
        )}

        </>
    );
};
