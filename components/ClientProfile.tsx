import { toast } from "react-hot-toast";
import React, { useState, useEffect } from 'react';
import { User } from '../types';
import { saveUserProfile } from '../services/storageService';
import { uploadFileWithProgress } from '../services/fileUploadService';
import { auth } from '../services/firebase';
import { updateProfile } from 'firebase/auth';
import { Camera, Save, Loader2, Bell, BellOff, User as UserIcon, Shield, ShieldCheck, ShieldAlert, CheckCircle, AlertTriangle, FileText, Download } from 'lucide-react';
import { listenToSecurityLogs, FileAuditLog } from '../services/dataService';

interface ClientProfileProps {
  user: User;
}

export const ClientProfile: React.FC<ClientProfileProps> = ({ user }) => {
  const [name, setName] = useState(user.name);
  const [avatar, setAvatar] = useState(user.avatar);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [emailNotifications, setEmailNotifications] = useState(user.emailNotifications !== false);
  const [mobiles, setMobiles] = useState<string>(user.mobiles ? user.mobiles.join(', ') : '');
  const [securityLogs, setSecurityLogs] = useState<FileAuditLog[]>([]);

  useEffect(() => {
    const unsubscribe = listenToSecurityLogs((logs) => {
      setSecurityLogs(logs.filter(log => log.userId === user.id));
    });
    return () => unsubscribe();
  }, [user.id]);

  const handleAvatarUpload = async (file: File) => {
    setUploading(true);
    try {
      const path = `avatars/${user.id}_${Date.now()}`;
      const url = await uploadFileWithProgress(file, path, () => {});
      setAvatar(url);
    } catch (e) {
      console.error(e);
      toast('Failed to upload avatar.');
    } finally {
      setUploading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      if (auth.currentUser) {
        await updateProfile(auth.currentUser, { displayName: name, photoURL: avatar });
      }
      await saveUserProfile({
        ...user,
        name,
        avatar,
        mobiles: mobiles.split(',').map(m => m.trim()).filter(Boolean),
        emailNotifications
      });
      toast('Profile updated successfully!');
    } catch (e) {
      console.error(e);
      toast('Failed to save profile.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border border-gray-300 dark:border-slate-600 rounded-3xl p-6 md:p-8 shadow-[0_8px_32px_rgba(0,0,0,0.12)] w-full max-w-full sm:max-w-3xl mx-auto space-y-8 mt-4">
      <div className="flex items-center gap-4 border-b border-gray-200 dark:border-slate-700 pb-6 mb-6">
        <UserIcon size={24} className="text-gray-900 dark:text-slate-100" />
        <h2 className="text-2xl font-bold font-display text-gray-900 dark:text-slate-100">Client Profile</h2>
      </div>

      <div className="flex flex-col md:flex-row gap-8 items-start">
        <div className="flex flex-col items-center gap-4">
          <div className="relative w-32 h-32 rounded-full overflow-hidden border-4 border-white dark:border-slate-800 shadow-lg bg-gray-100 dark:bg-slate-800 flex items-center justify-center">
            {uploading ? (
               <Loader2 className="animate-spin text-purple-600" size={32} />
            ) : (
               <img src={avatar} alt={name} className="w-full h-full object-cover" />
            )}
            <label className="absolute inset-0 bg-black/40 opacity-0 hover:opacity-100 transition-opacity flex items-center justify-center cursor-pointer text-white">
              <Camera size={24} />
              <input 
                type="file" 
                className="hidden" 
                accept="image/*"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) handleAvatarUpload(file);
                }}
              />
            </label>
          </div>
          <span className="text-xs text-gray-400 font-medium uppercase tracking-widest">Profile Picture</span>
        </div>

        <div className="flex-1 space-y-6 w-full">
          <div>
            <label className="block text-sm font-bold text-gray-700 dark:text-slate-300 mb-2 uppercase tracking-widest text-xs">Display Name</label>
            <input 
              type="text" 
              value={name} 
              onChange={(e) => setName(e.target.value)}
              className="w-full border border-gray-300 dark:border-slate-600 rounded-xl px-4 py-3 outline-none focus:border-purple-500 bg-white dark:bg-slate-900 font-medium text-gray-900 dark:text-slate-100 transition-colors"
            />
          </div>

          <div>
            <label className="block text-sm font-bold text-gray-700 dark:text-slate-300 mb-2 uppercase tracking-widest text-xs">Email Address</label>
            <input 
              type="text" 
              value={user.email} 
              disabled
              className="w-full border border-gray-200 dark:border-slate-700 rounded-xl px-4 py-3 bg-gray-100 dark:bg-slate-800 font-medium text-gray-500 dark:text-slate-400 cursor-not-allowed"
            />
          </div>
          <div>
            <label className="block text-sm font-bold text-gray-700 dark:text-slate-300 mb-2 uppercase tracking-widest text-xs">Phone Numbers (comma separated)</label>
            <input 
              type="text" 
              value={mobiles} 
              onChange={(e) => setMobiles(e.target.value.replace(/[^0-9+, -]/g, ''))} 
              placeholder="+94 77 123 4567, +1 234 567 8900"
              className="w-full border border-gray-300 dark:border-slate-600 rounded-xl px-4 py-3 outline-none focus:border-purple-500 bg-white dark:bg-slate-900 font-medium text-gray-900 dark:text-slate-100 transition-colors"
            />
          </div>
        </div>
      </div>

      <div className="border-t border-gray-200 dark:border-slate-700 pt-8 mt-8">
        <h3 className="text-lg font-bold text-gray-900 dark:text-slate-100 mb-4 flex items-center gap-2">
          {emailNotifications ? <Bell size={20} className="text-purple-600"/> : <BellOff size={20} className="text-gray-400"/>} Notification Settings
        </h3>
        
        <label className="flex items-center justify-between cursor-pointer group bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 p-4 rounded-2xl hover:bg-white dark:bg-slate-900 transition-colors hover:border-gray-300 dark:border-slate-600">
           <div className="flex flex-col">
              <span className="font-bold text-gray-900 dark:text-slate-100 text-sm">Order Status Updates</span>
              <span className="text-xs text-gray-500 dark:text-slate-400 font-medium">Receive an email when your project status changes</span>
           </div>
           <div className="relative inline-flex items-center">
              <input type="checkbox" checked={emailNotifications} onChange={e => setEmailNotifications(e.target.checked)} className="sr-only peer" />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white dark:border-slate-800 after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white dark:bg-slate-900 after:border-gray-300 dark:border-slate-600 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-600"></div>
           </div>
        </label>
      </div>

      {/* File Upload History & Security Audits */}
      <div className="border-t border-gray-200 dark:border-slate-700 pt-8 mt-8 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h3 className="text-lg font-bold text-gray-900 dark:text-slate-100 flex items-center gap-2">
              <Shield size={20} className="text-purple-600"/> File Security Audits & History
            </h3>
            <p className="text-xs text-gray-500 dark:text-slate-400 mt-0.5">
              Automated system scans, signature validation, and extension verification for all uploaded materials.
            </p>
          </div>
          <span className="text-xs font-mono font-bold bg-green-50 dark:bg-green-950/40 text-green-700 dark:text-green-400 border border-green-100 dark:border-green-900/40 px-3 py-1 rounded-full w-fit">
            System Live & Guarded
          </span>
        </div>

        {securityLogs.length === 0 ? (
          <div className="border border-dashed border-gray-200 dark:border-slate-700 rounded-2xl p-8 text-center bg-gray-50/50 dark:bg-slate-800/20">
            <ShieldCheck size={32} className="mx-auto text-gray-400 mb-2" />
            <p className="text-xs font-bold text-gray-500 dark:text-slate-400 uppercase tracking-widest">No file uploads detected yet</p>
            <p className="text-xs text-gray-400 dark:text-slate-500 mt-1">Upload an avatar or project file to view real-time security integrity scans.</p>
          </div>
        ) : (
          <div className="space-y-3 max-h-[300px] overflow-y-auto pr-1">
            {securityLogs.map((log) => {
              const formattedSize = log.fileSize > 1024 * 1024 
                ? `${(log.fileSize / (1024 * 1024)).toFixed(2)} MB`
                : `${(log.fileSize / 1024).toFixed(1)} KB`;
              const dateStr = new Date(log.timestamp).toLocaleString();

              return (
                <div 
                  key={log.id} 
                  className={`border rounded-2xl p-4 flex flex-col md:flex-row gap-4 justify-between items-start md:items-center bg-white dark:bg-slate-900 transition-all ${
                    log.status === 'passed' 
                      ? 'border-gray-200 dark:border-slate-800 hover:border-gray-300 dark:hover:border-slate-700' 
                      : log.status === 'warning' 
                        ? 'border-amber-200 dark:border-amber-900/40 bg-amber-50/20 dark:bg-amber-950/10'
                        : 'border-red-200 dark:border-red-900/40 bg-red-50/20 dark:bg-red-950/10'
                  }`}
                >
                  <div className="flex gap-3 items-start max-w-full">
                    <div className={`p-2.5 rounded-xl shrink-0 ${
                      log.status === 'passed' 
                        ? 'bg-gray-100 dark:bg-slate-800 text-gray-700 dark:text-slate-300' 
                        : log.status === 'warning' 
                          ? 'bg-amber-100 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400'
                          : 'bg-red-100 dark:bg-red-950/40 text-red-700 dark:text-red-400'
                    }`}>
                      <FileText size={18} />
                    </div>
                    <div className="space-y-1 min-w-0 max-w-full">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-bold text-gray-900 dark:text-slate-100 text-sm truncate max-w-[200px] sm:max-w-xs block" title={log.fileName}>
                          {log.fileName}
                        </span>
                        <span className="text-[10px] font-mono text-gray-400 dark:text-slate-500 bg-gray-50 dark:bg-slate-800 border border-gray-100 dark:border-slate-800 px-1.5 py-0.5 rounded">
                          {formattedSize}
                        </span>
                      </div>
                      <div className="text-[11px] text-gray-500 dark:text-slate-400 flex flex-wrap gap-x-3 gap-y-1">
                        <span>Type: <span className="font-mono text-gray-700 dark:text-slate-300">{log.fileType}</span></span>
                        <span>•</span>
                        <span>Uploaded: {dateStr}</span>
                      </div>
                      
                      {/* Security Checklist Details */}
                      <div className="flex flex-wrap gap-3 pt-1.5">
                        <div className="flex items-center gap-1 text-[10px] font-medium text-gray-600 dark:text-slate-400">
                          {log.checks.extensionMatch ? <CheckCircle size={12} className="text-green-500" /> : <AlertTriangle size={12} className="text-red-500" />}
                          Extension Check
                        </div>
                        <div className="flex items-center gap-1 text-[10px] font-medium text-gray-600 dark:text-slate-400">
                          {log.checks.mimeVerified ? <CheckCircle size={12} className="text-green-500" /> : <AlertTriangle size={12} className="text-amber-500" />}
                          MIME Verification
                        </div>
                        <div className="flex items-center gap-1 text-[10px] font-medium text-gray-600 dark:text-slate-400">
                          {log.checks.signaturePassed ? <CheckCircle size={12} className="text-green-500" /> : <AlertTriangle size={12} className="text-red-500" />}
                          Signature Match
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 w-full md:w-auto justify-between md:justify-end shrink-0 pt-2 md:pt-0 border-t md:border-t-0 border-gray-100 dark:border-slate-800">
                    <div className="text-right">
                      {log.status === 'passed' ? (
                        <span className="inline-flex items-center gap-1 text-xs font-bold text-green-600 bg-green-50 dark:bg-green-950/20 px-2 py-1 rounded-md border border-green-200 dark:border-green-900/30">
                          <ShieldCheck size={12} /> SECURE
                        </span>
                      ) : log.status === 'warning' ? (
                        <span className="inline-flex items-center gap-1 text-xs font-bold text-amber-600 bg-amber-50 dark:bg-amber-950/20 px-2 py-1 rounded-md border border-amber-200 dark:border-amber-900/30">
                          <AlertTriangle size={12} /> WARNING
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-xs font-bold text-red-600 bg-red-50 dark:bg-red-950/20 px-2 py-1 rounded-md border border-red-200 dark:border-red-900/30">
                          <ShieldAlert size={12} /> BLOCKED
                        </span>
                      )}
                    </div>
                    <a 
                      href={log.url} 
                      target="_blank" 
                      referrerPolicy="no-referrer"
                      rel="noopener noreferrer" 
                      className="p-1.5 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-full transition-colors text-gray-500 hover:text-gray-900 dark:text-slate-400 dark:hover:text-slate-100"
                      title="Download uploaded file"
                    >
                      <Download size={16} />
                    </a>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <div className="flex justify-end pt-6 border-t border-gray-200 dark:border-slate-700">
        <button 
          onClick={handleSave}
          disabled={saving || uploading}
          className="bg-gray-900 text-white px-8 py-3 rounded-xl font-bold uppercase tracking-widest text-xs flex items-center gap-2 hover:bg-gray-800 transition-colors disabled:opacity-50"
        >
          {saving ? <Loader2 className="animate-spin" size={16} /> : <Save size={16} />}
          Save Profile
        </button>
      </div>
    </div>
  );
};
