import React, { useState, useEffect } from 'react';
import { useParams, Navigate, useSearchParams } from 'react-router-dom';
import { getSharedProject, SharedProject } from '../services/shareService';
import { getBrandCollaboration } from '../services/brandCollabService';
import { FileText, Image as ImageIcon, Video, Download, Lock, Mail, Loader2, ArrowLeft, ArrowDown, Folder } from 'lucide-react';
import { MediaRenderer } from '../components/MediaRenderer';
import JSZip from 'jszip';
import { handleSingleDownload, handleBulkDownload } from '../utils/downloadHelpers';
import { saveAs } from 'file-saver';

const getGreeting = () => {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 18) return 'Good afternoon';
  return 'Good evening';
};

export const SharedProjectView: React.FC = () => {
  const { shareId } = useParams<{ shareId: string }>();
  const [searchParams] = useSearchParams();
  const serviceId = searchParams.get('service');

  const [project, setProject] = useState<any | null>(null);
  const [activeService, setActiveService] = useState<any | null>(null);
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  const [passwordInput, setPasswordInput] = useState('');
  const [emailInput, setEmailInput] = useState('');
  const [accessGranted, setAccessGranted] = useState(false);
  const [verificationError, setVerificationError] = useState('');
  const [isDownloading, setIsDownloading] = useState(false);
  const [downloadProgress, setDownloadProgress] = useState(0);
  const [downloadTotal, setDownloadTotal] = useState(0);

  useEffect(() => {
    const fetchProject = async () => {
      if (!shareId) return;
      try {
        let data: any = await getSharedProject(shareId);
        if (!data) {
           data = await getBrandCollaboration(shareId);
           // normalize to match structure expected by the view if it's a collab
           if (data) {
              data = {
                 ...data,
                 clientName: data.brandName
              };
           }
        }
        
        if (data) {
          let targetAccessType = data.accessType;
          
          if (serviceId && data.services) {
            const foundService = data.services.find((s: any) => s.id === serviceId);
            if (foundService) {
              setActiveService(foundService);
              // Filter files strictly to this service's folder if folderName exists
              if (foundService.folderName) {
                data.files = data.files.filter((f: any) => f.folder === foundService.folderName);
              }
              // Use service-specific access control if it exists
              targetAccessType = foundService.accessType || 'public';
            }
          }
          
          setProject(data);
          
          if (targetAccessType === 'public') {
            setAccessGranted(true);
          }
        } else {
          setError('Shared project not found.');
        }
      } catch (err: any) {
        console.error(err);
        setError(`Error loading shared project: ${err.message || 'Unknown error'}`);
      } finally {
        setLoading(false);
      }
    };
    fetchProject();
  }, [shareId, serviceId]);

  const handleVerify = () => {
    if (!project) return;
    setVerificationError('');
    
    const targetAccessType = activeService ? (activeService.accessType || 'public') : project.accessType;
    const targetAccessValue = activeService ? (activeService.accessValue || '') : project.accessValue;

    if (targetAccessType === 'password') {
      if (passwordInput.trim() === targetAccessValue.trim()) {
        setAccessGranted(true);
      } else {
        setVerificationError('Incorrect password');
      }
    } else if (targetAccessType === 'email') {
      const allowedEntries = targetAccessValue
        .toLowerCase()
        .split(/[,;\n]+/)
        .map((item: string) => item.trim())
        .filter(Boolean);
        
      const clientInputClean = emailInput.toLowerCase().trim();
      
      // Keep only digits for phone number comparisons
      const cleanDigits = (str: string) => str.replace(/\D/g, '');
      const clientDigits = cleanDigits(clientInputClean);
      
      const isMatch = allowedEntries.some(allowed => {
        const allowedClean = allowed.trim();
        if (allowedClean === clientInputClean) return true;
        
        // If it's a numeric/phone number, compare parsed digits
        const allowedDigits = cleanDigits(allowedClean);
        if (clientDigits && allowedDigits && clientDigits === allowedDigits) {
          return true;
        }
        return false;
      });

      if (isMatch) {
        setAccessGranted(true);
      } else {
        setVerificationError('Email or phone does not match records');
      }
    }
  };

  const handleDownloadAll = async () => {
    if (!project || project.files.length === 0) return;
    setIsDownloading(true);
    setDownloadProgress(0);
    setDownloadTotal(project.files.length);
    
    await handleBulkDownload(
      project.files.map(f => ({ url: f.url, name: f.name })),
      `${project.clientName.replace(/\s+/g, '_')}_Files`,
      (prog) => setDownloadProgress(prog)
    );
    setIsDownloading(false);
  };

  if (loading) {
    return (
      <div className="py-24 bg-gray-50 dark:bg-zinc-900 flex items-center justify-center">
        <Loader2 size={40} className="animate-spin text-blue-600" />
      </div>
    );
  }

  if (error || !project) {
    const isPermissionError = error?.toLowerCase().includes('permission') || error?.toLowerCase().includes('insufficient');
    return (
      <div className="py-12 bg-gray-50 dark:bg-zinc-900 flex flex-col items-center justify-center p-4">
        <div className="bg-white dark:bg-zinc-800 p-8 rounded-2xl shadow-xl max-w-xl w-full border border-gray-200 dark:border-zinc-700 text-center">
          <div className="w-16 h-16 bg-red-100 dark:bg-red-900/30 text-red-600 rounded-full flex items-center justify-center mx-auto mb-6">
            <Lock size={32} />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Access Denied</h2>
          <p className="text-gray-500 dark:text-gray-400 mb-6">{error || 'This link is invalid or has expired.'}</p>
          
          {isPermissionError && (
            <div className="mb-6 text-left bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-900/50 p-5 rounded-xl text-sm">
              <h3 className="font-bold text-blue-800 dark:text-blue-300 mb-2">💡 Quick Fix for Developer</h3>
              <p className="text-blue-700 dark:text-blue-400 mb-3">
                Your live Firebase Console rules are restricting public access to shared links. To allow clients to view their portals, copy and paste these rules into your <b>Firebase Console &gt; Firestore Database &gt; Rules</b> tab:
              </p>
              <pre className="bg-gray-900 text-green-400 p-3 rounded font-mono text-xs overflow-x-auto max-h-40">
{`rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /shared_projects/{document} {
      allow read: if true;
      allow write: if request.auth != null;
    }
    match /brand_collaborations/{document} {
      allow read: if true;
      allow write: if request.auth != null;
    }
    match /{document=**} {
      allow read, write: if request.auth != null;
    }
  }
}`}
              </pre>
              <p className="text-xs text-blue-600 dark:text-blue-400/80 mt-2">
                Once saved in your Firebase Console, refresh this page and the shared portal will load instantly!
              </p>
            </div>
          )}

          <div className="flex gap-4 justify-center">
            <button onClick={() => window.location.href = '/'} className="bg-gray-100 dark:bg-zinc-700 text-gray-700 dark:text-gray-300 px-6 py-2 rounded-lg font-medium hover:bg-gray-200 dark:hover:bg-slate-600 transition-colors">Return Home</button>
          </div>
        </div>
      </div>
    );
  }

  if (!accessGranted) {
    const targetAccessType = activeService ? (activeService.accessType || 'public') : project.accessType;
    return (
      <div className="py-24 bg-gray-50 dark:bg-zinc-900 flex flex-col items-center justify-center p-6">
        <div className="bg-white dark:bg-zinc-800 p-8 rounded-2xl shadow-xl max-w-md w-full border border-gray-200 dark:border-zinc-700">
          <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900/30 text-blue-600 rounded-full flex items-center justify-center mx-auto mb-6">
            {targetAccessType === 'password' ? <Lock size={32} /> : <Mail size={32} />}
          </div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2 text-center leading-tight">
            {getGreeting()} {project.clientName}
          </h2>
          <p className="text-gray-500 dark:text-gray-400 mb-6 text-center">
            {activeService && <span className="block font-bold mb-2 text-blue-600">{activeService.serviceName}</span>}
            {targetAccessType === 'password' ? 'Please enter the password to access your files.' : 'Please verify your identity to access your files.'}
          </p>
          
          <div className="space-y-4">
            {targetAccessType === 'password' ? (
              <input 
                type="password" 
                placeholder="Enter Password" 
                value={passwordInput}
                onChange={(e) => setPasswordInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleVerify()}
                className="w-full bg-gray-50 dark:bg-zinc-900 border border-gray-200 dark:border-zinc-700 rounded-lg p-3 text-gray-900 dark:text-white focus:outline-none focus:border-blue-500"
              />
            ) : (
              <input 
                type="text" 
                placeholder="Enter Email or Phone Number" 
                value={emailInput}
                onChange={(e) => setEmailInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleVerify()}
                className="w-full bg-gray-50 dark:bg-zinc-900 border border-gray-200 dark:border-zinc-700 rounded-lg p-3 text-gray-900 dark:text-white focus:outline-none focus:border-blue-500"
              />
            )}
            
            {verificationError && <p className="text-red-500 text-sm text-center font-medium">{verificationError}</p>}
            
            <button 
              onClick={handleVerify} 
              className="w-full bg-blue-600 text-white font-bold py-3 rounded-lg hover:bg-blue-700 transition-colors shadow-lg shadow-blue-600/20"
            >
              Unlock Files
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="py-24 bg-gray-50 dark:bg-zinc-900 px-4 sm:px-6">
      <div className="max-w-6xl mx-auto">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-8 gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-white dark:bg-zinc-800 rounded-full border border-gray-200 dark:border-zinc-700 text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest mb-4">
              <Lock size={12} /> Secure Share
            </div>
            <h1 className="text-3xl md:text-4xl font-display font-bold text-gray-900 dark:text-white max-w-2xl leading-tight">
              {getGreeting()} {project.clientName},<br/>download your project files here
            </h1>
            <p className="text-gray-500 dark:text-gray-400 mt-4 text-lg">Shared on {new Date(project.createdAt).toLocaleDateString()}</p>
            
            {/* Shared Deliverables Info Block */}
            <div className="mt-5 p-4 bg-white dark:bg-zinc-800 rounded-2xl border border-gray-100 dark:border-zinc-700 shadow-sm max-w-lg">
              <span className="text-xs font-bold uppercase tracking-wider text-gray-400 dark:text-gray-500 block mb-1">
                Shared Files Summary
              </span>
              <div className="flex items-center gap-2">
                <span className="text-xl">📁</span>
                <p className="text-base font-bold text-gray-800 dark:text-zinc-200">
                  {activeService 
                    ? (activeService.sharedDeliverables ? activeService.sharedDeliverables : `Files for: ${activeService.serviceName}`)
                    : "All Project Files"
                  }
                </p>
              </div>
            </div>
          </div>
          
          {project.files.length > 0 && (
            <button 
              onClick={handleDownloadAll}
              disabled={isDownloading}
              className={`flex items-center gap-2 bg-gray-900 dark:bg-white text-white dark:text-slate-900 px-6 py-3 rounded-xl font-bold shadow-xl transition-all ${isDownloading ? 'opacity-70 cursor-not-allowed' : 'hover:-translate-y-1'}`}
            >
              {isDownloading ? (
                <><Loader2 size={18} className="animate-spin" /> Preparing {downloadProgress}/{downloadTotal}...</>
              ) : (
                <><ArrowDown size={18} /> Download All ({project.files.length})</>
              )}
            </button>
          )}
        </div>

        {project.files.length === 0 ? (
          <div className="bg-white dark:bg-zinc-800 rounded-2xl border border-dashed border-gray-300 dark:border-zinc-700 p-12 text-center text-gray-500 dark:text-gray-400">
            No files have been uploaded to this project yet.
          </div>
        ) : (
          <div className="space-y-12">
            {Array.from(new Set(['Unsorted', ...(project.folders || ['Raw Assets', 'References', 'Final Exports'])])).map(folder => {
              const folderFiles = project.files.filter((f: any) => (f.folder || 'Unsorted') === folder);
              if (folderFiles.length === 0) return null;
              
              return (
                <div key={folder}>
                  {folder !== 'Unsorted' && <h3 className="text-xl font-display font-bold text-gray-900 dark:text-white mb-6 border-b border-gray-200 dark:border-zinc-700 pb-2">{folder}</h3>}
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {folderFiles.map((file, idx) => {
                      const isImage = (file.type || "").startsWith('image/');
                      const isVideo = (file.type || "").startsWith('video/');
                      
                      return (
                        <div key={idx} className="bg-white dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-2xl overflow-hidden shadow-sm group hover:shadow-xl transition-all">
                          
                          {/* Preview Area */}
                          <div className="h-48 w-full bg-gray-100 dark:bg-zinc-900 flex items-center justify-center relative overflow-hidden">
                            {(isImage || isVideo) ? (
                              <MediaRenderer 
                                src={file.url} 
                                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                              />
                            ) : (
                              <FileText size={48} className="text-gray-300 dark:text-slate-700" />
                            )}
                            
                            {/* Hover Overlay */}
                            <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-4 backdrop-blur-sm">
                               <a
                                 href={file.url}
                                 target="_blank"
                                 rel="noreferrer"
                                 className="w-12 h-12 bg-white rounded-full flex items-center justify-center text-gray-900 hover:scale-110 transition-transform"
                                 title="Preview"
                               >
                                 {(isImage || isVideo) ? <ImageIcon size={20} /> : <FileText size={20} />}
                               </a>
                               <button 
                                 onClick={(e) => {
                                   e.stopPropagation();
                                   handleSingleDownload(file.url, file.name);
                                 }}
                                 className="w-12 h-12 bg-blue-600 text-white rounded-full flex items-center justify-center hover:scale-110 transition-transform"
                                 title="Download"
                               >
                                 <Download size={20} />
                               </button>
                            </div>
                          </div>
                          
                          {/* File Info */}
                          <div className="p-4 border-t border-gray-100 dark:border-zinc-700">
                            <h3 className="font-semibold text-gray-900 dark:text-white truncate mb-1" title={file.name}>{file.name}</h3>
                            <div className="flex justify-between items-center text-xs text-gray-500 dark:text-gray-400 font-mono">
                              <span className="uppercase">{(file.type || '').split('/')[1] || 'FILE'}</span>
                              <span>{(file.size / (1024 * 1024)).toFixed(2)} MB</span>
                            </div>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
