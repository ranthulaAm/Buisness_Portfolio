import React, { useState, useEffect, useRef } from 'react';
import { getInvoiceConfig, updateInvoiceConfig, InvoiceConfig } from '../services/dataService';
import { uploadFileWithProgress } from '../services/fileUploadService';
import { Save, Loader2, ImageIcon, Palette, Layout, Building2, Upload } from 'lucide-react';

export const AdminInvoice: React.FC = () => {
    const [config, setConfig] = useState<InvoiceConfig>({
        logoUrl: '',
        primaryColor: '#000000',
        secondaryColor: '#666666',
        layoutStyle: 'modern',
        companyName: '',
        companyAddress: ''
    });
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [uploadingLogo, setUploadingLogo] = useState(false);
    const [logoProgress, setLogoProgress] = useState(0);
    const logoInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        const load = async () => {
            setLoading(true);
            try {
                const data = await getInvoiceConfig();
                setConfig(data);
            } catch(e) {
                console.error(e);
            } finally {
                setLoading(false);
            }
        }
        load();
    }, []);

    const handleSave = async () => {
        setSaving(true);
        try {
            await updateInvoiceConfig(config);
            alert("Invoice configuration saved!");
        } catch(e) {
            console.error(e);
            alert("Failed to save invoice configuration.");
        } finally {
            setSaving(false);
        }
    };

    const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        try {
            setUploadingLogo(true);
            setLogoProgress(0);
            
            const reader = new FileReader();
            reader.readAsDataURL(file);
            reader.onload = async () => {
                let base64 = reader.result as string;
                
                // If it's an SVG, convert it to a PNG base64 String for better jsPDF compatibility
                if (file.type === 'image/svg+xml') {
                    base64 = await new Promise<string>((resolve, reject) => {
                         const img = new Image();
                         img.onload = () => {
                            const canvas = document.createElement('canvas');
                            // Scale up for good print quality (approx 1000px wide)
                            const scale = 1000 / img.width;
                            canvas.width = 1000;
                            canvas.height = img.height * scale;
                            const ctx = canvas.getContext('2d');
                            if (ctx) {
                                ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
                                resolve(canvas.toDataURL('image/png'));
                            } else {
                                resolve(reader.result as string); // fallback
                            }
                         };
                         img.onerror = () => resolve(reader.result as string); // fallback
                         img.src = reader.result as string;
                    });
                }
                
                const path = `uploads/invoices/logo_${Date.now()}_${file.name.replace('.svg', '.png')}`;
                const url = await uploadFileWithProgress(file, path, (p) => setLogoProgress(p));
                
                setConfig(prev => ({ ...prev, logoUrl: url, logoBase64: base64 }));
                
                setUploadingLogo(false);
                setLogoProgress(0);
                if (logoInputRef.current) logoInputRef.current.value = '';
            };
            
            reader.onerror = (error) => {
                 console.error("Failed to read file", error);
                 alert("Failed to read file for base64 conversion.");
                 setUploadingLogo(false);
            };
        } catch (error) {
            console.error("Failed to upload logo", error);
            alert("Failed to upload logo.");
            setUploadingLogo(false);
            setLogoProgress(0);
            if (logoInputRef.current) logoInputRef.current.value = '';
        }
    };

    if (loading) return <div className="p-8 flex justify-center"><Loader2 className="animate-spin text-purple-600 mb-4" /></div>;

    return (
        <div className="space-y-8 pb-12 animate-fade-in">
            <div className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-xl shadow-sm p-6">
                <div className="flex justify-between items-center mb-6">
                    <div>
                        <h3 className="text-xl font-bold text-gray-900 dark:text-slate-100 flex items-center gap-2">
                            <Layout size={20} className="text-blue-600" /> Invoice Template Editor
                        </h3>
                        <p className="text-sm text-gray-500 dark:text-slate-400 mt-1">Customize the appearance of the invoices generated for your clients.</p>
                    </div>
                    <button 
                         onClick={handleSave} 
                         disabled={saving} 
                         className="bg-purple-600 text-white hover:bg-purple-700 px-6 py-2.5 rounded-xl text-sm font-bold flex items-center gap-2 transition-all shadow-sm disabled:opacity-50 tracking-widest uppercase"
                     >
                         {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                         Save Template
                     </button>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
                    <div className="space-y-6">
                        {/* Company Info */}
                        <div className="space-y-4 bg-gray-50 dark:bg-slate-800 p-5 rounded-xl border border-gray-100 dark:border-slate-700">
                            <h4 className="font-bold text-gray-800 dark:text-slate-200 flex items-center gap-2 mb-4 border-b border-gray-200 dark:border-slate-700 pb-2"><Building2 size={16} /> Company Details</h4>
                            <div>
                                <label className="block text-xs font-bold uppercase tracking-widest mb-1 text-gray-500 dark:text-slate-400">Company Name</label>
                                <input 
                                    type="text" 
                                    value={config.companyName}
                                    onChange={(e) => setConfig({...config, companyName: e.target.value})}
                                    className="w-full border border-gray-300 dark:border-slate-600 rounded-lg p-2.5 outline-none focus:border-purple-500 text-sm" 
                                    placeholder="e.g. Acme Agency"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-bold uppercase tracking-widest mb-1 text-gray-500 dark:text-slate-400">Company Address</label>
                                <textarea 
                                    value={config.companyAddress}
                                    onChange={(e) => setConfig({...config, companyAddress: e.target.value})}
                                    className="w-full border border-gray-300 dark:border-slate-600 rounded-lg p-2.5 outline-none focus:border-purple-500 min-h-[80px] text-sm leading-relaxed" 
                                    placeholder="123 Example Street&#10;City, Country"
                                />
                            </div>
                        </div>

                        {/* Tax Settings */}
                        <div className="space-y-4 bg-gray-50 dark:bg-slate-800 p-5 rounded-xl border border-gray-100 dark:border-slate-700">
                            <h4 className="font-bold text-gray-800 dark:text-slate-200 flex items-center gap-2 mb-4 border-b border-gray-200 dark:border-slate-700 pb-2"><ImageIcon size={16} /> Tax Settings</h4>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-bold uppercase tracking-widest mb-1 text-gray-500 dark:text-slate-400">Tax Name (e.g. VAT)</label>
                                    <input 
                                        type="text" 
                                        value={config.taxName || ''}
                                        onChange={(e) => setConfig({...config, taxName: e.target.value})}
                                        className="w-full border border-gray-300 dark:border-slate-600 rounded-lg p-2.5 outline-none focus:border-purple-500 text-sm" 
                                        placeholder="Tax"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold uppercase tracking-widest mb-1 text-gray-500 dark:text-slate-400">Tax Rate (%)</label>
                                    <input 
                                        type="number" 
                                        value={config.taxRate !== undefined ? config.taxRate : 0}
                                        onChange={(e) => setConfig({...config, taxRate: parseFloat(e.target.value) || 0})}
                                        className="w-full border border-gray-300 dark:border-slate-600 rounded-lg p-2.5 outline-none focus:border-purple-500 text-sm" 
                                        placeholder="0"
                                        min="0"
                                        step="0.1"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Branding */}
                        <div className="space-y-4 bg-gray-50 dark:bg-slate-800 p-5 rounded-xl border border-gray-100 dark:border-slate-700">
                            <h4 className="font-bold text-gray-800 dark:text-slate-200 flex items-center gap-2 mb-4 border-b border-gray-200 dark:border-slate-700 pb-2"><ImageIcon size={16} /> Branding</h4>
                            <div>
                                <label className="block text-xs font-bold uppercase tracking-widest mb-1 text-gray-500 dark:text-slate-400">Brand Logo URL</label>
                                <div className="flex gap-2 items-center mb-3">
                                    <input 
                                        type="text" 
                                        value={config.logoUrl}
                                        onChange={(e) => setConfig({...config, logoUrl: e.target.value})}
                                        className="flex-1 border border-gray-300 dark:border-slate-600 rounded-lg p-2.5 outline-none focus:border-purple-500 text-sm" 
                                        placeholder="https://... or upload image"
                                    />
                                    <input 
                                        type="file" 
                                        accept="image/*" 
                                        ref={logoInputRef} 
                                        onChange={handleLogoUpload} 
                                        className="hidden" 
                                    />
                                    <button 
                                        onClick={() => logoInputRef.current?.click()}
                                        disabled={uploadingLogo}
                                        title="Upload Logo"
                                        className="p-2.5 bg-gray-100 dark:bg-slate-800 hover:bg-gray-200 text-gray-700 dark:text-slate-300 rounded-lg transition-colors border border-gray-200 dark:border-slate-700 flex items-center justify-center min-w-[44px]"
                                    >
                                        {uploadingLogo ? <Loader2 size={18} className="animate-spin" /> : <Upload size={18} />}
                                    </button>
                                </div>
                                {uploadingLogo && (
                                    <div className="w-full bg-gray-200 rounded-full h-1.5 mb-3">
                                      <div className="bg-purple-600 h-1.5 rounded-full transition-all" style={{ width: `${logoProgress}%` }}></div>
                                    </div>
                                )}
                                {config.logoUrl && (
                                    <div className="p-3 bg-gray-100 dark:bg-slate-800 bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI4IiBoZWlnaHQ9IjgiPgo8cmVjdCB3aWR0aD0iNCIgaGVpZ2h0PSI0IiBmaWxsPSIjZTVlNWU1IiAvPgo8cmVjdCB4PSI0IiB5PSI0IiB3aWR0aD0iNCIgaGVpZ2h0PSI0IiBmaWxsPSIjZTVlNWU1IiAvPgo8L3N2Zz4=')] rounded-lg border border-gray-200 dark:border-slate-700 inline-block">
                                        <img src={config.logoUrl} alt="Logo Preview" className="h-12 object-contain" />
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Colors & Layout */}
                        <div className="space-y-4 bg-gray-50 dark:bg-slate-800 p-5 rounded-xl border border-gray-100 dark:border-slate-700">
                            <h4 className="font-bold text-gray-800 dark:text-slate-200 flex items-center gap-2 mb-4 border-b border-gray-200 dark:border-slate-700 pb-2"><Palette size={16} /> Colors & Layout</h4>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-bold uppercase tracking-widest mb-2 text-gray-500 dark:text-slate-400">Primary Color</label>
                                    <div className="flex items-center gap-2">
                                        <input 
                                            type="color" 
                                            value={config.primaryColor}
                                            onChange={(e) => setConfig({...config, primaryColor: e.target.value})}
                                            className="w-10 h-10 rounded cursor-pointer border-0 p-0" 
                                        />
                                        <input type="text" value={config.primaryColor} onChange={(e) => setConfig({...config, primaryColor: e.target.value})} className="flex-1 border border-gray-300 dark:border-slate-600 rounded-lg p-2 text-sm uppercase font-mono" />
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-xs font-bold uppercase tracking-widest mb-2 text-gray-500 dark:text-slate-400">Secondary Color</label>
                                    <div className="flex items-center gap-2">
                                        <input 
                                            type="color" 
                                            value={config.secondaryColor}
                                            onChange={(e) => setConfig({...config, secondaryColor: e.target.value})}
                                            className="w-10 h-10 rounded cursor-pointer border-0 p-0" 
                                        />
                                        <input type="text" value={config.secondaryColor} onChange={(e) => setConfig({...config, secondaryColor: e.target.value})} className="flex-1 border border-gray-300 dark:border-slate-600 rounded-lg p-2 text-sm uppercase font-mono" />
                                    </div>
                                </div>
                            </div>

                            <div className="mt-4">
                                <label className="block text-xs font-bold uppercase tracking-widest mb-2 text-gray-500 dark:text-slate-400">Layout Style</label>
                                <div className="grid grid-cols-3 gap-3">
                                    {(['modern', 'classic', 'minimal'] as const).map(style => (
                                        <button 
                                            key={style}
                                            onClick={() => setConfig({...config, layoutStyle: style})}
                                            className={`p-3 rounded-xl border-2 text-sm font-bold capitalize transition-all ${config.layoutStyle === style ? 'border-purple-600 bg-purple-50 text-purple-700' : 'border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-gray-600 dark:text-slate-400 hover:border-gray-300 dark:border-slate-600'}`}
                                        >
                                            {style}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Preview Panel */}
                    <div className="bg-gray-100 dark:bg-slate-800 rounded-2xl p-6 border border-gray-200 dark:border-slate-700 flex flex-col items-center justify-center">
                        <span className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4">Live Preview</span>
                        
                        <div className={`w-full max-w-sm bg-white dark:bg-slate-900 shadow-xl rounded-lg overflow-hidden transition-all`} style={{ fontFamily: config.layoutStyle === 'classic' ? 'serif' : 'sans-serif' }}>
                            <div className={`${config.layoutStyle === 'modern' ? 'p-6' : 'p-4 border-b-2'} ${config.layoutStyle === 'minimal' ? 'border-b border-gray-200 dark:border-slate-700' : ''}`} style={{ backgroundColor: config.layoutStyle === 'modern' ? config.primaryColor : 'transparent', borderColor: config.primaryColor }}>
                                <div className={`flex justify-between items-start ${config.layoutStyle === 'modern' ? 'text-white' : ''}`}>
                                    <div>
                                        {config.logoUrl ? (
                                            <img src={config.logoUrl} alt="Logo" className="w-16 h-16 object-contain bg-transparent mb-2" />
                                        ) : (
                                            <div className={`w-16 h-16 rounded mb-2 flex items-center justify-center font-bold text-xs ${config.layoutStyle === 'modern' ? 'bg-white/20' : 'bg-gray-100 dark:bg-slate-800 text-gray-400'}`}>LOGO</div>
                                        )}
                                        <h1 className="font-bold text-lg" style={{ color: config.layoutStyle === 'modern' ? '#fff' : config.primaryColor }}>{config.companyName || 'Your Company'}</h1>
                                    </div>
                                    <div className="text-right">
                                        <h2 className="text-xl font-black mb-1 opacity-90" style={{ color: config.layoutStyle === 'modern' ? '#fff' : config.secondaryColor }}>INVOICE</h2>
                                        <p className="text-xs opacity-80 whitespace-pre-wrap">{config.companyAddress || '123 Example Street\nCity, Country'}</p>
                                    </div>
                                </div>
                            </div>
                            
                            <div className="p-6">
                                <div className="flex justify-between mb-6 text-sm">
                                    <div className="text-gray-600 dark:text-slate-400">
                                        <p className="font-bold text-gray-900 dark:text-slate-100 mb-1">Billed To:</p>
                                        <p>Client Name</p>
                                        <p>client@example.com</p>
                                    </div>
                                    <div className="text-right text-gray-600 dark:text-slate-400">
                                        <p><span className="font-bold text-gray-900 dark:text-slate-100">Date:</span> Oct 25, 2023</p>
                                        <p><span className="font-bold text-gray-900 dark:text-slate-100">Due:</span> Nov 24, 2023</p>
                                    </div>
                                </div>
                                
                                <div className="border border-gray-200 dark:border-slate-700 rounded-lg overflow-hidden">
                                    <div className="flex justify-between p-3 text-xs font-bold uppercase text-white tracking-wider" style={{ backgroundColor: config.secondaryColor }}>
                                        <span>Description</span>
                                        <span>Amount</span>
                                    </div>
                                    <div className="flex justify-between p-3 text-sm border-b border-gray-100 dark:border-slate-700 text-gray-800 dark:text-slate-200">
                                        <span>Brand Identity Design</span>
                                        <span>$1,200.00</span>
                                    </div>
                                    <div className="flex justify-between p-3 text-sm text-gray-800 dark:text-slate-200">
                                        <span>Web Development</span>
                                        <span>$2,500.00</span>
                                    </div>
                                </div>
                                
                                <div className="mt-6 flex justify-end">
                                    <div className="w-1/2">
                                        <div className="flex justify-between py-2 text-sm text-gray-600 dark:text-slate-400">
                                            <span>Subtotal</span>
                                            <span>$3,700.00</span>
                                        </div>
                                        {config.taxRate !== undefined && config.taxRate > 0 && (
                                            <div className="flex justify-between py-2 text-sm text-gray-600 dark:text-slate-400 border-b border-gray-200 dark:border-slate-700">
                                                <span>{config.taxName || 'Tax'} ({config.taxRate}%)</span>
                                                <span>${(3700 * (config.taxRate / 100)).toFixed(2)}</span>
                                            </div>
                                        )}
                                        <div className="flex justify-between py-3 font-black text-lg" style={{ color: config.primaryColor }}>
                                            <span>Total</span>
                                            <span>${(3700 * (1 + (config.taxRate || 0)/100)).toFixed(2)}</span>
                                        </div>
                                    </div>
                                </div>
                                
                                <div className="mt-8 pt-4 border-t border-gray-100 dark:border-slate-700 text-center">
                                    <p className="text-xs italic text-gray-500 dark:text-slate-400">Thank you for your business!</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
