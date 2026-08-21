import React, { useState, useEffect } from 'react';
import { listenToBrandCollaborations, BrandCollaboration, createBrandCollaboration, updateBrandCollaboration, deleteBrandCollaboration, uploadCollabFile, CollabServiceLine, PaymentRecord } from '../services/brandCollabService';
import { getServicesConfig } from '../services/dataService';
import { sendPaymentDetailsEmail } from '../services/emailService';
import { Plus, X, Trash2, Link as LinkIcon, Folder, File, Upload, ChevronRight, DollarSign, Loader2 } from 'lucide-react';
import { toast } from 'react-hot-toast';

export const AdminBrandCollabs: React.FC = () => {
  const [collabs, setCollabs] = useState<BrandCollaboration[]>([]);
  const [servicesConfig, setServicesConfig] = useState<any>({});
  const [loading, setLoading] = useState(true);
  
  const [isCreating, setIsCreating] = useState(false);
  const [selectedCollab, setSelectedCollab] = useState<BrandCollaboration | null>(null);
  
  // New Collab State
  const [brandName, setBrandName] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [whatsappNumber, setWhatsappNumber] = useState('');
  const [billingType, setBillingType] = useState<'one-time' | 'recurring'>('one-time');
  const [billingIntervalDays, setBillingIntervalDays] = useState(30);
  const [collabServices, setCollabServices] = useState<CollabServiceLine[]>([]);
  const [manualTotalPrice, setManualTotalPrice] = useState<number | null>(null);

  // File Manager State
  const [currentFolder, setCurrentFolder] = useState<string>('');
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  // Payment Log State
  const [paymentAmount, setPaymentAmount] = useState('');
  const [paymentNote, setPaymentNote] = useState('');

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

  const addServiceLine = (serviceId: string) => {
    const srv = servicesConfig[serviceId];
    if (!srv) return;
    setCollabServices([...collabServices, {
      serviceId,
      serviceName: srv.title,
      quantity: 1,
      unitPrice: srv.price,
      lineTotal: srv.price
    }]);
  };

  const updateServiceLine = (index: number, updates: Partial<CollabServiceLine>) => {
    const newServices = [...collabServices];
    newServices[index] = { ...newServices[index], ...updates };
    newServices[index].lineTotal = newServices[index].quantity * newServices[index].unitPrice;
    setCollabServices(newServices);
  };

  const addCustomCharge = () => {
    setCollabServices([...collabServices, {
      serviceId: 'custom',
      serviceName: 'Additional Charge / Custom Service',
      quantity: 1,
      unitPrice: 0,
      lineTotal: 0
    }]);
  };

  const calculatedTotal = collabServices.reduce((sum, s) => sum + s.lineTotal, 0);
  const finalTotal = manualTotalPrice !== null ? manualTotalPrice : calculatedTotal;

  const handleCreate = async () => {
    if (!brandName || !contactEmail) return toast.error("Brand name and email required");
    try {
      await createBrandCollaboration({
        brandName,
        contactEmail,
        whatsappNumber,
        services: collabServices,
        totalPrice: finalTotal,
        billingType,
        billingIntervalDays: billingType === 'recurring' ? billingIntervalDays : undefined,
        nextBillingDate: billingType === 'recurring' ? Date.now() + billingIntervalDays * 86400000 : undefined,
        status: 'active',
        paymentStatus: 'unpaid',
        paymentHistory: [],
        files: [],
        folders: [],
        accessType: 'public',
        accessValue: ''
      });
      toast.success("Collaboration created!");
      setIsCreating(false);
      setBrandName('');
      setContactEmail('');
      setCollabServices([]);
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

  if (selectedCollab) {
    const paid = selectedCollab.paymentHistory.reduce((sum, p) => sum + p.amount, 0);
    const owed = Math.max(0, selectedCollab.totalPrice - paid);
    const currentFiles = selectedCollab.files.filter(f => (f.folder || '') === currentFolder);

    return (
      <div className="space-y-6">
        <button onClick={() => setSelectedCollab(null)} className="text-purple-600">&larr; Back to List</button>
        <div className="bg-white p-6 rounded-xl shadow-sm">
          <h2 className="text-2xl font-bold">{selectedCollab.brandName}</h2>
          <p className="text-gray-500">{selectedCollab.contactEmail}</p>
          {selectedCollab.whatsappNumber && <p className="text-gray-500">WhatsApp: {selectedCollab.whatsappNumber}</p>}
          
          <div className="mt-6 flex flex-wrap gap-4">
             <button onClick={() => {
                sendPaymentDetailsEmail(selectedCollab);
                toast.success("Payment details sent to brand");
             }} className="px-4 py-2 bg-blue-600 text-white rounded-lg">Send Payment Details (Email)</button>
             
             {selectedCollab.whatsappNumber && (
               <button onClick={() => {
                  const url = `${window.location.origin}/share/${selectedCollab.id}`;
                  const msg = `Hi ${selectedCollab.contactName || selectedCollab.brandName}, here are your collaboration details and share links:\n${url}`;
                  window.open(`https://wa.me/${selectedCollab.whatsappNumber?.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(msg)}`, '_blank');
               }} className="px-4 py-2 bg-green-500 text-white rounded-lg">Send via WhatsApp</button>
             )}

             <button onClick={() => {
                const url = `${window.location.origin}/share/${selectedCollab.id}`;
                navigator.clipboard.writeText(url);
                toast.success("Link copied!");
             }} className="px-4 py-2 border border-gray-300 rounded-lg">Copy Share Link</button>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm">
          <h3 className="text-xl font-bold mb-4">Services & Deliverables</h3>
          <div className="flex gap-4 mb-4">
            <select onChange={async (e) => {
              const serviceId = e.target.value;
              const srv = servicesConfig[serviceId];
              if (!srv) return;
              const newLine = { serviceId, serviceName: srv.title, quantity: 1, unitPrice: srv.price, lineTotal: srv.price };
              const newServices = [...selectedCollab.services, newLine];
              const newTotal = newServices.reduce((sum, s) => sum + s.lineTotal, 0);
              await updateBrandCollaboration(selectedCollab.id, { services: newServices, totalPrice: newTotal });
              setSelectedCollab({...selectedCollab, services: newServices, totalPrice: newTotal});
              e.target.value = '';
            }} defaultValue="" className="border p-2 rounded flex-1">
              <option value="" disabled>Add Catalog Service...</option>
              {Object.keys(servicesConfig).map(k => (
                <option key={k} value={k}>{servicesConfig[k].title}</option>
              ))}
            </select>
            <button onClick={async () => {
              const newLine = { serviceId: 'custom', serviceName: 'Custom Charge', quantity: 1, unitPrice: 0, lineTotal: 0 };
              const newServices = [...selectedCollab.services, newLine];
              const newTotal = newServices.reduce((sum, s) => sum + s.lineTotal, 0);
              await updateBrandCollaboration(selectedCollab.id, { services: newServices, totalPrice: newTotal });
              setSelectedCollab({...selectedCollab, services: newServices, totalPrice: newTotal});
            }} className="px-4 py-2 border rounded bg-gray-50 hover:bg-gray-100 flex items-center gap-1"><Plus size={16}/> Custom</button>
          </div>
          
          <div className="space-y-4">
            {selectedCollab.services.map((s, i) => (
              <div key={i} className="flex gap-2 items-center flex-wrap p-3 border rounded-lg">
                {s.serviceId === 'custom' ? (
                  <input type="text" value={s.serviceName} onChange={async (e) => {
                    const newServices = [...selectedCollab.services];
                    newServices[i] = { ...newServices[i], serviceName: e.target.value };
                    setSelectedCollab({...selectedCollab, services: newServices});
                  }} onBlur={() => updateBrandCollaboration(selectedCollab.id, { services: selectedCollab.services })} className="flex-1 border p-1 rounded" placeholder="Description..." />
                ) : (
                  <span className="flex-1 font-medium">{s.serviceName}</span>
                )}
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-500">Qty:</span>
                  <input type="number" value={s.quantity} onChange={async (e) => {
                    const newServices = [...selectedCollab.services];
                    newServices[i] = { ...newServices[i], quantity: parseInt(e.target.value)||0 };
                    newServices[i].lineTotal = newServices[i].quantity * newServices[i].unitPrice;
                    const newTotal = newServices.reduce((sum, srv) => sum + srv.lineTotal, 0);
                    await updateBrandCollaboration(selectedCollab.id, { services: newServices, totalPrice: newTotal });
                    setSelectedCollab({...selectedCollab, services: newServices, totalPrice: newTotal});
                  }} className="w-20 border p-1 rounded" />
                  
                  <span className="text-sm text-gray-500">Unit $:</span>
                  <input type="number" value={s.unitPrice} onChange={async (e) => {
                    const newServices = [...selectedCollab.services];
                    newServices[i] = { ...newServices[i], unitPrice: parseFloat(e.target.value)||0 };
                    newServices[i].lineTotal = newServices[i].quantity * newServices[i].unitPrice;
                    const newTotal = newServices.reduce((sum, srv) => sum + srv.lineTotal, 0);
                    await updateBrandCollaboration(selectedCollab.id, { services: newServices, totalPrice: newTotal });
                    setSelectedCollab({...selectedCollab, services: newServices, totalPrice: newTotal});
                  }} className="w-24 border p-1 rounded" />
                  
                  <span className="w-24 font-bold text-right">${s.lineTotal}</span>
                  <button onClick={async () => {
                    const newServices = selectedCollab.services.filter((_, idx) => idx !== i);
                    const newTotal = newServices.reduce((sum, srv) => sum + srv.lineTotal, 0);
                    await updateBrandCollaboration(selectedCollab.id, { services: newServices, totalPrice: newTotal });
                    setSelectedCollab({...selectedCollab, services: newServices, totalPrice: newTotal});
                  }} className="ml-2"><X size={16} className="text-red-500"/></button>
                </div>
                <input type="text" placeholder="Share Link for this service (optional)" value={s.shareLink || ''} onChange={(e) => {
                  const newServices = [...selectedCollab.services];
                  newServices[i] = { ...newServices[i], shareLink: e.target.value };
                  setSelectedCollab({...selectedCollab, services: newServices});
                }} onBlur={() => updateBrandCollaboration(selectedCollab.id, { services: selectedCollab.services })} className="w-full border p-2 rounded text-sm text-blue-600 mt-2 bg-gray-50" />
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm">
          <h3 className="text-xl font-bold mb-4">File Manager</h3>
          <div className="flex gap-2 items-center mb-4 text-sm">
            <button onClick={() => setCurrentFolder('')} className="hover:underline text-purple-600">Root</button>
            {currentFolder && (
              <>
                <ChevronRight size={14} />
                <span>{currentFolder}</span>
              </>
            )}
          </div>
          <div className="flex gap-2 mb-4">
            <button onClick={handleCreateFolder} className="px-3 py-1.5 bg-gray-100 rounded-md text-sm flex items-center gap-1"><Plus size={14}/> New Folder</button>
            <label className="px-3 py-1.5 bg-purple-100 text-purple-700 cursor-pointer rounded-md text-sm flex items-center gap-1">
              <Upload size={14}/> Upload File
              <input type="file" className="hidden" onChange={handleFileUpload} />
            </label>
            {uploading && <span className="text-sm text-gray-500">Uploading... {Math.round(uploadProgress)}%</span>}
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {!currentFolder && (selectedCollab.folders || []).map(f => (
               <div key={f} onClick={() => setCurrentFolder(f)} className="p-4 border rounded-xl cursor-pointer hover:bg-gray-50 flex items-center gap-2">
                 <Folder className="text-yellow-500" /> {f}
               </div>
            ))}
            {currentFiles.map(f => (
               <div key={f.name} className="p-4 border rounded-xl flex items-center justify-between gap-2">
                 <div className="flex items-center gap-2 overflow-hidden">
                    <File className="text-blue-500 flex-shrink-0" />
                    <span className="truncate text-sm">{f.name}</span>
                 </div>
                 <a href={f.url} target="_blank" rel="noreferrer" className="text-blue-600 text-xs">View</a>
               </div>
            ))}
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm">
          <h3 className="text-xl font-bold mb-4">Billing & Payments</h3>
          <p>Total Price: ${selectedCollab.totalPrice} | Paid: ${paid} | Owed: ${owed}</p>
          <div className="mt-4 flex gap-2">
            <input type="number" placeholder="Amount" value={paymentAmount} onChange={e => setPaymentAmount(e.target.value)} className="border p-2 rounded" />
            <input type="text" placeholder="Note" value={paymentNote} onChange={e => setPaymentNote(e.target.value)} className="border p-2 rounded" />
            <button onClick={handleLogPayment} className="bg-green-600 text-white px-4 py-2 rounded">Log Payment</button>
          </div>
          <div className="mt-4">
             {selectedCollab.paymentHistory.map((p, i) => (
                <div key={i} className="text-sm text-gray-600 border-b py-2">
                  ${p.amount} on {new Date(p.date).toLocaleDateString()} - {p.note}
                </div>
             ))}
          </div>
        </div>
      </div>
    );
  }

  if (isCreating) {
    return (
      <div className="bg-white p-6 rounded-xl shadow-sm space-y-4">
        <h2 className="text-2xl font-bold">New Brand Collaboration</h2>
        <input placeholder="Brand Name" value={brandName} onChange={e=>setBrandName(e.target.value)} className="w-full border p-2 rounded" />
        <div className="flex gap-4">
          <input placeholder="Contact Email" value={contactEmail} onChange={e=>setContactEmail(e.target.value)} className="flex-1 border p-2 rounded" />
          <input placeholder="WhatsApp Number (e.g. +1234567890)" value={whatsappNumber} onChange={e=>setWhatsappNumber(e.target.value)} className="flex-1 border p-2 rounded" />
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
          <div key={i} className="flex gap-2 items-center flex-wrap">
            {s.serviceId === 'custom' ? (
              <input type="text" value={s.serviceName} onChange={e => updateServiceLine(i, { serviceName: e.target.value })} className="flex-1 border p-1 rounded" placeholder="Description..." />
            ) : (
              <span className="flex-1 font-medium">{s.serviceName}</span>
            )}
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-500">Qty:</span>
              <input type="number" value={s.quantity} onChange={e => updateServiceLine(i, { quantity: parseInt(e.target.value)||0 })} className="w-20 border p-1 rounded" />
              <span className="text-sm text-gray-500">Unit $:</span>
              <input type="number" value={s.unitPrice} onChange={e => updateServiceLine(i, { unitPrice: parseFloat(e.target.value)||0 })} className="w-24 border p-1 rounded" />
              <span className="w-24 font-bold text-right">${s.lineTotal}</span>
              <button onClick={() => setCollabServices(collabServices.filter((_, idx)=>idx!==i))} className="ml-2"><X size={16} className="text-red-500"/></button>
            </div>
            <input type="text" placeholder="Share Link (optional)" value={s.shareLink || ''} onChange={e => updateServiceLine(i, { shareLink: e.target.value })} className="w-full border p-1 rounded text-sm text-blue-600 mt-1" />
          </div>
        ))}

        <div className="flex gap-4 items-center">
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

        <div className="pt-4 border-t">
          <p>Calculated Total: ${calculatedTotal}</p>
          <input type="number" placeholder="Override Total Price" value={manualTotalPrice || ''} onChange={e => setManualTotalPrice(parseFloat(e.target.value) || null)} className="border p-2 rounded mt-2" />
        </div>

        <div className="flex gap-4">
          <button onClick={handleCreate} className="px-6 py-2 bg-purple-600 text-white rounded">Save</button>
          <button onClick={() => setIsCreating(false)} className="px-6 py-2 border rounded">Cancel</button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-purple-100">
          <h3 className="text-gray-500 text-sm font-bold uppercase mb-2">Total Outstanding</h3>
          <p className="text-3xl font-black text-purple-600">${totalOutstanding.toLocaleString()}</p>
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
            </tr>
          </thead>
          <tbody>
            {collabs.map(c => (
              <tr key={c.id} onClick={() => setSelectedCollab(c)} className="border-t hover:bg-gray-50 cursor-pointer">
                <td className="p-4 font-bold">{c.brandName}</td>
                <td className="p-4"><span className="px-2 py-1 text-xs rounded-full bg-blue-100 text-blue-700">{c.paymentStatus}</span></td>
                <td className="p-4">{c.billingType}</td>
                <td className="p-4">${c.totalPrice}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
