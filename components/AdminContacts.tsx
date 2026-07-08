import React, { useState, useEffect } from 'react';
import { getContacts, deleteContact, updateContact, ContactMessage, getServicesConfig } from '../services/dataService';
import { Loader2, Trash2, Mail, CheckCircle, PlusCircle, X, Paperclip } from 'lucide-react';
import { saveOrder, generateOrderId } from '../services/storageService';
import { uploadFile } from '../services/fileUploadService';
import { SERVICES } from '../constants';
import { OrderStatus } from '../types';
import { ConfirmModal } from './ConfirmModal';

import { AdminFooterSettings } from './AdminFooterSettings';

export const AdminContacts: React.FC = () => {
    const [contacts, setContacts] = useState<ContactMessage[]>([]);
    const [loading, setLoading] = useState(true);
    const [orderModalOpen, setOrderModalOpen] = useState(false);
    const [selectedContact, setSelectedContact] = useState<ContactMessage | null>(null);
    const [submittingOrder, setSubmittingOrder] = useState(false);
    const [contactToDelete, setContactToDelete] = useState<{ id: string, idx: number } | null>(null);

    // Order form state
    const [serviceId, setServiceId] = useState(SERVICES[0].id);
    const [requirements, setRequirements] = useState('');
    const [price, setPrice] = useState('0');
    const [files, setFiles] = useState<File[]>([]);
    const [servicePrices, setServicePrices] = useState<Record<string, number>>({});

    useEffect(() => {
        loadData();
        getServicesConfig().then(configs => {
            const prices: Record<string, number> = {};
            SERVICES.forEach(s => {
                prices[s.id] = configs[s.id]?.price || s.price;
            });
            setServicePrices(prices);
        }).catch(console.error);
    }, []);

    const loadData = async () => {
        setLoading(true);
        try {
            const data = await getContacts();
            setContacts(data);
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    const confirmDelete = async () => {
        if (!contactToDelete) return;
        const { id, idx } = contactToDelete;
        setContactToDelete(null);
        try {
            await deleteContact(id);
            setContacts(contacts.filter((_, i) => i !== idx));
        } catch (e) {
            console.error(e);
        }
    };

    const handleDelete = (id: string, idx: number) => {
        setContactToDelete({ id, idx });
    };

    const markAsRead = async (id: string, idx: number) => {
        try {
            await updateContact(id, { isRead: true });
            const newContacts = [...contacts];
            newContacts[idx].isRead = true;
            setContacts(newContacts);
        } catch (e) {
            console.error(e);
        }
    };

    const openOrderModal = (c: ContactMessage) => {
        setSelectedContact(c);
        setRequirements(c.message || '');
        setServiceId(SERVICES[0].id);
        setPrice(String(servicePrices[SERVICES[0].id] || SERVICES[0].price));
        setFiles([]);
        setOrderModalOpen(true);
    };

    const handleServiceChange = (id: string) => {
        setServiceId(id);
        setPrice(String(servicePrices[id] || SERVICES.find(s => s.id === id)?.price || 0));
    };

    const submitOrder = async () => {
        if (!selectedContact) return;
        
        const MAX_SIZE_MB = 1000;
        const BLOCKED_TYPES = ["application/x-msdownload", "application/x-sh", "application/x-bat", "application/x-executable"];
        
        for (const file of files) {
            if (file.size > MAX_SIZE_MB * 1024 * 1024) {
                alert(`File ${file.name} exceeds ${MAX_SIZE_MB}MB limit.`);
                return;
            }
            if (BLOCKED_TYPES.includes(file.type) || file.name.match(/\.(exe|bat|sh|cmd)$/i)) {
                alert(`File ${file.name} has an unsupported file type.`);
                return;
            }
        }

        setSubmittingOrder(true);
        const orderId = generateOrderId();
        
        try {
            const uploadedFiles = [];
            for (const file of files) {
                const path = `manual_orders/${orderId}/${file.name}`;
                const url = await uploadFile(file, path);
                uploadedFiles.push({ name: file.name, type: file.type || "application/octet-stream", data: url });
            }

            const chosenService = SERVICES.find(s => s.id === serviceId) || SERVICES[0];

            await saveOrder({
                id: orderId,
                clientId: selectedContact.clientId || `manual_${Date.now()}`,
                clientName: selectedContact.name,
                email: selectedContact.email || '',
                mobile: selectedContact.whatsapp || '',
                serviceType: chosenService.title,
                serviceId: chosenService.id,
                industry: 'Manual Order',
                targetAudience: 'Manual Order',
                requirements: requirements,
                competitors: '',
                keywords: '',
                avoid: '',
                colorPalette: [],
                files: uploadedFiles,
                voiceClips: [],
                status: OrderStatus.PENDING,
                estimatedCompletion: 'TBD',
                createdAt: new Date().toISOString(),
                price: Number(price)
            });

            if (selectedContact.id) {
                await markAsRead(selectedContact.id, contacts.findIndex(c => c.id === selectedContact.id));
            }

            alert("Order created successfully!");
            setOrderModalOpen(false);
        } catch (e) {
            console.error(e);
            alert("Error creating order.");
        } finally {
            setSubmittingOrder(false);
        }
    };

    return (
        <div className="space-y-8 pb-12">
            <AdminFooterSettings />
            
            <div className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-xl shadow-sm p-6 max-w-4xl mx-auto relative">
                <ConfirmModal 
                isOpen={contactToDelete !== null}
                title="Delete Contact Message"
                message="Are you sure you want to delete this message? This action is permanent."
                confirmText="Yes, Delete Forever"
                onConfirm={confirmDelete}
                onCancel={() => setContactToDelete(null)}
            />
            <h3 className="text-lg font-bold text-gray-900 dark:text-slate-100 mb-6 flex items-center gap-2">
                <Mail className="text-blue-600" size={20} /> Messages & Contacts
            </h3>

            {loading ? (
                <div className="flex justify-center py-12"><Loader2 className="animate-spin text-gray-400" size={32} /></div>
            ) : contacts.length === 0 ? (
                <div className="text-center text-gray-400 py-12 text-sm italic">No messages found.</div>
            ) : (
                <div className="space-y-4">
                    {contacts.map((c, i) => (
                        <div key={c.id || i} className={`border p-5 rounded-xl flex gap-4 \${c.isRead ? 'bg-white dark:bg-slate-900 border-gray-200 dark:border-slate-700' : 'bg-blue-50/30 border-blue-200 shadow-sm'}`}>
                            <div className="flex-1">
                                <div className="flex items-center justify-between mb-2">
                                    <div className="flex items-center gap-3">
                                        <h4 className={`font-bold \${c.isRead ? 'text-gray-900 dark:text-slate-100' : 'text-blue-900'}`}>{c.name}</h4>
                                        <a href={`mailto:\${c.email}`} className="text-xs font-mono text-gray-500 dark:text-slate-400 hover:text-blue-600 bg-gray-100 dark:bg-slate-800 px-2 py-0.5 rounded transition-colors">{c.email}</a>
                                        {c.whatsapp && (
                                            <a href={`https://wa.me/${c.whatsapp.replace(/\D/g,'')}`} target="_blank" rel="noreferrer" className="text-xs font-mono text-green-600 hover:text-green-700 bg-green-50 px-2 py-0.5 rounded transition-colors">
                                                {c.whatsapp}
                                            </a>
                                        )}
                                    </div>
                                    <span className="text-[10px] uppercase font-bold text-gray-400 tracking-wider">
                                        {new Date(c.createdAt).toLocaleDateString()}
                                    </span>
                                </div>
                                <p className="text-sm text-gray-700 dark:text-slate-300 whitespace-pre-wrap">{c.message}</p>
                            </div>
                            <div className="flex flex-col gap-2 shrink-0">
                                <button onClick={() => openOrderModal(c)} className="bg-purple-100 text-purple-700 p-2 rounded-lg hover:bg-purple-200 transition flex items-center justify-center" title="Place Order">
                                    <PlusCircle size={16} />
                                </button>
                                {!c.isRead && c.id && (
                                    <button onClick={() => markAsRead(c.id!, i)} className="bg-blue-100 text-blue-700 p-2 rounded-lg hover:bg-blue-200 transition flex items-center justify-center" title="Mark as Read">
                                        <CheckCircle size={16} />
                                    </button>
                                )}
                                {c.id && (
                                    <button onClick={() => handleDelete(c.id!, i)} className="text-gray-400 hover:text-red-500 hover:bg-red-50 p-2 rounded-lg transition flex items-center justify-center" title="Delete">
                                        <Trash2 size={16} />
                                    </button>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Order Modal */}
            {orderModalOpen && selectedContact && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
                    <div className="bg-white dark:bg-slate-900 rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto p-6 relative">
                        <button onClick={() => setOrderModalOpen(false)} className="absolute top-4 right-4 text-gray-400 hover:text-gray-900 dark:text-slate-100">
                            <X size={24} />
                        </button>
                        <h2 className="text-2xl font-bold text-gray-900 dark:text-slate-100 mb-6">Create Order</h2>
                        
                        <div className="space-y-4">
                            <div>
                                <label className="block text-xs font-bold uppercase text-gray-500 dark:text-slate-400 mb-1">Client Name</label>
                                <input type="text" value={selectedContact.name} readOnly className="w-full border border-gray-200 dark:border-slate-700 rounded-lg px-3 py-2 bg-gray-50 dark:bg-slate-800" />
                            </div>
                            
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-bold uppercase text-gray-500 dark:text-slate-400 mb-1">Client Email</label>
                                    <input type="text" value={selectedContact.email || ''} readOnly className="w-full border border-gray-200 dark:border-slate-700 rounded-lg px-3 py-2 bg-gray-50 dark:bg-slate-800" />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold uppercase text-gray-500 dark:text-slate-400 mb-1">WhatsApp</label>
                                    <input type="text" value={selectedContact.whatsapp || ''} readOnly className="w-full border border-gray-200 dark:border-slate-700 rounded-lg px-3 py-2 bg-gray-50 dark:bg-slate-800" />
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-bold uppercase text-gray-500 dark:text-slate-400 mb-1">Service Type</label>
                                <select 
                                    value={serviceId} 
                                    onChange={(e) => handleServiceChange(e.target.value)}
                                    className="w-full border border-gray-200 dark:border-slate-700 rounded-lg px-3 py-2 outline-none focus:border-blue-500"
                                >
                                    {SERVICES.map(s => (
                                        <option key={s.id} value={s.id}>{s.title}</option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label className="block text-xs font-bold uppercase text-gray-500 dark:text-slate-400 mb-1">Order Requirements</label>
                                <textarea 
                                    value={requirements} 
                                    onChange={(e) => setRequirements(e.target.value)}
                                    className="w-full border border-gray-200 dark:border-slate-700 rounded-lg px-3 py-2 outline-none focus:border-blue-500 min-h-[100px]"
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-bold uppercase text-gray-500 dark:text-slate-400 mb-1">Quoted Price (LKR)</label>
                                <input 
                                    type="number" 
                                    value={price} 
                                    onChange={(e) => setPrice(e.target.value)}
                                    className="w-full border border-gray-200 dark:border-slate-700 rounded-lg px-3 py-2 outline-none focus:border-blue-500"
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-bold uppercase text-gray-500 dark:text-slate-400 mb-2">Project Files (Manual Upload)</label>
                                <div className="border border-dashed border-gray-300 dark:border-slate-600 rounded-xl p-6 text-center bg-gray-50 dark:bg-slate-800">
                                    <input 
                                        type="file" 
                                        multiple 
                                        onChange={(e) => setFiles(Array.from(e.target.files || []))}
                                        className="hidden" 
                                        id="file-upload" 
                                    />
                                    <label htmlFor="file-upload" className="cursor-pointer flex flex-col items-center justify-center gap-2">
                                        <Paperclip size={24} className="text-blue-500" />
                                        <span className="text-sm font-semibold text-blue-600">Select Files</span>
                                        <span className="text-xs text-gray-400">Attach client assets directly to this order</span>
                                    </label>
                                </div>
                                {files.length > 0 && (
                                    <ul className="mt-2 space-y-1">
                                        {files.map((file, i) => (
                                            <li key={i} className="text-xs text-gray-600 dark:text-slate-400 flex items-center justify-between bg-white dark:bg-slate-900 p-2 border border-gray-100 dark:border-slate-700 rounded">
                                                <span className="truncate max-w-[200px]">{file.name}</span>
                                                <span className="text-gray-400">{(file.size / 1024 / 1024).toFixed(2)} MB</span>
                                            </li>
                                        ))}
                                    </ul>
                                )}
                            </div>

                            <button 
                                onClick={submitOrder} 
                                disabled={submittingOrder}
                                className="w-full mt-4 bg-blue-600 text-white font-bold py-3 rounded-xl hover:bg-blue-700 transition flex items-center justify-center gap-2 disabled:opacity-50"
                            >
                                {submittingOrder ? <Loader2 size={20} className="animate-spin" /> : <PlusCircle size={20} />}
                                {submittingOrder ? 'Creating Order...' : 'Create Order Now'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
        </div>
    );
}
