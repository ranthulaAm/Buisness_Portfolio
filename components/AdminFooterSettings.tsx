import React, { useState, useEffect } from 'react';
import { getFooterConfig, updateFooterConfig, FooterConfig } from '../services/dataService';
import { Save, Loader2, Link as LinkIcon, Plus, Trash2 } from 'lucide-react';

export const AdminFooterSettings: React.FC = () => {
    const [config, setConfig] = useState<FooterConfig | null>(null);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        getFooterConfig().then(setConfig);
    }, []);

    const handleSave = async () => {
        if (!config) return;
        setLoading(true);
        try {
            await updateFooterConfig(config);
            alert("Saved footer contacts and URLs!");
        } catch (e) {
            console.error(e);
            alert("Error saving footer data");
        }
        setLoading(false);
    };

    if (!config) return <div className="flex justify-center p-8"><Loader2 className="animate-spin text-gray-400" /></div>;

    return (
        <div className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-xl shadow-sm p-6 mb-8 mt-8 max-w-4xl mx-auto">
            <h3 className="text-lg font-bold text-gray-900 dark:text-slate-100 mb-6 flex items-center gap-2">
                <LinkIcon className="text-purple-600" size={20} /> Contacts & Location
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                <div>
                    <label className="block text-xs font-bold uppercase tracking-widest text-gray-500 dark:text-slate-400 mb-2">Display Email</label>
                    <input 
                        type="email" 
                        value={config.email} 
                        onChange={e => setConfig({...config, email: e.target.value})}
                        className="w-full border border-gray-300 dark:border-slate-600 rounded-xl p-3 outline-none focus:border-purple-500"
                    />
                </div>
                <div>
                    <label className="block text-xs font-bold uppercase tracking-widest text-gray-500 dark:text-slate-400 mb-2">Display Phone Number</label>
                    <input 
                        type="text" 
                        value={config.phone} 
                        onChange={e => setConfig({...config, phone: e.target.value})}
                        className="w-full border border-gray-300 dark:border-slate-600 rounded-xl p-3 outline-none focus:border-purple-500"
                    />
                </div>
                <div>
                    <label className="block text-xs font-bold uppercase tracking-widest text-gray-500 dark:text-slate-400 mb-2">Instagram URL</label>
                    <input 
                        type="text" 
                        value={config.instagram} 
                        onChange={e => setConfig({...config, instagram: e.target.value})}
                        className="w-full border border-gray-300 dark:border-slate-600 rounded-xl p-3 outline-none focus:border-purple-500"
                    />
                </div>
                <div>
                    <label className="block text-xs font-bold uppercase tracking-widest text-gray-500 dark:text-slate-400 mb-2">Facebook URL</label>
                    <input 
                        type="text" 
                        value={config.facebook} 
                        onChange={e => setConfig({...config, facebook: e.target.value})}
                        className="w-full border border-gray-300 dark:border-slate-600 rounded-xl p-3 outline-none focus:border-purple-500"
                    />
                </div>
                <div className="md:col-span-2">
                    <label className="block text-xs font-bold uppercase tracking-widest text-gray-500 dark:text-slate-400 mb-2">Location / Address</label>
                    <textarea 
                        value={config.location} 
                        onChange={e => setConfig({...config, location: e.target.value})}
                        className="w-full border border-gray-300 dark:border-slate-600 rounded-xl p-3 outline-none focus:border-purple-500 min-h-[80px]"
                    />
                </div>
            </div>

            <h4 className="text-sm font-bold text-gray-900 dark:text-slate-100 mb-4 border-b border-gray-100 dark:border-slate-700 pb-2">Extra Websites / URLs</h4>
            <div className="space-y-3 mb-6">
                {config.extraUrls.map((urlItem, idx) => (
                    <div key={idx} className="flex gap-3">
                        <input 
                            type="text" 
                            value={urlItem.title} 
                            placeholder="Website Name"
                            onChange={e => {
                                const newUrls = [...config.extraUrls];
                                newUrls[idx] = { ...newUrls[idx], title: e.target.value };
                                setConfig({...config, extraUrls: newUrls });
                            }}
                            className="flex-1 border border-gray-300 dark:border-slate-600 rounded-xl p-3 outline-none focus:border-purple-500 text-sm"
                        />
                        <input 
                            type="text" 
                            value={urlItem.url} 
                            placeholder="https://"
                            onChange={e => {
                                const newUrls = [...config.extraUrls];
                                newUrls[idx] = { ...newUrls[idx], url: e.target.value };
                                setConfig({...config, extraUrls: newUrls });
                            }}
                            className="flex-[2] border border-gray-300 dark:border-slate-600 rounded-xl p-3 outline-none focus:border-purple-500 text-sm"
                        />
                        <button onClick={() => {
                            const newUrls = [...config.extraUrls];
                            newUrls.splice(idx, 1);
                            setConfig({...config, extraUrls: newUrls});
                        }} className="text-red-500 hover:bg-red-50 p-3 rounded-xl transition-colors">
                            <Trash2 size={20} />
                        </button>
                    </div>
                ))}
                <button onClick={() => {
                    setConfig({...config, extraUrls: [...config.extraUrls, { title: 'New Site', url: '' }]});
                }} className="flex items-center gap-2 text-sm font-bold text-purple-600 hover:text-purple-700 bg-purple-50 px-4 py-2 rounded-lg transition-colors">
                    <Plus size={16} /> Add URL
                </button>
            </div>

            <div className="flex justify-end pt-6 border-t border-gray-100 dark:border-slate-700">
                <button onClick={handleSave} disabled={loading} className="bg-purple-600 text-white px-8 py-3 rounded-xl font-bold uppercase tracking-widest text-xs hover:bg-purple-700 transition-colors flex items-center gap-2 disabled:opacity-50">
                    {loading ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />} Save Contact Info
                </button>
            </div>
        </div>
    );
};
