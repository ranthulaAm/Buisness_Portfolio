import React, { useState, useEffect } from 'react';
import { collection, query, orderBy, onSnapshot, doc, updateDoc, deleteDoc } from 'firebase/firestore';
import { db } from '../services/firebase';
import { Loader2, Download, Trash2, CheckCircle2, Clock, User, Phone, Mail, Calendar, ExternalLink } from 'lucide-react';
import toast from 'react-hot-toast';
import { ConfirmationDialog } from './ConfirmationDialog';

export const AdminClientUploads: React.FC = () => {
  const [uploads, setUploads] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [itemToDelete, setItemToDelete] = useState<string | null>(null);

  useEffect(() => {
    const q = query(collection(db, 'client_uploads'), orderBy('createdAt', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setUploads(data);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const handleStatusChange = async (id: string, currentStatus: string) => {
    try {
      const newStatus = currentStatus === 'new' ? 'reviewed' : 'new';
      await updateDoc(doc(db, 'client_uploads', id), {
        status: newStatus
      });
      toast.success('Status updated');
    } catch (e) {
      toast.error('Failed to update status');
    }
  };

  const handleDelete = async () => {
    if (!itemToDelete) return;
    try {
      await deleteDoc(doc(db, 'client_uploads', itemToDelete));
      toast.success('Upload record deleted');
      setItemToDelete(null);
    } catch (e) {
      toast.error('Failed to delete record');
    }
  };

  const formatSize = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  if (loading) {
    return <div className="flex justify-center p-12"><Loader2 className="animate-spin text-blue-500" size={32} /></div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-display font-bold text-gray-900 dark:text-slate-100">Client Uploads</h2>
      </div>

      {uploads.length === 0 ? (
        <div className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-xl p-12 text-center text-gray-500 dark:text-slate-400">
          No client uploads found.
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
          {uploads.map((upload) => (
            <div key={upload.id} className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-xl overflow-hidden shadow-sm flex flex-col">
              <div className="p-5 border-b border-gray-100 dark:border-slate-800 flex justify-between items-start">
                <div>
                  <h3 className="font-bold text-lg text-gray-900 dark:text-slate-100 mb-1 flex items-center gap-2">
                    {upload.eventName}
                    {upload.status === 'new' && <span className="bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 text-[10px] uppercase font-bold px-2 py-0.5 rounded-full">New</span>}
                  </h3>
                  <div className="text-xs text-gray-500 dark:text-slate-400 flex items-center gap-1">
                    <Calendar size={12} /> {new Date(upload.createdAt).toLocaleString()}
                  </div>
                </div>
                <button 
                  onClick={() => handleStatusChange(upload.id, upload.status)}
                  className={`p-2 rounded-lg transition-colors ${upload.status === 'new' ? 'bg-gray-100 dark:bg-slate-800 text-gray-500 hover:text-green-600' : 'bg-green-100 dark:bg-green-900/30 text-green-600'}`}
                  title={upload.status === 'new' ? 'Mark as Reviewed' : 'Mark as New'}
                >
                  <CheckCircle2 size={18} />
                </button>
              </div>

              <div className="p-5 flex-grow">
                <div className="space-y-3 mb-6">
                  <div className="flex items-center gap-3 text-sm text-gray-700 dark:text-slate-300">
                    <User size={16} className="text-gray-400" />
                    <span className="font-medium">{upload.clientName}</span>
                  </div>
                  {upload.email && (
                    <div className="flex items-center gap-3 text-sm text-gray-700 dark:text-slate-300">
                      <Mail size={16} className="text-gray-400" />
                      <a href={`mailto:${upload.email}`} className="hover:text-blue-500">{upload.email}</a>
                    </div>
                  )}
                  <div className="flex items-center gap-3 text-sm text-gray-700 dark:text-slate-300">
                    <Phone size={16} className="text-gray-400" />
                    <a href={`https://wa.me/${upload.whatsapp.replace(/\D/g,'')}`} target="_blank" rel="noreferrer" className="hover:text-green-500">{upload.whatsapp}</a>
                  </div>
                </div>

                <div className="border border-gray-100 dark:border-slate-800 rounded-lg overflow-hidden">
                  <div className="bg-gray-50 dark:bg-slate-800 p-2 text-xs font-bold text-gray-500 uppercase tracking-wider flex justify-between items-center">
                    <span>{upload.files?.length || 0} Files</span>
                  </div>
                  <div className="divide-y divide-gray-100 dark:divide-slate-800 max-h-48 overflow-y-auto">
                    {(upload.files || []).map((file: any, idx: number) => (
                      <div key={idx} className="p-3 flex justify-between items-center hover:bg-gray-50 dark:hover:bg-slate-800/50 transition-colors group">
                        <div className="flex-1 min-w-0 pr-4">
                          <p className="text-sm font-medium text-gray-900 dark:text-slate-100 truncate" title={file.name}>{file.name}</p>
                          <p className="text-xs text-gray-500 dark:text-slate-400">{formatSize(file.size || 0)}</p>
                        </div>
                        <a 
                          href={file.url} 
                          target="_blank" 
                          rel="noreferrer"
                          className="p-2 bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <Download size={16} />
                        </a>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="p-4 border-t border-gray-100 dark:border-slate-800 bg-gray-50 dark:bg-slate-800/50 flex justify-end">
                <button 
                  onClick={() => setItemToDelete(upload.id)}
                  className="text-red-500 hover:bg-red-50 dark:hover:bg-red-900/30 p-2 rounded-lg transition-colors flex items-center gap-2 text-sm font-bold"
                >
                  <Trash2 size={16} /> Delete Record
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <ConfirmationDialog
        isOpen={!!itemToDelete}
        title="Delete Upload Record"
        message="Are you sure you want to delete this record? This will not delete the actual files from Firebase Storage, only the record of them."
        confirmText="Yes, Delete"
        cancelText="Cancel"
        onConfirm={handleDelete}
        onCancel={() => setItemToDelete(null)}
        type="danger"
      />
    </div>
  );
};
