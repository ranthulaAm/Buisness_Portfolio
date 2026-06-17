import React, { useState, useEffect } from 'react';
import { getEmailConfig, updateEmailConfig, EmailConfig } from '../services/dataService';
import { Save, Loader2, Mail } from 'lucide-react';

export const AdminEmail: React.FC = () => {
    const [config, setConfig] = useState<EmailConfig>({
        emailSubjectTemplate: '',
        emailBodyTemplate: ''
    });
    const [loading, setLoading] = useState(false);
    const [fetching, setFetching] = useState(true);

    useEffect(() => {
        getEmailConfig().then(data => {
            setConfig(data);
            setFetching(false);
        });
    }, []);

    const handleSave = async () => {
        setLoading(true);
        try {
            await updateEmailConfig(config);
            alert("Email template updated successfully.");
        } catch (e) {
            console.error(e);
            alert("Error updating email template");
        } finally {
            setLoading(false);
        }
    };

    if (fetching) {
        return <div className="flex justify-center p-12"><Loader2 className="animate-spin text-gray-400" size={32} /></div>;
    }

    return (
        <div className="space-y-8">
            <div className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-xl shadow-sm p-6 mb-8">
                <h3 className="text-lg font-bold text-gray-900 dark:text-slate-100 mb-4 flex items-center gap-2">
                    <Mail size={20} className="text-blue-600" /> Order Confirmation Email Template
                </h3>
                <p className="text-sm text-gray-500 dark:text-slate-400 mb-6">
                    Customize the email that clients receive when they place an order.
                    <br/><br/>
                    <strong>Available Variables:</strong>
                    <br/>
                    <code>{`{orderId}`}</code>, <code>{`{clientName}`}</code>, <code>{`{serviceType}`}</code>, <code>{`{price}`}</code>, <code>{`{estimatedCompletion}`}</code>, <code>{`{trackingUrl}`}</code>
                </p>

                <div className="space-y-6">
                    <div>
                        <label className="block text-xs font-bold uppercase tracking-widest text-gray-500 dark:text-slate-400 mb-2">Subject Line</label>
                        <input 
                            type="text" 
                            value={config.emailSubjectTemplate} 
                            onChange={e => setConfig({...config, emailSubjectTemplate: e.target.value})}
                            className="w-full border border-gray-300 dark:border-slate-600 rounded-xl p-3 outline-none focus:border-blue-500 font-mono text-sm"
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-bold uppercase tracking-widest text-gray-500 dark:text-slate-400 mb-2">Email Body</label>
                        <textarea 
                            value={config.emailBodyTemplate} 
                            onChange={e => setConfig({...config, emailBodyTemplate: e.target.value})}
                            className="w-full border border-gray-300 dark:border-slate-600 rounded-xl p-3 outline-none focus:border-blue-500 min-h-[300px] font-mono text-sm"
                        />
                    </div>
                </div>

                <div className="flex justify-end pt-6 mt-6 border-t border-gray-100 dark:border-slate-700">
                    <button onClick={handleSave} disabled={loading} className="bg-blue-600 text-white px-8 py-3 rounded-xl font-bold uppercase tracking-widest text-xs hover:bg-blue-700 transition-colors flex items-center gap-2 disabled:opacity-50">
                        {loading ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />} Save Email Template
                    </button>
                </div>
            </div>
        </div>
    );
};
