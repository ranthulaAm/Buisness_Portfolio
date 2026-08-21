import React, { useState, useEffect } from 'react';
import { listenToBrandCollaborations, BrandCollaboration, createBrandCollaboration, updateBrandCollaboration, deleteBrandCollaboration, uploadCollabFile, CollabServiceLine, PaymentRecord } from '../services/brandCollabService';
import { getServicesConfig } from '../services/dataService';
import { sendPaymentDetailsEmail, sendWhatsAppQuotation } from '../services/emailService';
import { Plus, X, Trash2, Link as LinkIcon, Folder, File, Upload, ChevronRight, DollarSign, Loader2 } from 'lucide-react';
import { toast } from 'react-hot-toast';

export const AdminBrandCollabs: React.FC = () => {
  const [collabs, setCollabs] = useState<BrandCollaboration[]>([]);
  const [servicesConfig, setServicesConfig] = useState<any>({});
  const [loading, setLoading] = useState(true);
  
  const [isCreating, setIsCreating] = useState(false);
  const [selectedCollab, setSelectedCollab] = useState<BrandCollaboration | null>(null);

  // Custom Confirm Modal State
  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm: () => void | Promise<void>;
    confirmText?: string;
    cancelText?: string;
  }>({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: () => {},
  });

  const triggerConfirm = (
    title: string,
    message: string,
    onConfirm: () => void | Promise<void>,
    confirmText = "Delete",
    cancelText = "Cancel"
  ) => {
    setConfirmModal({
      isOpen: true,
      title,
      message,
      onConfirm: async () => {
        try {
          await onConfirm();
        } catch (err) {
          console.error("Confirm action failed:", err);
        }
        setConfirmModal(prev => ({ ...prev, isOpen: false }));
      },
      confirmText,
      cancelText
    });
  };
  
  // New Collab State
  const [brandName, setBrandName] = useState('');
  const [contactEmails, setContactEmails] = useState<string[]>(['']);
  const [whatsappNumbers, setWhatsappNumbers] = useState<string[]>(['']);
  const [newEmail, setNewEmail] = useState('');
  const [newPhone, setNewPhone] = useState('');
  const [billingType, setBillingType] = useState<'one-time' | 'recurring'>('one-time');
  const [billingIntervalDays, setBillingIntervalDays] = useState(30);
  const [collabServices, setCollabServices] = useState<CollabServiceLine[]>([]);
  const [additionalCharges, setAdditionalCharges] = useState<{ name: string, price: number }[]>([]);
  const [manualTotalPrice, setManualTotalPrice] = useState<number | null>(null);

  // File Manager State
  const [currentFolder, setCurrentFolder] = useState<string>('');
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  // Payment Log State
  const [paymentAmount, setPaymentAmount] = useState('');
  const [paymentNote, setPaymentNote] = useState('');

  const getLineTotal = (service: CollabServiceLine) => {
    const base = service.quantity * service.unitPrice;
    const extras = (service.extraCharges || []).reduce((sum, extra) => sum + extra.price, 0);
    return base + extras;
  };

  useEffect(() => {
    getServicesConfig().then(config => {
      setServicesConfig(config);
    });
    const unsubscribe = listenToBrandCollaborations((data) => {
      setCollabs(data);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (selectedCollab && selectedCollab.services) {
      let needsUpdate = false;
      const sanitizedServices = selectedCollab.services.map((s, idx) => {
        if (!s.id) {
          needsUpdate = true;
          return {
            ...s,
            id: `service-${idx}-${Date.now()}`
          };
        }
        return s;
      });

      if (needsUpdate) {
        const updatedCollab = { ...selectedCollab, services: sanitizedServices };
        setSelectedCollab(updatedCollab);
        updateBrandCollaboration(selectedCollab.id, { services: sanitizedServices });
      }
    }
  }, [selectedCollab?.id, selectedCollab?.services]);

  const addServiceLine = (serviceId: string) => {
    const srv = servicesConfig[serviceId];
    if (!srv) return;
    const srvId = Date.now().toString();
    const folderName = `${srv.title} - ${srvId}`;
    setCollabServices([...collabServices, {
      id: srvId,
      serviceId,
      serviceName: srv.title,
      quantity: 1,
      unitPrice: srv.price,
      lineTotal: srv.price,
      status: 'pending',
      folderName,
      accessType: 'public',
      accessValue: ''
    }]);
  };

  const updateServiceLine = (index: number, updates: Partial<CollabServiceLine>) => {
    const newServices = [...collabServices];
    newServices[index] = { ...newServices[index], ...updates };
    newServices[index].lineTotal = getLineTotal(newServices[index]);
    setCollabServices(newServices);
  };

  const addCustomCharge = () => {
    const srvId = Date.now().toString();
    const folderName = `Custom Charge - ${srvId}`;
    setCollabServices([...collabServices, {
      id: srvId,
      serviceId: 'custom',
      serviceName: 'Additional Charge / Custom Service',
      quantity: 1,
      unitPrice: 0,
      lineTotal: 0,
      status: 'pending',
      folderName,
      accessType: 'public',
      accessValue: ''
    }]);
  };

  const calculatedTotal = collabServices.reduce((sum, s) => sum + s.lineTotal, 0) + additionalCharges.reduce((sum, a) => sum + a.price, 0);
  const finalTotal = manualTotalPrice !== null ? manualTotalPrice : calculatedTotal;

  const handleCreate = async () => {
    const validEmails = contactEmails.filter(e => e.trim());
    if (!brandName || validEmails.length === 0) return toast.error("Brand name and at least one email required");
    try {
      const generatedFolders = collabServices.map(s => s.folderName).filter(Boolean) as string[];
      await createBrandCollaboration({
        brandName,
        contactEmail: validEmails[0], // Keep for backwards compat
        whatsappNumber: whatsappNumbers[0] || '',
        contactEmails: validEmails,
        whatsappNumbers: whatsappNumbers.filter(w => w.trim()),
        services: collabServices,
        additionalCharges,
        totalPrice: finalTotal,
        billingType,
        billingIntervalDays: billingType === 'recurring' ? billingIntervalDays : undefined,
        nextBillingDate: billingType === 'recurring' ? Date.now() + billingIntervalDays * 86400000 : undefined,
        status: 'active',
        paymentStatus: 'unpaid',
        paymentHistory: [],
        files: [],
        folders: generatedFolders,
        accessType: 'public',
        accessValue: ''
      });
      toast.success("Collaboration created!");
      setIsCreating(false);
      setBrandName('');
      setContactEmails(['']);
      setWhatsappNumbers(['']);
      setCollabServices([]);
      setAdditionalCharges([]);
    } catch (e) {
      toast.error("Failed to create");
    }
  };

  const handleLogPayment = async () => {
    if (!selectedCollab || !paymentAmount) return;
    const amount = parseFloat(paymentAmount);
    if (isNaN(amount)) return toast.error("Invalid amount");

    const newPayment: PaymentRecord = {
      amount,
      date: Date.now(),
      note: paymentNote
    };

    const newHistory = [...selectedCollab.paymentHistory, newPayment];
    const totalPaid = newHistory.reduce((sum, p) => sum + p.amount, 0);
    
    let newStatus = selectedCollab.paymentStatus;
    if (totalPaid >= selectedCollab.totalPrice) newStatus = 'paid';
    else if (totalPaid > 0) newStatus = 'partial';

    await updateBrandCollaboration(selectedCollab.id, {
      paymentHistory: newHistory,
      paymentStatus: newStatus
    });
    toast.success("Payment logged");
    setPaymentAmount('');
    setPaymentNote('');
    setSelectedCollab({ ...selectedCollab, paymentHistory: newHistory, paymentStatus: newStatus });
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || !e.target.files.length || !selectedCollab) return;
    setUploading(true);
    try {
      const file = e.target.files[0];
      const uploaded = await uploadCollabFile(selectedCollab.id, file, currentFolder || undefined, setUploadProgress);
      const newFiles = [...selectedCollab.files, uploaded];
      await updateBrandCollaboration(selectedCollab.id, { files: newFiles });
      setSelectedCollab({ ...selectedCollab, files: newFiles });
      toast.success("File uploaded");
    } catch (err) {
      toast.error("Upload failed");
    } finally {
      setUploading(false);
      setUploadProgress(0);
    }
  };

  const handleCreateFolder = () => {
    const name = prompt("Folder name:");
    if (!name || !selectedCollab) return;
    const newFolders = [...(selectedCollab.folders || []), name];
    updateBrandCollaboration(selectedCollab.id, { folders: newFolders });
    setSelectedCollab({ ...selectedCollab, folders: newFolders });
  };

  if (loading) return <div>Loading...</div>;

  const totalOutstanding = collabs.reduce((sum, c) => {
    if (c.status !== 'active') return sum;
    const paid = c.paymentHistory.reduce((pSum, p) => pSum + p.amount, 0);
    return sum + Math.max(0, c.totalPrice - paid);
  }, 0);

  const upcomingRecurring = collabs.reduce((sum, c) => {
    if (c.status === 'active' && c.billingType === 'recurring') {
      return sum + c.totalPrice;
    }
    return sum;
  }, 0);

  const formatCurrency = (amount: number) => `LKR ${amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  const handleServiceFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, folderName: string) => {
    if (!e.target.files || !e.target.files.length || !selectedCollab) return;
    setUploading(true);
    try {
      const file = e.target.files[0];
      const uploaded = await uploadCollabFile(selectedCollab.id, file, folderName, setUploadProgress);
      const newFiles = [...selectedCollab.files, uploaded];
      await updateBrandCollaboration(selectedCollab.id, { files: newFiles });
      setSelectedCollab({ ...selectedCollab, files: newFiles });
      toast.success("File uploaded to service folder");
    } catch (err) {
      toast.error("Upload failed");
    } finally {
      setUploading(false);
      setUploadProgress(0);
    }
  };

  if (selectedCollab) {
    const paid = selectedCollab.paymentHistory.reduce((sum, p) => sum + p.amount, 0);
    const owed = Math.max(0, selectedCollab.totalPrice - paid);
    const currentFiles = selectedCollab.files.filter(f => (f.folder || '') === currentFolder);

    return (
      <div className="space-y-6">
        <button onClick={() => setSelectedCollab(null)} className="text-purple-600">&larr; Back to List</button>
        <div className="bg-white p-6 rounded-xl shadow-sm">
          <h2 className="text-2xl font-bold">{selectedCollab.brandName}</h2>
          
          {/* Dynamic Contacts Manager (Emails & WhatsApp) */}
          <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-6 p-4 bg-gray-50 rounded-xl border border-gray-100">
            {/* Emails Section */}
            <div>
              <span className="block text-xs font-bold uppercase tracking-wider text-gray-400 mb-2 font-display">Manage Brand Emails</span>
              <div className="flex flex-wrap gap-2 mb-3">
                {((selectedCollab.contactEmails && selectedCollab.contactEmails.length > 0) ? selectedCollab.contactEmails : (selectedCollab.contactEmail ? [selectedCollab.contactEmail] : [])).map((email, index) => (
                  <span key={index} className="inline-flex items-center gap-1.5 bg-white border border-gray-200 px-2.5 py-1 rounded-lg text-sm shadow-sm">
                    <span className="text-gray-700">{email}</span>
                    <button
                      onClick={async () => {
                        const currentList = selectedCollab.contactEmails || [selectedCollab.contactEmail || ''];
                        const newList = currentList.filter((_, idx) => idx !== index);
                        const updated = {
                          ...selectedCollab,
                          contactEmails: newList,
                          contactEmail: newList[0] || ''
                        };
                        setSelectedCollab(updated);
                        await updateBrandCollaboration(selectedCollab.id, {
                          contactEmails: newList,
                          contactEmail: newList[0] || ''
                        });
                        toast.success("Email removed!");
                      }}
                      className="text-red-400 hover:text-red-600 font-bold text-base leading-none transition-colors"
                      title="Remove Email"
                    >
                      &times;
                    </button>
                  </span>
                ))}
                {(!selectedCollab.contactEmails || selectedCollab.contactEmails.length === 0) && !selectedCollab.contactEmail && (
                  <span className="text-xs text-gray-400">No emails added yet</span>
                )}
              </div>
              <div className="flex gap-2">
                <input
                  type="email"
                  placeholder="Add new email..."
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  className="flex-1 bg-white border border-gray-200 px-3 py-1.5 rounded-lg text-sm focus:outline-none focus:border-blue-500"
                  onKeyDown={async (e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      if (!newEmail.trim()) return;
                      const currentList = selectedCollab.contactEmails || (selectedCollab.contactEmail ? [selectedCollab.contactEmail] : []);
                      if (currentList.includes(newEmail.trim())) return toast.error("Email already exists");
                      const newList = [...currentList, newEmail.trim()];
                      const updated = {
                        ...selectedCollab,
                        contactEmails: newList,
                        contactEmail: newList[0]
                      };
                      setSelectedCollab(updated);
                      await updateBrandCollaboration(selectedCollab.id, {
                        contactEmails: newList,
                        contactEmail: newList[0]
                      });
                      setNewEmail('');
                      toast.success("Email added!");
                    }
                  }}
                />
                <button
                  onClick={async () => {
                    if (!newEmail.trim()) return;
                    const currentList = selectedCollab.contactEmails || (selectedCollab.contactEmail ? [selectedCollab.contactEmail] : []);
                    if (currentList.includes(newEmail.trim())) return toast.error("Email already exists");
                    const newList = [...currentList, newEmail.trim()];
                    const updated = {
                      ...selectedCollab,
                      contactEmails: newList,
                      contactEmail: newList[0]
                    };
                    setSelectedCollab(updated);
                    await updateBrandCollaboration(selectedCollab.id, {
                      contactEmails: newList,
                      contactEmail: newList[0]
                    });
                    setNewEmail('');
                    toast.success("Email added!");
                  }}
                  className="bg-blue-600 text-white px-3 py-1.5 rounded-lg text-sm font-bold hover:bg-blue-700 active:scale-95 transition-all"
                >
                  Add
                </button>
              </div>
            </div>

            {/* WhatsApp Numbers Section */}
            <div>
              <span className="block text-xs font-bold uppercase tracking-wider text-gray-400 mb-2 font-display">Manage WhatsApp Numbers</span>
              <div className="flex flex-wrap gap-2 mb-3">
                {((selectedCollab.whatsappNumbers && selectedCollab.whatsappNumbers.length > 0) ? selectedCollab.whatsappNumbers : (selectedCollab.whatsappNumber ? [selectedCollab.whatsappNumber] : [])).map((num, index) => (
                  <span key={index} className="inline-flex items-center gap-1.5 bg-green-50 border border-green-100 px-2.5 py-1 rounded-lg text-sm shadow-sm">
                    <span className="text-green-800 font-medium">{num}</span>
                    <button
                      onClick={async () => {
                        const currentList = selectedCollab.whatsappNumbers || [selectedCollab.whatsappNumber || ''];
                        const newList = currentList.filter((_, idx) => idx !== index);
                        const updated = {
                          ...selectedCollab,
                          whatsappNumbers: newList,
                          whatsappNumber: newList[0] || ''
                        };
                        setSelectedCollab(updated);
                        await updateBrandCollaboration(selectedCollab.id, {
                          whatsappNumbers: newList,
                          whatsappNumber: newList[0] || ''
                        });
                        toast.success("WhatsApp number removed!");
                      }}
                      className="text-red-400 hover:text-red-600 font-bold text-base leading-none transition-colors"
                      title="Remove WhatsApp"
                    >
                      &times;
                    </button>
                  </span>
                ))}
                {(!selectedCollab.whatsappNumbers || selectedCollab.whatsappNumbers.length === 0) && !selectedCollab.whatsappNumber && (
                  <span className="text-xs text-gray-400">No WhatsApp numbers added yet</span>
                )}
              </div>
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="e.g. +1234567890"
                  value={newPhone}
                  onChange={(e) => setNewPhone(e.target.value)}
                  className="flex-1 bg-white border border-gray-200 px-3 py-1.5 rounded-lg text-sm focus:outline-none focus:border-blue-500"
                  onKeyDown={async (e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      if (!newPhone.trim()) return;
                      const currentList = selectedCollab.whatsappNumbers || (selectedCollab.whatsappNumber ? [selectedCollab.whatsappNumber] : []);
                      if (currentList.includes(newPhone.trim())) return toast.error("Number already exists");
                      const newList = [...currentList, newPhone.trim()];
                      const updated = {
                        ...selectedCollab,
                        whatsappNumbers: newList,
                        whatsappNumber: newList[0]
                      };
                      setSelectedCollab(updated);
                      await updateBrandCollaboration(selectedCollab.id, {
                        whatsappNumbers: newList,
                        whatsappNumber: newList[0]
                      });
                      setNewPhone('');
                      toast.success("WhatsApp number added!");
                    }
                  }}
                />
                <button
                  onClick={async () => {
                    if (!newPhone.trim()) return;
                    const currentList = selectedCollab.whatsappNumbers || (selectedCollab.whatsappNumber ? [selectedCollab.whatsappNumber] : []);
                    if (currentList.includes(newPhone.trim())) return toast.error("Number already exists");
                    const newList = [...currentList, newPhone.trim()];
                    const updated = {
                      ...selectedCollab,
                      whatsappNumbers: newList,
                      whatsappNumber: newList[0]
                    };
                    setSelectedCollab(updated);
                    await updateBrandCollaboration(selectedCollab.id, {
                      whatsappNumbers: newList,
                      whatsappNumber: newList[0]
                    });
                    setNewPhone('');
                    toast.success("WhatsApp number added!");
                  }}
                  className="bg-green-600 text-white px-3 py-1.5 rounded-lg text-sm font-bold hover:bg-green-700 active:scale-95 transition-all"
                >
                  Add
                </button>
              </div>
            </div>
          </div>
          
          <div className="mt-6 flex flex-wrap gap-4">
             <button onClick={() => {
                sendPaymentDetailsEmail(selectedCollab);
                toast.success("Payment details sent to brand emails");
             }} className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg transition-colors shadow-sm text-sm">Send Payment Details (Email)</button>
             
             {((selectedCollab.whatsappNumbers && selectedCollab.whatsappNumbers.length > 0) || selectedCollab.whatsappNumber) && (
               <>
                 <button onClick={() => {
                    const primaryWhatsApp = (selectedCollab.whatsappNumbers && selectedCollab.whatsappNumbers[0]) || selectedCollab.whatsappNumber;
                    if (primaryWhatsApp) {
                      const success = sendWhatsAppQuotation(selectedCollab);
                      if (success) {
                        toast.success("WhatsApp quotation message created!");
                      } else {
                        toast.error("Invalid WhatsApp number");
                      }
                    } else {
                      toast.error("No WhatsApp numbers available for this brand");
                    }
                 }} className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg transition-colors shadow-sm text-sm">
                   Send Quotation (WhatsApp)
                 </button>

                 <button onClick={() => {
                    const url = `${window.location.origin}/share/${selectedCollab.id}`;
                    const msg = `Hi ${selectedCollab.contactName || selectedCollab.brandName}, here are your collaboration details and share links:\n${url}`;
                    const primaryWhatsApp = (selectedCollab.whatsappNumbers && selectedCollab.whatsappNumbers[0]) || selectedCollab.whatsappNumber;
                    if (primaryWhatsApp) {
                      window.open(`https://wa.me/${primaryWhatsApp.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(msg)}`, '_blank');
                    }
                 }} className="px-4 py-2 bg-green-500 hover:bg-green-600 text-white font-bold rounded-lg transition-colors shadow-sm text-sm">Send via WhatsApp</button>
               </>
             )}

             <button onClick={() => {
                const url = `${window.location.origin}/share/${selectedCollab.id}`;
                navigator.clipboard.writeText(url);
                toast.success("Link copied!");
             }} className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 text-gray-700 font-medium transition-colors text-sm">Copy Share Link</button>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm">
          <h3 className="text-xl font-bold mb-4">Services & Deliverables</h3>
          <div className="flex gap-4 mb-4">
            <select onChange={async (e) => {
              const serviceId = e.target.value;
              const srv = servicesConfig[serviceId];
              if (!srv) return;
              const srvId = Date.now().toString();
              const folderName = `${srv.title} - ${srvId}`;
              const newLine: CollabServiceLine = { id: srvId, serviceId, serviceName: srv.title, quantity: 1, unitPrice: srv.price, lineTotal: srv.price, status: 'pending', folderName, accessType: 'public', accessValue: '' };
              const newServices = [...selectedCollab.services, newLine];
              const newTotal = newServices.reduce((sum, s) => sum + s.lineTotal, 0) + (selectedCollab.additionalCharges || []).reduce((sum, c) => sum + c.price, 0);
              const newFolders = [...(selectedCollab.folders || []), folderName];
              await updateBrandCollaboration(selectedCollab.id, { services: newServices, totalPrice: newTotal, folders: newFolders });
              setSelectedCollab({...selectedCollab, services: newServices, totalPrice: newTotal, folders: newFolders});
              e.target.value = '';
            }} defaultValue="" className="border p-2 rounded flex-1">
              <option value="" disabled>Add Catalog Service...</option>
              {Object.keys(servicesConfig).map(k => (
                <option key={k} value={k}>{servicesConfig[k].title}</option>
              ))}
            </select>
            <button onClick={async () => {
              const srvId = Date.now().toString();
              const folderName = `Custom Charge - ${srvId}`;
              const newLine: CollabServiceLine = { id: srvId, serviceId: 'custom', serviceName: 'Custom Charge', quantity: 1, unitPrice: 0, lineTotal: 0, status: 'pending', folderName, accessType: 'public', accessValue: '' };
              const newServices = [...selectedCollab.services, newLine];
              const newTotal = newServices.reduce((sum, s) => sum + s.lineTotal, 0) + (selectedCollab.additionalCharges || []).reduce((sum, c) => sum + c.price, 0);
              const newFolders = [...(selectedCollab.folders || []), folderName];
              await updateBrandCollaboration(selectedCollab.id, { services: newServices, totalPrice: newTotal, folders: newFolders });
              setSelectedCollab({...selectedCollab, services: newServices, totalPrice: newTotal, folders: newFolders});
            }} className="px-4 py-2 border rounded bg-gray-50 hover:bg-gray-100 flex items-center gap-1"><Plus size={16}/> Custom</button>
          </div>
          
          <div className="space-y-4">
            {selectedCollab.services.map((s, i) => (
              <div key={i} className="p-4 border rounded-lg bg-gray-50">
                <div className="flex gap-2 items-center flex-wrap mb-3">
                  {s.serviceId === 'custom' ? (
                    <input type="text" value={s.serviceName} onChange={async (e) => {
                      const newServices = [...selectedCollab.services];
                      newServices[i] = { ...newServices[i], serviceName: e.target.value };
                      setSelectedCollab({...selectedCollab, services: newServices});
                    }} onBlur={() => updateBrandCollaboration(selectedCollab.id, { services: selectedCollab.services })} className="flex-1 border p-1 rounded font-medium" placeholder="Description..." />
                  ) : (
                    <span className="flex-1 font-bold">{s.serviceName}</span>
                  )}
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-gray-500">Qty:</span>
                    <input type="number" value={s.quantity} onChange={async (e) => {
                      const newServices = [...selectedCollab.services];
                      newServices[i] = { ...newServices[i], quantity: parseInt(e.target.value)||0 };
                      newServices[i].lineTotal = getLineTotal(newServices[i]);
                      const newTotal = newServices.reduce((sum, srv) => sum + srv.lineTotal, 0) + (selectedCollab.additionalCharges || []).reduce((s, c) => s + c.price, 0);
                      await updateBrandCollaboration(selectedCollab.id, { services: newServices, totalPrice: newTotal });
                      setSelectedCollab({...selectedCollab, services: newServices, totalPrice: newTotal});
                    }} className="w-16 border p-1 rounded" />
                    
                    <span className="text-sm text-gray-500">Unit LKR:</span>
                    <input type="number" value={s.unitPrice} onChange={async (e) => {
                      const newServices = [...selectedCollab.services];
                      newServices[i] = { ...newServices[i], unitPrice: parseFloat(e.target.value)||0 };
                      newServices[i].lineTotal = getLineTotal(newServices[i]);
                      const newTotal = newServices.reduce((sum, srv) => sum + srv.lineTotal, 0) + (selectedCollab.additionalCharges || []).reduce((s, c) => s + c.price, 0);
                      await updateBrandCollaboration(selectedCollab.id, { services: newServices, totalPrice: newTotal });
                      setSelectedCollab({...selectedCollab, services: newServices, totalPrice: newTotal});
                    }} className="w-24 border p-1 rounded" />
                    
                    <span className="w-32 font-bold text-right">{formatCurrency(s.lineTotal)}</span>
                    <button onClick={() => {
                      triggerConfirm(
                        "Remove Service Line",
                        `Are you sure you want to remove the service "${s.serviceName}"?`,
                        async () => {
                          const newServices = selectedCollab.services.filter((_, idx) => idx !== i);
                          const newTotal = newServices.reduce((sum, srv) => sum + srv.lineTotal, 0) + (selectedCollab.additionalCharges || []).reduce((s, c) => s + c.price, 0);
                          await updateBrandCollaboration(selectedCollab.id, { services: newServices, totalPrice: newTotal });
                          setSelectedCollab({...selectedCollab, services: newServices, totalPrice: newTotal});
                          toast.success("Service line removed");
                        }
                      );
                    }} className="ml-2 text-red-500 p-1 hover:bg-red-50 rounded"><Trash2 size={16}/></button>
                  </div>
                </div>

                <div className="mb-4">
                  <div className="flex justify-between items-center mb-2">
                    <h4 className="text-sm font-bold text-gray-700">Extra Charges</h4>
                    <button onClick={async () => {
                      const newServices = [...selectedCollab.services];
                      const currentExtras = newServices[i].extraCharges || [];
                      newServices[i] = { ...newServices[i], extraCharges: [...currentExtras, { name: '', price: 0 }] };
                      setSelectedCollab({...selectedCollab, services: newServices});
                    }} className="text-xs text-purple-600 font-bold hover:underline">+ Add Extra Charge</button>
                  </div>
                  {(s.extraCharges || []).map((ext, extIdx) => (
                    <div key={extIdx} className="flex gap-2 items-center mt-2 pl-4 border-l-2 border-purple-200">
                      <input type="text" value={ext.name} onChange={e => {
                         const newServices = [...selectedCollab.services];
                         const newExtras = [...(newServices[i].extraCharges || [])];
                         newExtras[extIdx].name = e.target.value;
                         newServices[i].extraCharges = newExtras;
                         setSelectedCollab({...selectedCollab, services: newServices});
                      }} onBlur={async () => {
                         await updateBrandCollaboration(selectedCollab.id, { services: selectedCollab.services });
                      }} placeholder="Charge Name" className="flex-1 text-sm border p-1 rounded" />
                      
                      <span className="text-sm text-gray-500">LKR:</span>
                      <input type="number" value={ext.price} onChange={async (e) => {
                         const newServices = [...selectedCollab.services];
                         const newExtras = [...(newServices[i].extraCharges || [])];
                         newExtras[extIdx].price = parseFloat(e.target.value)||0;
                         newServices[i].extraCharges = newExtras;
                         newServices[i].lineTotal = getLineTotal(newServices[i]);
                         const newTotal = newServices.reduce((sum, srv) => sum + srv.lineTotal, 0) + (selectedCollab.additionalCharges || []).reduce((s, c) => s + c.price, 0);
                         await updateBrandCollaboration(selectedCollab.id, { services: newServices, totalPrice: newTotal });
                         setSelectedCollab({...selectedCollab, services: newServices, totalPrice: newTotal});
                      }} className="w-24 text-sm border p-1 rounded" />
                      
                      <button onClick={() => {
                        triggerConfirm(
                          "Remove Extra Charge",
                          "Are you sure you want to remove this service extra charge?",
                          async () => {
                            const newServices = [...selectedCollab.services];
                            const newExtras = (newServices[i].extraCharges || []).filter((_, idx) => idx !== extIdx);
                            newServices[i].extraCharges = newExtras;
                            newServices[i].lineTotal = getLineTotal(newServices[i]);
                            const newTotal = newServices.reduce((sum, srv) => sum + srv.lineTotal, 0) + (selectedCollab.additionalCharges || []).reduce((s, c) => s + c.price, 0);
                            await updateBrandCollaboration(selectedCollab.id, { services: newServices, totalPrice: newTotal });
                            setSelectedCollab({...selectedCollab, services: newServices, totalPrice: newTotal});
                          }
                        );
                      }} className="text-red-500 hover:bg-red-50 p-1 rounded"><X size={14}/></button>
                    </div>
                  ))}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm mt-2 pt-2 border-t border-gray-200">
                  <div>
                    <label className="block text-gray-500 mb-1">Status</label>
                    <select value={s.status || 'pending'} onChange={(e) => {
                      const newServices = [...selectedCollab.services];
                      newServices[i] = { ...newServices[i], status: e.target.value as any };
                      setSelectedCollab({...selectedCollab, services: newServices});
                      updateBrandCollaboration(selectedCollab.id, { services: newServices });
                    }} className="w-full border p-2 rounded bg-white">
                      <option value="pending">Pending</option>
                      <option value="in_progress">In Progress</option>
                      <option value="review">In Review</option>
                      <option value="completed">Completed</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-gray-500 mb-1">Target Folder</label>
                    <input type="text" disabled value={s.folderName || ''} className="w-full border p-2 rounded bg-gray-100 text-gray-600" />
                  </div>
                  <div>
                    <label className="block text-gray-500 mb-1">Access Type (For this service)</label>
                    <select value={s.accessType || 'public'} onChange={(e) => {
                      const newServices = [...selectedCollab.services];
                      newServices[i] = { ...newServices[i], accessType: e.target.value as any };
                      setSelectedCollab({...selectedCollab, services: newServices});
                      updateBrandCollaboration(selectedCollab.id, { services: newServices });
                    }} className="w-full border p-2 rounded bg-white">
                      <option value="public">Public (Anyone with link)</option>
                      <option value="email">Email Verified</option>
                      <option value="password">Password Protected</option>
                    </select>
                  </div>
                  {(s.accessType === 'email' || s.accessType === 'password') && (
                    <div>
                      <label className="block text-gray-500 mb-1">{s.accessType === 'email' ? 'Allowed Emails (comma separated)' : 'Password'}</label>
                      <input type="text" value={s.accessValue || ''} onChange={(e) => {
                        const newServices = [...selectedCollab.services];
                        newServices[i] = { ...newServices[i], accessValue: e.target.value };
                        setSelectedCollab({...selectedCollab, services: newServices});
                      }} onBlur={() => updateBrandCollaboration(selectedCollab.id, { services: selectedCollab.services })} className="w-full border p-2 rounded bg-white" placeholder={s.accessType === 'email' ? "client@brand.com" : "Enter password"} />
                    </div>
                  )}
                  
                  <div className="md:col-span-2">
                    <label className="block text-gray-500 mb-1">Shared Deliverables / Included Files (e.g. Banners, Flyers)</label>
                    <input type="text" placeholder="e.g. Banners, Flyers, Templates, Social Graphics" value={s.sharedDeliverables || ''} onChange={(e) => {
                      const newServices = [...selectedCollab.services];
                      newServices[i] = { ...newServices[i], sharedDeliverables: e.target.value };
                      setSelectedCollab({...selectedCollab, services: newServices});
                    }} onBlur={() => updateBrandCollaboration(selectedCollab.id, { services: selectedCollab.services })} className="w-full border p-2 rounded bg-white placeholder-gray-400" />
                  </div>

                  <div className="md:col-span-2 flex items-end gap-2">
                    <div className="flex-1">
                      <label className="block text-gray-500 mb-1">Custom Share Link Override (Optional)</label>
                      <input type="text" placeholder="e.g. Figma link or Drive folder" value={s.shareLink || ''} onChange={(e) => {
                        const newServices = [...selectedCollab.services];
                        newServices[i] = { ...newServices[i], shareLink: e.target.value };
                        setSelectedCollab({...selectedCollab, services: newServices});
                      }} onBlur={() => updateBrandCollaboration(selectedCollab.id, { services: selectedCollab.services })} className="w-full border p-2 rounded bg-white" />
                    </div>
                    <button onClick={() => {
                      const url = `${window.location.origin}/share/${selectedCollab.id}?service=${s.id}`;
                      navigator.clipboard.writeText(s.shareLink || url);
                      toast.success("Service link copied!");
                    }} className="px-4 py-2 bg-blue-100 text-blue-700 rounded border border-blue-200 hover:bg-blue-200 whitespace-nowrap">
                      Copy Service Link
                    </button>
                  </div>

                  <div className="md:col-span-2 mt-4 border-t pt-4">
                    <div className="flex justify-between items-center mb-2">
                       <label className="block text-gray-500 font-bold mb-1">Service Files</label>
                       <div className="flex items-center gap-2">
                         {uploading && <span className="text-xs text-gray-500">Uploading... {Math.round(uploadProgress)}%</span>}
                         <label className="px-3 py-1.5 bg-purple-100 text-purple-700 cursor-pointer rounded-md text-xs font-bold flex items-center gap-1">
                           <Upload size={14}/> Upload File
                           <input type="file" className="hidden" onChange={(e) => handleServiceFileUpload(e, s.folderName || '')} />
                         </label>
                       </div>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                       {selectedCollab.files.filter(f => f.folder === s.folderName).map(f => (
                         <div key={f.name} className="p-2 border rounded flex items-center justify-between gap-2 bg-white">
                           <div className="flex items-center gap-2 overflow-hidden">
                              <File className="text-blue-500 flex-shrink-0" size={16} />
                              <span className="truncate text-xs">{f.name}</span>
                           </div>
                           <a href={f.url} target="_blank" rel="noreferrer" className="text-blue-600 text-xs font-bold">View</a>
                         </div>
                       ))}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-xl font-bold">Project Additional Charges</h3>
            <button onClick={async () => {
              const newCharges = [...(selectedCollab.additionalCharges || []), { name: '', price: 0 }];
              setSelectedCollab({ ...selectedCollab, additionalCharges: newCharges });
            }} className="text-sm text-purple-600 font-bold hover:underline">+ Add Project Charge</button>
          </div>
          {(selectedCollab.additionalCharges || []).map((charge, idx) => (
            <div key={idx} className="flex gap-2 items-center mt-2 pl-4 border-l-2 border-purple-400">
              <input type="text" value={charge.name} onChange={e => {
                 const newCharges = [...(selectedCollab.additionalCharges || [])];
                 newCharges[idx].name = e.target.value;
                 setSelectedCollab({ ...selectedCollab, additionalCharges: newCharges });
              }} onBlur={async () => {
                 await updateBrandCollaboration(selectedCollab.id, { additionalCharges: selectedCollab.additionalCharges });
              }} placeholder="Charge Name (e.g. Hosting)" className="flex-1 border p-2 rounded" />
              <span className="text-gray-500">LKR:</span>
              <input type="number" value={charge.price} onChange={async (e) => {
                 const newCharges = [...(selectedCollab.additionalCharges || [])];
                 newCharges[idx].price = parseFloat(e.target.value)||0;
                 const newTotal = selectedCollab.services.reduce((sum, srv) => sum + srv.lineTotal, 0) + newCharges.reduce((sum, c) => sum + c.price, 0);
                 setSelectedCollab({ ...selectedCollab, additionalCharges: newCharges, totalPrice: newTotal });
                 await updateBrandCollaboration(selectedCollab.id, { additionalCharges: newCharges, totalPrice: newTotal });
              }} className="w-32 border p-2 rounded" />
              <button onClick={() => {
                triggerConfirm(
                  "Remove Project Charge",
                  "Are you sure you want to remove this project charge?",
                  async () => {
                    const newCharges = (selectedCollab.additionalCharges || []).filter((_, i) => i !== idx);
                    const newTotal = selectedCollab.services.reduce((sum, srv) => sum + srv.lineTotal, 0) + newCharges.reduce((sum, c) => sum + c.price, 0);
                    setSelectedCollab({ ...selectedCollab, additionalCharges: newCharges, totalPrice: newTotal });
                    await updateBrandCollaboration(selectedCollab.id, { additionalCharges: newCharges, totalPrice: newTotal });
                  }
                );
              }} className="text-red-500 p-2 hover:bg-red-50 rounded"><X size={20}/></button>
            </div>
          ))}
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border-t-4 border-t-blue-500">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-xl font-black text-gray-800">Billing & Payments</h3>
            <button onClick={() => {
              triggerConfirm(
                "Delete Collaboration Project",
                `Are you absolutely sure you want to delete the collaboration with ${selectedCollab.brandName}? This action cannot be undone.`,
                async () => {
                  try {
                    await deleteBrandCollaboration(selectedCollab);
                    toast.success("Collaboration deleted!");
                    setSelectedCollab(null);
                  } catch (e) {
                    toast.error("Failed to delete collaboration");
                  }
                }
              );
            }} className="flex items-center gap-1 text-sm text-red-600 bg-red-50 px-3 py-1.5 rounded-lg hover:bg-red-100 font-bold transition-colors">
              <Trash2 size={16} /> Delete Project
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="bg-gray-50 p-4 rounded-xl border">
              <p className="text-sm font-bold text-gray-500 uppercase">Total Price</p>
              <p className="text-2xl font-black text-gray-900">{formatCurrency(selectedCollab.totalPrice)}</p>
            </div>
            <div className="bg-green-50 p-4 rounded-xl border border-green-100">
              <p className="text-sm font-bold text-green-700 uppercase">Paid Amount</p>
              <p className="text-2xl font-black text-green-600">{formatCurrency(paid)}</p>
            </div>
            <div className={`p-4 rounded-xl border ${owed > 0 ? 'bg-orange-50 border-orange-100' : 'bg-gray-50'}`}>
              <p className={`text-sm font-bold uppercase ${owed > 0 ? 'text-orange-700' : 'text-gray-500'}`}>Amount Owed</p>
              <p className={`text-2xl font-black ${owed > 0 ? 'text-orange-600' : 'text-gray-900'}`}>{formatCurrency(owed)}</p>
            </div>
          </div>

          <div className="bg-gray-50 p-4 rounded-xl border mb-6">
            <h4 className="font-bold text-sm mb-3">Record New Payment</h4>
            <div className="flex flex-wrap gap-2">
              <input type="number" placeholder="Amount (LKR)" value={paymentAmount} onChange={e => setPaymentAmount(e.target.value)} className="border p-2 rounded flex-1 min-w-[150px]" />
              <input type="text" placeholder="Note (e.g. Bank Transfer)" value={paymentNote} onChange={e => setPaymentNote(e.target.value)} className="border p-2 rounded flex-[2] min-w-[200px]" />
              <button onClick={handleLogPayment} className="bg-blue-600 hover:bg-blue-700 text-white font-bold px-6 py-2 rounded transition-colors whitespace-nowrap">Log Payment</button>
            </div>
          </div>

          <div>
             <h4 className="font-bold text-sm mb-3 text-gray-600 font-display">Payment History</h4>
             {selectedCollab.paymentHistory.length === 0 ? (
               <p className="text-gray-400 text-sm italic">No payments recorded yet.</p>
             ) : (
               <div className="overflow-x-auto border border-gray-100 rounded-xl shadow-sm">
                 <table className="w-full text-left border-collapse bg-white">
                   <thead>
                     <tr className="bg-gray-50/50 text-xs font-bold uppercase text-gray-400 border-b">
                       <th className="p-4">Date</th>
                       <th className="p-4">Note / Reference</th>
                       <th className="p-4 text-right">Amount (LKR)</th>
                       <th className="p-4 text-center">Action</th>
                     </tr>
                   </thead>
                   <tbody className="divide-y text-sm">
                     {selectedCollab.paymentHistory.map((p, i) => (
                       <tr key={i} className="hover:bg-gray-50/40 transition-colors">
                         <td className="p-4 text-gray-500 font-medium">{new Date(p.date).toLocaleDateString()}</td>
                         <td className="p-4 text-gray-700 font-semibold">{p.note || 'No note provided'}</td>
                         <td className="p-4 text-right text-emerald-600 font-bold">{formatCurrency(p.amount)}</td>
                         <td className="p-4 text-center">
                           <button
                             onClick={() => {
                               triggerConfirm(
                                 "Remove Payment Record",
                                 `Are you sure you want to remove the payment of ${formatCurrency(p.amount)} recorded on ${new Date(p.date).toLocaleDateString()}?`,
                                 async () => {
                                   const newHistory = selectedCollab.paymentHistory.filter((_, idx) => idx !== i);
                                   let newStatus = selectedCollab.paymentStatus;
                                   const newPaid = newHistory.reduce((sum, pay) => sum + pay.amount, 0);
                                   if (newPaid >= selectedCollab.totalPrice) newStatus = 'paid';
                                   else if (newPaid > 0) newStatus = 'partial';
                                   else newStatus = 'unpaid';
                                   
                                   setSelectedCollab({ ...selectedCollab, paymentHistory: newHistory, paymentStatus: newStatus });
                                   await updateBrandCollaboration(selectedCollab.id, { paymentHistory: newHistory, paymentStatus: newStatus });
                                   toast.success("Payment removed");
                                 }
                               );
                             }}
                             className="text-red-400 hover:text-red-600 hover:bg-red-50 p-2 rounded-xl transition-all"
                             title="Delete Payment"
                           >
                             <Trash2 size={16} />
                           </button>
                         </td>
                       </tr>
                     ))}
                   </tbody>
                 </table>
               </div>
             )}
          </div>
        </div>
        {confirmModal.isOpen && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in">
            <div className="bg-white dark:bg-zinc-800 rounded-2xl max-w-sm w-full p-6 shadow-2xl border border-gray-100 dark:border-zinc-700 transform scale-100 transition-all duration-200">
              <h3 className="text-lg font-black text-gray-900 dark:text-white mb-2">{confirmModal.title}</h3>
              <p className="text-gray-500 dark:text-gray-400 text-sm mb-6 leading-relaxed">{confirmModal.message}</p>
              <div className="flex gap-3 justify-end">
                <button
                  type="button"
                  onClick={() => setConfirmModal(prev => ({ ...prev, isOpen: false }))}
                  className="px-4 py-2 text-sm font-semibold text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-zinc-700 rounded-xl transition-colors"
                >
                  {confirmModal.cancelText || 'Cancel'}
                </button>
                <button
                  type="button"
                  onClick={async () => {
                    try {
                      await confirmModal.onConfirm();
                    } catch (err) {
                      console.error(err);
                    }
                  }}
                  className="px-4 py-2 text-sm font-semibold text-white bg-red-600 hover:bg-red-700 active:scale-[0.96] rounded-xl shadow-md transition-all"
                >
                  {confirmModal.confirmText || 'Delete'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  if (isCreating) {
    return (
      <div className="bg-white p-6 rounded-xl shadow-sm space-y-4">
        <h2 className="text-2xl font-bold">New Brand Collaboration</h2>
        <input placeholder="Brand Name" value={brandName} onChange={e=>setBrandName(e.target.value)} className="w-full border p-2 rounded" />
        
        <div className="space-y-2">
          <label className="text-sm font-bold text-gray-700">Contact Emails</label>
          {contactEmails.map((email, i) => (
            <div key={i} className="flex gap-2">
              <input placeholder="Contact Email" value={email} onChange={e => {
                const newEmails = [...contactEmails];
                newEmails[i] = e.target.value;
                setContactEmails(newEmails);
              }} className="flex-1 border p-2 rounded" />
              {contactEmails.length > 1 && (
                <button onClick={() => setContactEmails(contactEmails.filter((_, idx) => idx !== i))} className="text-red-500"><X size={20}/></button>
              )}
            </div>
          ))}
          <button onClick={() => setContactEmails([...contactEmails, ''])} className="text-purple-600 text-sm font-medium hover:underline">+ Add another email</button>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-bold text-gray-700">WhatsApp Numbers</label>
          {whatsappNumbers.map((num, i) => (
            <div key={i} className="flex gap-2">
              <input placeholder="WhatsApp Number (e.g. +1234567890)" value={num} onChange={e => {
                const newNums = [...whatsappNumbers];
                newNums[i] = e.target.value;
                setWhatsappNumbers(newNums);
              }} className="flex-1 border p-2 rounded" />
              {whatsappNumbers.length > 1 && (
                <button onClick={() => setWhatsappNumbers(whatsappNumbers.filter((_, idx) => idx !== i))} className="text-red-500"><X size={20}/></button>
              )}
            </div>
          ))}
          <button onClick={() => setWhatsappNumbers([...whatsappNumbers, ''])} className="text-purple-600 text-sm font-medium hover:underline">+ Add another WhatsApp</button>
        </div>
        
        <div className="flex gap-4">
          <select onChange={e => addServiceLine(e.target.value)} value="" className="border p-2 rounded flex-1">
            <option value="" disabled>Add Catalog Service...</option>
            {Object.keys(servicesConfig).map(k => (
              <option key={k} value={k}>{servicesConfig[k].title}</option>
            ))}
          </select>
          <button onClick={addCustomCharge} className="px-4 py-2 border rounded bg-gray-50 hover:bg-gray-100 flex items-center gap-1"><Plus size={16}/> Custom Charge</button>
        </div>
        
        {collabServices.map((s, i) => (
          <div key={i} className="flex flex-col gap-2 p-4 border rounded-lg bg-gray-50">
            <div className="flex gap-2 items-center flex-wrap">
              {s.serviceId === 'custom' ? (
                <input type="text" value={s.serviceName} onChange={e => updateServiceLine(i, { serviceName: e.target.value })} className="flex-1 border p-1 rounded" placeholder="Description..." />
              ) : (
                <span className="flex-1 font-medium">{s.serviceName}</span>
              )}
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-500">Qty:</span>
                <input type="number" value={s.quantity} onChange={e => updateServiceLine(i, { quantity: parseInt(e.target.value)||0 })} className="w-20 border p-1 rounded" />
                <span className="text-sm text-gray-500">Unit LKR:</span>
                <input type="number" value={s.unitPrice} onChange={e => updateServiceLine(i, { unitPrice: parseFloat(e.target.value)||0 })} className="w-24 border p-1 rounded" />
                <span className="w-28 font-bold text-right">{formatCurrency(s.lineTotal)}</span>
                <button onClick={() => setCollabServices(collabServices.filter((_, idx)=>idx!==i))} className="ml-2 text-red-500"><X size={16} /></button>
              </div>
            </div>
            
            <div className="mt-2">
              <div className="flex justify-between items-center mb-1">
                <span className="text-sm font-bold text-gray-700">Extra Charges</span>
                <button onClick={() => {
                  const newExtras = [...(s.extraCharges || []), { name: '', price: 0 }];
                  updateServiceLine(i, { extraCharges: newExtras });
                }} className="text-xs text-purple-600 font-bold hover:underline">+ Add Extra Charge</button>
              </div>
              {(s.extraCharges || []).map((ext, extIdx) => (
                <div key={extIdx} className="flex gap-2 items-center mt-1 pl-4 border-l-2 border-purple-200">
                  <input type="text" value={ext.name} onChange={e => {
                     const newExtras = [...(s.extraCharges || [])];
                     newExtras[extIdx].name = e.target.value;
                     updateServiceLine(i, { extraCharges: newExtras });
                  }} placeholder="Charge Name" className="flex-1 text-sm border p-1 rounded" />
                  <span className="text-sm text-gray-500">LKR:</span>
                  <input type="number" value={ext.price} onChange={e => {
                     const newExtras = [...(s.extraCharges || [])];
                     newExtras[extIdx].price = parseFloat(e.target.value)||0;
                     updateServiceLine(i, { extraCharges: newExtras });
                  }} className="w-24 text-sm border p-1 rounded" />
                  <button onClick={() => {
                     const newExtras = (s.extraCharges || []).filter((_, idx) => idx !== extIdx);
                     updateServiceLine(i, { extraCharges: newExtras });
                  }} className="text-red-500"><X size={14}/></button>
                </div>
              ))}
            </div>
            
            <input type="text" placeholder="Share Link (optional)" value={s.shareLink || ''} onChange={e => updateServiceLine(i, { shareLink: e.target.value })} className="w-full border p-1 rounded text-sm text-blue-600 mt-2" />
            <input type="text" placeholder="Included Files / Shared Deliverables (e.g. Banners, Flyers)" value={s.sharedDeliverables || ''} onChange={e => updateServiceLine(i, { sharedDeliverables: e.target.value })} className="w-full border p-1 rounded text-sm text-purple-600 mt-1" />
          </div>
        ))}

        <div className="flex gap-4 items-center mt-4">
          <label>Billing Type:</label>
          <select value={billingType} onChange={e => setBillingType(e.target.value as 'one-time'|'recurring')} className="border p-2 rounded">
            <option value="one-time">One-time</option>
            <option value="recurring">Recurring</option>
          </select>
        </div>

        {billingType === 'recurring' && (
          <div className="flex gap-4 items-center">
            <label>Interval (Days):</label>
            <input type="number" value={billingIntervalDays} onChange={e => setBillingIntervalDays(parseInt(e.target.value)||30)} className="border p-2 rounded" />
          </div>
        )}

        <div className="mt-6">
          <div className="flex justify-between items-center mb-2">
            <h3 className="font-bold text-gray-700">Project Additional Charges</h3>
            <button onClick={() => setAdditionalCharges([...additionalCharges, { name: '', price: 0 }])} className="text-sm text-purple-600 font-bold hover:underline">+ Add Project Charge</button>
          </div>
          {additionalCharges.map((charge, idx) => (
            <div key={idx} className="flex gap-2 items-center mt-2 pl-4 border-l-2 border-purple-400">
              <input type="text" value={charge.name} onChange={e => {
                 const newCharges = [...additionalCharges];
                 newCharges[idx].name = e.target.value;
                 setAdditionalCharges(newCharges);
              }} placeholder="Charge Name (e.g. Hosting)" className="flex-1 border p-2 rounded" />
              <span className="text-gray-500">LKR:</span>
              <input type="number" value={charge.price} onChange={e => {
                 const newCharges = [...additionalCharges];
                 newCharges[idx].price = parseFloat(e.target.value)||0;
                 setAdditionalCharges(newCharges);
              }} className="w-32 border p-2 rounded" />
              <button onClick={() => {
                triggerConfirm(
                  "Remove Charge",
                  "Are you sure you want to remove this project charge?",
                  () => {
                    setAdditionalCharges(additionalCharges.filter((_, i) => i !== idx));
                  }
                );
              }} className="text-red-500 p-2"><X size={20}/></button>
            </div>
          ))}
        </div>

        <div className="pt-6 border-t">
          <p className="font-bold text-lg">Calculated Total: {formatCurrency(calculatedTotal)}</p>
          <input type="number" placeholder="Override Total Price" value={manualTotalPrice || ''} onChange={e => setManualTotalPrice(parseFloat(e.target.value) || null)} className="border p-2 rounded mt-2 w-full max-w-xs" />
        </div>

        <div className="flex gap-4">
          <button onClick={handleCreate} className="px-6 py-2 bg-purple-600 text-white rounded">Save</button>
          <button onClick={() => setIsCreating(false)} className="px-6 py-2 border rounded">Cancel</button>
        </div>
        {confirmModal.isOpen && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in">
            <div className="bg-white dark:bg-zinc-800 rounded-2xl max-w-sm w-full p-6 shadow-2xl border border-gray-100 dark:border-zinc-700 transform scale-100 transition-all duration-200">
              <h3 className="text-lg font-black text-gray-900 dark:text-white mb-2">{confirmModal.title}</h3>
              <p className="text-gray-500 dark:text-gray-400 text-sm mb-6 leading-relaxed">{confirmModal.message}</p>
              <div className="flex gap-3 justify-end">
                <button
                  type="button"
                  onClick={() => setConfirmModal(prev => ({ ...prev, isOpen: false }))}
                  className="px-4 py-2 text-sm font-semibold text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-zinc-700 rounded-xl transition-colors"
                >
                  {confirmModal.cancelText || 'Cancel'}
                </button>
                <button
                  type="button"
                  onClick={async () => {
                    try {
                      await confirmModal.onConfirm();
                    } catch (err) {
                      console.error(err);
                    }
                  }}
                  className="px-4 py-2 text-sm font-semibold text-white bg-red-600 hover:bg-red-700 active:scale-[0.96] rounded-xl shadow-md transition-all"
                >
                  {confirmModal.confirmText || 'Delete'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-purple-100 flex flex-col items-start">
          <h3 className="text-gray-500 text-sm font-bold uppercase mb-2">Total Outstanding</h3>
          <p className="text-3xl font-black text-purple-600">{formatCurrency(totalOutstanding)}</p>
          <p className="text-sm text-gray-400 mt-2">Across all active projects</p>
        </div>
        <div className="bg-white p-6 rounded-xl shadow-sm border border-blue-100 flex flex-col items-start">
          <h3 className="text-gray-500 text-sm font-bold uppercase mb-2">Upcoming Recurring</h3>
          <p className="text-3xl font-black text-blue-600">{formatCurrency(upcomingRecurring)}</p>
          <p className="text-sm text-gray-400 mt-2">From active recurring deals</p>
        </div>
      </div>

      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Brand Collaborations</h2>
        <button onClick={() => setIsCreating(true)} className="px-4 py-2 bg-purple-600 text-white rounded-lg flex items-center gap-2">
          <Plus size={16} /> New Collab
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-gray-50">
            <tr>
              <th className="p-4 font-bold text-gray-500 text-sm">Brand</th>
              <th className="p-4 font-bold text-gray-500 text-sm">Status</th>
              <th className="p-4 font-bold text-gray-500 text-sm">Billing</th>
              <th className="p-4 font-bold text-gray-500 text-sm">Total</th>
              <th className="p-4 font-bold text-gray-500 text-sm text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {collabs.map(c => (
              <tr key={c.id} onClick={() => setSelectedCollab(c)} className="border-t hover:bg-gray-50 cursor-pointer">
                <td className="p-4 font-bold">{c.brandName}</td>
                <td className="p-4"><span className="px-2 py-1 text-xs rounded-full bg-blue-100 text-blue-700">{c.paymentStatus}</span></td>
                <td className="p-4">{c.billingType}</td>
                <td className="p-4">{formatCurrency(c.totalPrice)}</td>
                <td className="p-4 text-right">
                  <button onClick={(e) => {
                    e.stopPropagation();
                    triggerConfirm(
                      "Delete Collaboration Project",
                      `Are you absolutely sure you want to delete the collaboration with ${c.brandName}? This action cannot be undone.`,
                      async () => {
                        try {
                          await deleteBrandCollaboration(c);
                          toast.success("Collaboration deleted!");
                          if (selectedCollab?.id === c.id) {
                            setSelectedCollab(null);
                          }
                        } catch (err) {
                          toast.error("Failed to delete collaboration");
                        }
                      }
                    );
                  }} className="text-red-500 hover:text-red-700 p-2 hover:bg-red-50 rounded transition-colors" title="Delete Collaboration">
                    <Trash2 size={16} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {confirmModal.isOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white dark:bg-zinc-800 rounded-2xl max-w-sm w-full p-6 shadow-2xl border border-gray-100 dark:border-zinc-700 transform scale-100 transition-all duration-200 text-left">
            <h3 className="text-lg font-black text-gray-900 dark:text-white mb-2">{confirmModal.title}</h3>
            <p className="text-gray-500 dark:text-gray-400 text-sm mb-6 leading-relaxed">{confirmModal.message}</p>
            <div className="flex gap-3 justify-end">
              <button
                type="button"
                onClick={() => setConfirmModal(prev => ({ ...prev, isOpen: false }))}
                className="px-4 py-2 text-sm font-semibold text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-zinc-700 rounded-xl transition-colors"
              >
                {confirmModal.cancelText || 'Cancel'}
              </button>
              <button
                type="button"
                onClick={async () => {
                  try {
                    await confirmModal.onConfirm();
                  } catch (err) {
                    console.error(err);
                  }
                }}
                className="px-4 py-2 text-sm font-semibold text-white bg-red-600 hover:bg-red-700 active:scale-[0.96] rounded-xl shadow-md transition-all"
              >
                {confirmModal.confirmText || 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
