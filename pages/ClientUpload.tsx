import React, { useState } from 'react';
import { Upload, X, CheckCircle2, Loader2, File, Image as ImageIcon, Film, FileText, AlertCircle } from 'lucide-react';
import { collection, addDoc } from 'firebase/firestore';
import { ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';
import { db, storage } from '../services/firebase';
import toast from 'react-hot-toast';
import { User } from '../types';
import { sendClientUploadNotification } from '../services/telegramService';

export const ClientUpload: React.FC<{ user?: User | null }> = ({ user }) => {
  const [formData, setFormData] = useState({
    clientName: user?.name || '',
    email: user?.email || '',
    whatsapp: user?.mobiles?.[0] || '',
    eventName: '',
  });

  React.useEffect(() => {
    if (user) {
      setFormData(prev => ({
        ...prev,
        clientName: prev.clientName || user.name || '',
        email: prev.email || user.email || '',
        whatsapp: prev.whatsapp || (user.mobiles?.[0] || ''),
      }));
    }
  }, [user]);

  const [files, setFiles] = useState<{ file: File; progress: number; status: 'pending' | 'uploading' | 'completed' | 'error'; url?: string }[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newFiles = Array.from(e.target.files).map(file => ({
        file,
        progress: 0,
        status: 'pending' as const
      }));
      setFiles(prev => [...prev, ...newFiles]);
    }
  };

  const removeFile = (index: number) => {
    setFiles(prev => prev.filter((_, i) => i !== index));
  };

  const getFileIcon = (type: string) => {
    if (type.startsWith('image/')) return <ImageIcon size={24} className="text-blue-500" />;
    if (type.startsWith('video/')) return <Film size={24} className="text-purple-500" />;
    return <FileText size={24} className="text-gray-500" />;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.clientName || !formData.whatsapp || !formData.eventName) {
      toast.error('Please fill in all required fields');
      return;
    }
    if (files.length === 0) {
      toast.error('Please select at least one file to upload');
      return;
    }

    setIsSubmitting(true);

    try {
      const uploadedFiles: { name: string; url: string; size: number; type: string }[] = [];
      const updatedFiles = [...files];

      // Upload files to Firebase Storage
      for (let i = 0; i < files.length; i++) {
        const fileObj = files[i];
        if (fileObj.status === 'completed') {
            if (fileObj.url) uploadedFiles.push({ name: fileObj.file.name, url: fileObj.url, size: fileObj.file.size, type: fileObj.file.type });
            continue;
        }

        updatedFiles[i].status = 'uploading';
        setFiles([...updatedFiles]);

        const storageRef = ref(storage, `client_uploads/${formData.eventName.replace(/[^a-zA-Z0-9]/g, '_')}_${Date.now()}/${fileObj.file.name}`);
        const uploadTask = uploadBytesResumable(storageRef, fileObj.file);

        await new Promise<void>((resolve, reject) => {
          uploadTask.on('state_changed', 
            (snapshot) => {
              const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
              updatedFiles[i].progress = progress;
              setFiles([...updatedFiles]);
            },
            (error) => {
              updatedFiles[i].status = 'error';
              setFiles([...updatedFiles]);
              toast.error(`Error uploading ${fileObj.file.name}`);
              reject(error);
            },
            async () => {
              const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
              updatedFiles[i].status = 'completed';
              updatedFiles[i].url = downloadURL;
              updatedFiles[i].progress = 100;
              setFiles([...updatedFiles]);
              
              uploadedFiles.push({
                name: fileObj.file.name,
                url: downloadURL,
                size: fileObj.file.size,
                type: fileObj.file.type,
              });
              resolve();
            }
          );
        });
      }

      // Save to Firestore
      await addDoc(collection(db, 'client_uploads'), {
        ...formData,
        files: uploadedFiles,
        status: 'new',
        createdAt: new Date().toISOString(),
      });

      // Send telegram notification to admins
      try {
        await sendClientUploadNotification({
          clientName: formData.clientName,
          email: formData.email,
          whatsapp: formData.whatsapp,
          eventName: formData.eventName,
          filesCount: uploadedFiles.length
        });
      } catch (notifyError) {
        console.error("Failed to send admin notification:", notifyError);
      }

      setIsSuccess(true);
      toast.success('Files uploaded successfully!');
      
    } catch (error) {
      console.error("Upload failed", error);
      toast.error('Upload failed. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isSuccess) {
    return (
      <div className="min-h-screen pt-32 pb-24 bg-gray-50 dark:bg-zinc-900 flex items-center justify-center px-4">
        <div className="max-w-md w-full bg-white dark:bg-zinc-800 rounded-3xl p-12 text-center shadow-2xl border border-gray-100 dark:border-zinc-700">
          <div className="w-24 h-24 bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle2 size={48} />
          </div>
          <h2 className="text-3xl font-display font-bold text-gray-900 dark:text-white mb-4">Upload Complete!</h2>
          <p className="text-gray-500 dark:text-gray-400 mb-8">Thank you, {formData.clientName}. Your files have been successfully uploaded and we will review them shortly.</p>
          <button 
            onClick={() => {
              setIsSuccess(false);
              setFormData({ clientName: '', email: '', whatsapp: '', eventName: '' });
              setFiles([]);
            }}
            className="w-full bg-gray-900 dark:bg-white text-white dark:text-gray-900 font-bold py-4 rounded-xl hover:bg-black dark:hover:bg-gray-100 transition-colors"
          >
            Upload More Files
          </button>
        </div>
      </div>
    );
  }

  const formatSize = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className="min-h-screen pt-32 pb-24 bg-gray-50 dark:bg-zinc-900 px-4 sm:px-6 lg:px-8 font-sans">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-display font-bold text-gray-900 dark:text-white mb-4 leading-tight">Send Us Your Files</h1>
          <p className="text-lg text-gray-500 dark:text-gray-400 max-w-2xl mx-auto">Upload your high-resolution assets, videos, or raw files securely. We support very large files for your events and projects.</p>
        </div>

        <div className="bg-white dark:bg-zinc-800 rounded-3xl shadow-xl border border-gray-100 dark:border-zinc-700 overflow-hidden">
          <form onSubmit={handleSubmit} className="p-8 md:p-12">
            
            {/* Form Fields */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
              <div>
                <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest mb-2">Client Name *</label>
                <input 
                  type="text" 
                  name="clientName"
                  value={formData.clientName}
                  onChange={handleInputChange}
                  required
                  placeholder="John Doe"
                  disabled={isSubmitting}
                  className="w-full border-b-2 border-gray-200 dark:border-zinc-700 focus:border-blue-500 bg-transparent py-3 text-lg font-medium text-gray-900 dark:text-white outline-none transition-colors"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest mb-2">Email Address (Optional)</label>
                <input 
                  type="email" 
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  placeholder="john@example.com"
                  disabled={isSubmitting}
                  className="w-full border-b-2 border-gray-200 dark:border-zinc-700 focus:border-blue-500 bg-transparent py-3 text-lg font-medium text-gray-900 dark:text-white outline-none transition-colors"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest mb-2">WhatsApp Number *</label>
                <input 
                  type="tel" 
                  name="whatsapp"
                  value={formData.whatsapp}
                  onChange={handleInputChange}
                  required
                  placeholder="+1 234 567 8900"
                  disabled={isSubmitting}
                  className="w-full border-b-2 border-gray-200 dark:border-zinc-700 focus:border-blue-500 bg-transparent py-3 text-lg font-medium text-gray-900 dark:text-white outline-none transition-colors"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest mb-2">Event / Project Name *</label>
                <input 
                  type="text" 
                  name="eventName"
                  value={formData.eventName}
                  onChange={handleInputChange}
                  required
                  placeholder="Summer Wedding 2024"
                  disabled={isSubmitting}
                  className="w-full border-b-2 border-gray-200 dark:border-zinc-700 focus:border-blue-500 bg-transparent py-3 text-lg font-medium text-gray-900 dark:text-white outline-none transition-colors"
                />
              </div>
            </div>

            {/* File Uploader */}
            <div className="mb-12">
              <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest mb-4">Files to Upload *</label>
              <div className={`border-2 border-dashed rounded-3xl p-12 text-center transition-all relative ${files.length > 0 ? 'bg-gray-50/50 dark:bg-zinc-900/50 border-gray-200 dark:border-zinc-700' : 'bg-gray-50 dark:bg-zinc-900 border-gray-300 dark:border-zinc-600 hover:border-blue-500'}`}>
                <input 
                  type="file" 
                  multiple 
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10" 
                  onChange={handleFileChange}
                  disabled={isSubmitting}
                />
                <div className="pointer-events-none">
                  <Upload className="mx-auto mb-4 text-blue-500 animate-pulse" size={48} />
                  <p className="text-xl font-bold text-gray-900 dark:text-white mb-2">Drag & Drop or Click to Add Files</p>
                  <p className="text-gray-500 dark:text-gray-400">Supports all file types. Large files will be uploaded securely.</p>
                </div>
              </div>

              {/* File List */}
              {files.length > 0 && (
                <div className="mt-8 space-y-4">
                  {files.map((fileObj, idx) => (
                    <div key={idx} className="bg-gray-50 dark:bg-zinc-900 rounded-2xl p-4 flex items-center gap-4 border border-gray-200 dark:border-zinc-700">
                      <div className="w-12 h-12 bg-white dark:bg-zinc-800 rounded-xl flex items-center justify-center shrink-0 shadow-sm">
                        {getFileIcon(fileObj.file.type)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex justify-between items-center mb-1">
                          <h4 className="font-semibold text-gray-900 dark:text-white truncate text-sm">{fileObj.file.name}</h4>
                          <span className="text-xs font-bold text-gray-500 dark:text-gray-400 font-mono ml-4">{formatSize(fileObj.file.size)}</span>
                        </div>
                        
                        <div className="relative h-2 bg-gray-200 dark:bg-zinc-700 rounded-full overflow-hidden mt-2">
                          <div 
                            className={`absolute top-0 left-0 h-full transition-all duration-300 ${fileObj.status === 'error' ? 'bg-red-500' : fileObj.status === 'completed' ? 'bg-green-500' : 'bg-blue-500'}`}
                            style={{ width: `${fileObj.progress}%` }}
                          ></div>
                        </div>
                        {fileObj.status === 'error' && <p className="text-xs text-red-500 mt-1 font-medium flex items-center gap-1"><AlertCircle size={12} /> Upload failed</p>}
                      </div>
                      
                      {!isSubmitting && fileObj.status !== 'completed' && (
                        <button 
                          type="button" 
                          onClick={() => removeFile(idx)}
                          className="w-8 h-8 flex items-center justify-center text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg transition-colors shrink-0"
                        >
                          <X size={20} />
                        </button>
                      )}
                      
                      {fileObj.status === 'completed' && (
                        <div className="w-8 h-8 flex items-center justify-center text-green-500 shrink-0">
                          <CheckCircle2 size={24} />
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            <button 
              type="submit"
              disabled={isSubmitting || files.length === 0}
              className={`w-full py-5 rounded-2xl font-bold uppercase tracking-widest text-sm flex items-center justify-center gap-3 transition-all ${
                isSubmitting || files.length === 0 
                  ? 'bg-gray-100 text-gray-400 dark:bg-zinc-800 dark:text-gray-500 cursor-not-allowed' 
                  : 'bg-blue-600 text-white hover:bg-blue-700 shadow-xl shadow-blue-600/20 hover:-translate-y-1'
              }`}
            >
              {isSubmitting ? (
                <>
                  <Loader2 size={20} className="animate-spin" />
                  Uploading Files... Please keep this page open
                </>
              ) : (
                <>
                  <Upload size={20} />
                  Submit Files
                </>
              )}
            </button>

          </form>
        </div>
      </div>
    </div>
  );
};
