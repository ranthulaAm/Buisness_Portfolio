import React, { useState, useEffect } from 'react';
import { useParams, Navigate } from 'react-router-dom';
import { getSharedProject, SharedProject } from '../services/shareService';
import { FileText, Image as ImageIcon, Video, Download, Lock, Mail, Loader2, ArrowLeft, ArrowDown } from 'lucide-react';
import { MediaRenderer } from '../components/MediaRenderer';
import JSZip from 'jszip';
import { saveAs } from 'file-saver';

const getGreeting = () => {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 18) return 'Good afternoon';
  return 'Good evening';
};

export const SharedProjectView: React.FC = () => {
  const { shareId } = useParams<{ shareId: string }>();
  const [project, setProject] = useState<SharedProject | null>(null);
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
        const data = await getSharedProject(shareId);
        if (data) {
          setProject(data);
          if (data.accessType === 'public') {
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
  }, [shareId]);

  const handleVerify = () => {
    if (!project) return;
    setVerificationError('');
    if (project.accessType === 'password') {
      if (passwordInput === project.accessValue) {
        setAccessGranted(true);
      } else {
        setVerificationError('Incorrect password');
      }
    } else if (project.accessType === 'email') {
      if (emailInput.toLowerCase().trim() === project.accessValue.toLowerCase().trim()) {
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
    try {
      const zip = new JSZip();
      let successfulFiles = 0;
      
      const filePromises = project.files.map(async (file) => {
        try {
          // Fetch the file through our server proxy to avoid Firebase Storage CORS issues
          const response = await fetch(`/api/proxy-download?url=${encodeURIComponent(file.url)}`);
          if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
          const blob = await response.blob();
          zip.file(file.name, blob);
          successfulFiles++;
          setDownloadProgress(prev => prev + 1);
        } catch (err) {
          console.error(`Failed to download ${file.name}:`, err);
          setDownloadProgress(prev => prev + 1);
        }
      });
      
      await Promise.all(filePromises);
      
      if (successfulFiles === 0) {
        alert("Could not download any files. Please try downloading them individually.");
        return;
      }
      
      const zipBlob = await zip.generateAsync({ type: 'blob' });
      saveAs(zipBlob, `${project.clientName.replace(/\s+/g, '_')}_files.zip`);
    } catch (error) {
      console.error("Error creating zip file:", error);
      alert("An error occurred while creating the zip file.");
    } finally {
      setIsDownloading(false);
    }
  };

  
  const handleSingleDownload = (url: string, filename: string) => {
    const downloadUrl = `/api/proxy-download?url=${encodeURIComponent(url)}&filename=${encodeURIComponent(filename)}`;
    const a = document.createElement('a');
    a.href = downloadUrl;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  if (loading) {
    return (
      <div className="py-24 bg-gray-50 dark:bg-slate-900 flex items-center justify-center">
        <Loader2 size={40} className="animate-spin text-blue-600" />
      </div>
    );
  }

  if (error || !project) {
    return (
      <div className="py-24 bg-gray-50 dark:bg-slate-900 flex flex-col items-center justify-center p-6 text-center">
        <div className="bg-white dark:bg-slate-800 p-8 rounded-2xl shadow-xl max-w-md w-full border border-gray-200 dark:border-slate-700">
          <div className="w-16 h-16 bg-red-100 dark:bg-red-900/30 text-red-600 rounded-full flex items-center justify-center mx-auto mb-6">
            <Lock size={32} />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-slate-100 mb-2">Access Denied</h2>
          <p className="text-gray-500 dark:text-slate-400 mb-8">{error || 'This link is invalid or has expired.'}</p>
          <button onClick={() => window.location.href = '/'} className="bg-gray-100 dark:bg-slate-700 text-gray-700 dark:text-slate-300 px-6 py-2 rounded-lg font-medium hover:bg-gray-200 dark:hover:bg-slate-600 transition-colors">Return Home</button>
        </div>
      </div>
    );
  }

  if (!accessGranted) {
    return (
      <div className="py-24 bg-gray-50 dark:bg-slate-900 flex flex-col items-center justify-center p-6">
        <div className="bg-white dark:bg-slate-800 p-8 rounded-2xl shadow-xl max-w-md w-full border border-gray-200 dark:border-slate-700">
          <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900/30 text-blue-600 rounded-full flex items-center justify-center mx-auto mb-6">
            {project.accessType === 'password' ? <Lock size={32} /> : <Mail size={32} />}
          </div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-slate-100 mb-2 text-center leading-tight">
            {getGreeting()} {project.clientName}
          </h2>
          <p className="text-gray-500 dark:text-slate-400 mb-6 text-center">
            {project.accessType === 'password' ? 'Please enter the password to access your files.' : 'Please verify your identity to access your files.'}
          </p>
          
          <div className="space-y-4">
            {project.accessType === 'password' ? (
              <input 
                type="password" 
                placeholder="Enter Password" 
                value={passwordInput}
                onChange={(e) => setPasswordInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleVerify()}
                className="w-full bg-gray-50 dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-lg p-3 text-gray-900 dark:text-slate-100 focus:outline-none focus:border-blue-500"
              />
            ) : (
              <input 
                type="text" 
                placeholder="Enter Email or Phone Number" 
                value={emailInput}
                onChange={(e) => setEmailInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleVerify()}
                className="w-full bg-gray-50 dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-lg p-3 text-gray-900 dark:text-slate-100 focus:outline-none focus:border-blue-500"
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
    <div className="py-24 bg-gray-50 dark:bg-slate-900 px-4 sm:px-6">
      <div className="max-w-6xl mx-auto">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-8 gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-white dark:bg-slate-800 rounded-full border border-gray-200 dark:border-slate-700 text-xs font-bold text-gray-500 dark:text-slate-400 uppercase tracking-widest mb-4">
              <Lock size={12} /> Secure Share
            </div>
            <h1 className="text-3xl md:text-4xl font-display font-bold text-gray-900 dark:text-slate-100 max-w-2xl leading-tight">
              {getGreeting()} {project.clientName},<br/>download your project files here
            </h1>
            <p className="text-gray-500 dark:text-slate-400 mt-4 text-lg">Shared on {new Date(project.createdAt).toLocaleDateString()}</p>
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
          <div className="bg-white dark:bg-slate-800 rounded-2xl border border-dashed border-gray-300 dark:border-slate-700 p-12 text-center text-gray-500 dark:text-slate-400">
            No files have been uploaded to this project yet.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {project.files.map((file, idx) => {
              const isImage = (file.type || "").startsWith('image/');
              const isVideo = (file.type || "").startsWith('video/');
              
              return (
                <div key={idx} className="bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-2xl overflow-hidden shadow-sm group hover:shadow-xl transition-all">
                  
                  {/* Preview Area */}
                  <div className="h-48 w-full bg-gray-100 dark:bg-slate-900 flex items-center justify-center relative overflow-hidden">
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
                  <div className="p-4 border-t border-gray-100 dark:border-slate-700">
                    <h3 className="font-semibold text-gray-900 dark:text-slate-100 truncate mb-1" title={file.name}>{file.name}</h3>
                    <div className="flex justify-between items-center text-xs text-gray-500 dark:text-slate-400 font-mono">
                      <span className="uppercase">{(file.type || '').split('/')[1] || 'FILE'}</span>
                      <span>{(file.size / (1024 * 1024)).toFixed(2)} MB</span>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  );
};
