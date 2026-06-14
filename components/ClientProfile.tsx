import React, { useState } from 'react';
import { User } from '../types';
import { saveUserProfile } from '../services/storageService';
import { uploadFileWithProgress } from '../services/fileUploadService';
import { auth } from '../services/firebase';
import { updateProfile } from 'firebase/auth';
import { Camera, Save, Loader2, Bell, BellOff, User as UserIcon } from 'lucide-react';

interface ClientProfileProps {
  user: User;
}

export const ClientProfile: React.FC<ClientProfileProps> = ({ user }) => {
  const [name, setName] = useState(user.name);
  const [avatar, setAvatar] = useState(user.avatar);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [emailNotifications, setEmailNotifications] = useState(user.emailNotifications !== false);

  const handleAvatarUpload = async (file: File) => {
    setUploading(true);
    try {
      const path = `avatars/${user.id}_${Date.now()}`;
      const url = await uploadFileWithProgress(file, path, () => {});
      setAvatar(url);
    } catch (e) {
      console.error(e);
      alert('Failed to upload avatar.');
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
        emailNotifications
      });
      alert('Profile updated successfully!');
    } catch (e) {
      console.error(e);
      alert('Failed to save profile.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="bg-white/80 backdrop-blur-xl border border-gray-300 rounded-3xl p-8 shadow-[0_8px_32px_rgba(0,0,0,0.12)] max-w-3xl mx-auto space-y-8 mt-4">
      <div className="flex items-center gap-4 border-b border-gray-200 pb-6 mb-6">
        <UserIcon size={24} className="text-gray-900" />
        <h2 className="text-2xl font-bold font-display text-gray-900">Client Profile</h2>
      </div>

      <div className="flex flex-col md:flex-row gap-8 items-start">
        <div className="flex flex-col items-center gap-4">
          <div className="relative w-32 h-32 rounded-full overflow-hidden border-4 border-white shadow-lg bg-gray-100 flex items-center justify-center">
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
            <label className="block text-sm font-bold text-gray-700 mb-2 uppercase tracking-widest text-xs">Display Name</label>
            <input 
              type="text" 
              value={name} 
              onChange={(e) => setName(e.target.value)}
              className="w-full border border-gray-300 rounded-xl px-4 py-3 outline-none focus:border-purple-500 bg-white font-medium text-gray-900 transition-colors"
            />
          </div>

          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2 uppercase tracking-widest text-xs">Email Address</label>
            <input 
              type="text" 
              value={user.email} 
              disabled
              className="w-full border border-gray-200 rounded-xl px-4 py-3 bg-gray-100 font-medium text-gray-500 cursor-not-allowed"
            />
          </div>
        </div>
      </div>

      <div className="border-t border-gray-200 pt-8 mt-8">
        <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
          {emailNotifications ? <Bell size={20} className="text-purple-600"/> : <BellOff size={20} className="text-gray-400"/>} Notification Settings
        </h3>
        
        <label className="flex items-center justify-between cursor-pointer group bg-gray-50 border border-gray-200 p-4 rounded-2xl hover:bg-white transition-colors hover:border-gray-300">
           <div className="flex flex-col">
              <span className="font-bold text-gray-900 text-sm">Order Status Updates</span>
              <span className="text-xs text-gray-500 font-medium">Receive an email when your project status changes</span>
           </div>
           <div className="relative inline-flex items-center">
              <input type="checkbox" checked={emailNotifications} onChange={e => setEmailNotifications(e.target.checked)} className="sr-only peer" />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-600"></div>
           </div>
        </label>
      </div>

      <div className="flex justify-end pt-6 border-t border-gray-200">
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
