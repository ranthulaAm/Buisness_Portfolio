import React, { useState, useEffect } from 'react';
import { SharedProject, listenToSharedProjects, createSharedProject, updateSharedProject, deleteSharedProject, uploadShareFile, SharedFile } from '../services/shareService';
import { Plus, Trash2, Link as LinkIcon, FileText, Image as ImageIcon, Video, Loader2, Copy, Lock, Mail, Globe, Save, Eye, EyeOff } from 'lucide-react';
import { ConfirmModal } from './ConfirmModal';

export const AdminShares: React.FC = () => {
  const [projects, setProjects] = useState<SharedProject[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [newProjectName, setNewProjectName] = useState('');
  const [accessType, setAccessType] = useState<'public' | 'email' | 'password'>('public');
  const [accessValue, setAccessValue] = useState('');
  
  const [editingProject, setEditingProject] = useState<SharedProject | null>(null);
  const [uploadProgress, setUploadProgress] = useState<{[key: string]: number}>({});
  
  const [deleteConfirm, setDeleteConfirm] = useState<SharedProject | null>(null);
  const [copySuccess, setCopySuccess] = useState('');
  const [showPasswords, setShowPasswords] = useState<{[key: string]: boolean}>({});
  const [showNewPassword, setShowNewPassword] = useState(false);

  useEffect(() => {
    const unsub = listenToSharedProjects((data) => {
      setProjects(data);
      setLoading(false);
      // Update editing project if it exists
      if (editingProject) {
        const updated = data.find(p => p.id === editingProject.id);
        if (updated) setEditingProject(updated);
      }
    });
    return unsub;
  }, [editingProject]);

  const handleCreate = async () => {
    if (!newProjectName) return;
    try {
      await createSharedProject({
        clientName: newProjectName,
        accessType,
        accessValue,
        files: []
      });
      setIsCreating(false);
      setNewProjectName('');
      setAccessType('public');
      setAccessValue('');
    } catch (e) {
      console.error(e);
      alert('Failed to create project share');
    }
  };

  const handleUpdateSettings = async (id: string, type: 'public'|'email'|'password', value: string) => {
    await updateSharedProject(id, { accessType: type, accessValue: value });
  };

  const handleDelete = async () => {
    if (deleteConfirm) {
      await deleteSharedProject(deleteConfirm);
      setDeleteConfirm(null);
      if (editingProject?.id === deleteConfirm.id) {
        setEditingProject(null);
      }
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, projectId: string) => {
    if (!e.target.files || e.target.files.length === 0) return;
    const project = projects.find(p => p.id === projectId);
    if (!project) return;
    
    const filesToUpload = Array.from(e.target.files);
    let currentFiles = [...project.files];
    
    for (const file of filesToUpload) {
      try {
        setUploadProgress(prev => ({ ...prev, [file.name]: 0 }));
        const uploadedFile = await uploadShareFile(projectId, file, (prog) => {
          setUploadProgress(prev => ({ ...prev, [file.name]: prog }));
        });
        
        currentFiles = [...currentFiles, uploadedFile];
        await updateSharedProject(projectId, { files: currentFiles });
      } catch (err) {
        console.error("Upload failed", err);
      } finally {
        setUploadProgress(prev => {
          const newProg = { ...prev };
          delete newProg[file.name];
          return newProg;
        });
      }
    }
    
    e.target.value = "";
  };

  const deleteFile = async (projectId: string, fileUrl: string) => {
    const project = projects.find(p => p.id === projectId);
    if (!project) return;
    const newFiles = project.files.filter(f => f.url !== fileUrl);
    await updateSharedProject(projectId, { files: newFiles });
  };

  const copyLink = (id: string) => {
    const url = `${window.location.origin}/#/share/${id}`;
    navigator.clipboard.writeText(url);
    setCopySuccess(id);
    setTimeout(() => setCopySuccess(''), 2000);
  };

  if (loading) return <div className="p-8 text-center text-gray-500">Loading shared projects...</div>;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-slate-100">Client File Shares</h2>
          <p className="text-sm text-gray-500 dark:text-slate-400">Share project files securely with clients</p>
        </div>
        <button 
          onClick={() => setIsCreating(true)}
          className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors font-medium text-sm"
        >
          <Plus size={16} /> New Share
        </button>
      </div>

      {isCreating && (
        <div className="bg-white dark:bg-slate-900 p-6 rounded-xl border border-gray-200 dark:border-slate-700 shadow-sm space-y-4 mb-8">
          <h3 className="font-bold text-lg text-gray-900 dark:text-slate-100">Create New Share Link</h3>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">Project / Client Name</label>
              <input 
                type="text" 
                value={newProjectName} 
                onChange={(e) => setNewProjectName(e.target.value)}
                placeholder="e.g. Acme Corp Rebrand" 
                className="w-full bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-lg p-3 text-gray-900 dark:text-slate-100"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-2">Access Control</label>
              <div className="flex gap-4">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="radio" checked={accessType === 'public'} onChange={() => setAccessType('public')} className="text-blue-600" />
                  <span className="text-sm text-gray-700 dark:text-slate-300 flex items-center gap-1"><Globe size={14}/> Anyone with link</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="radio" checked={accessType === 'email'} onChange={() => setAccessType('email')} className="text-blue-600" />
                  <span className="text-sm text-gray-700 dark:text-slate-300 flex items-center gap-1"><Mail size={14}/> Email/Phone</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="radio" checked={accessType === 'password'} onChange={() => {
                    setAccessType('password');
                    setAccessValue(Math.random().toString(36).substring(2, 8)); // auto generate
                  }} className="text-blue-600" />
                  <span className="text-sm text-gray-700 dark:text-slate-300 flex items-center gap-1"><Lock size={14}/> Password</span>
                </label>
              </div>
            </div>
            
            {accessType !== 'public' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">
                  {accessType === 'email' ? 'Allowed Email/Phone' : 'Access Password (give this to client)'}
                </label>
                <div className="relative">
                  <input 
                    type={accessType === 'password' && !showNewPassword ? 'password' : 'text'}
                    value={accessValue} 
                    onChange={(e) => setAccessValue(e.target.value)}
                    className="w-full bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-lg p-3 text-gray-900 dark:text-slate-100 font-mono pr-12"
                  />
                  {accessType === 'password' && (
                    <button 
                      onClick={() => setShowNewPassword(!showNewPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                    >
                      {showNewPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                    </button>
                  )}
                </div>
              </div>
            )}
            
            <div className="flex justify-end gap-3 pt-2">
              <button onClick={() => setIsCreating(false)} className="px-4 py-2 text-sm text-gray-500 hover:text-gray-700 dark:text-slate-400">Cancel</button>
              <button onClick={handleCreate} disabled={!newProjectName} className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium disabled:opacity-50">Create</button>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 gap-4">
        {projects.length === 0 && !isCreating && (
          <div className="text-center py-12 bg-white dark:bg-slate-900 rounded-xl border border-dashed border-gray-300 dark:border-slate-700 text-gray-500">
            No shared projects yet. Create one to share files with clients.
          </div>
        )}
        
        {projects.map(project => (
          <div key={project.id} className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-xl overflow-hidden shadow-sm">
            {/* Header */}
            <div className="p-4 md:p-6 border-b border-gray-100 dark:border-slate-700 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              <div>
                <h3 className="font-bold text-lg text-gray-900 dark:text-slate-100 mb-1">{project.clientName}</h3>
                <div className="flex items-center gap-3 text-xs text-gray-500 dark:text-slate-400">
                  <span className="flex items-center gap-1">
                    {project.accessType === 'public' && <Globe size={12}/>}
                    {project.accessType === 'email' && <Mail size={12}/>}
                    {project.accessType === 'password' && <Lock size={12}/>}
                    {project.accessType.toUpperCase()}
                  </span>
                  <span>•</span>
                  <span>{project.files.length} files</span>
                  <span>•</span>
                  <span>{new Date(project.createdAt).toLocaleDateString()}</span>
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <button 
                  onClick={() => copyLink(project.id)}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-100 dark:bg-slate-800 hover:bg-gray-200 dark:hover:bg-slate-700 text-gray-700 dark:text-slate-300 rounded text-sm transition-colors"
                >
                  {copySuccess === project.id ? <span className="text-green-600 font-medium">Copied!</span> : <><LinkIcon size={14}/> Copy Link</>}
                </button>
                <button 
                  onClick={() => setEditingProject(editingProject?.id === project.id ? null : project)}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400 rounded hover:bg-blue-100 dark:hover:bg-blue-900/50 text-sm transition-colors"
                >
                  {editingProject?.id === project.id ? 'Close Manager' : 'Manage Files & Settings'}
                </button>
                <button 
                  onClick={() => setDeleteConfirm(project)}
                  className="p-1.5 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-colors"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>

            {/* Manager Body */}
            {editingProject?.id === project.id && (
              <div className="p-4 md:p-6 bg-gray-50 dark:bg-slate-800/50">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                  {/* Settings */}
                  <div className="space-y-4">
                    <h4 className="font-semibold text-gray-900 dark:text-slate-100 text-sm">Access Settings</h4>
                    <div className="space-y-3 bg-white dark:bg-slate-900 p-4 rounded-lg border border-gray-200 dark:border-slate-700">
                      <select 
                        value={project.accessType}
                        onChange={(e) => handleUpdateSettings(project.id, e.target.value as any, project.accessValue)}
                        className="w-full bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded p-2 text-sm text-gray-900 dark:text-slate-100"
                      >
                        <option value="public">Public (Anyone with link)</option>
                        <option value="email">Email / Phone Verification</option>
                        <option value="password">Password Protected</option>
                      </select>
                      
                      {project.accessType !== 'public' && (
                        <div>
                          <label className="block text-xs text-gray-500 mb-1">
                            {project.accessType === 'password' ? 'Password' : 'Allowed Email/Phone'}
                          </label>
                          <div className="relative">
                            <input 
                              type={project.accessType === 'password' && !showPasswords[project.id] ? 'password' : 'text'}
                              value={project.accessValue}
                              onChange={(e) => handleUpdateSettings(project.id, project.accessType, e.target.value)}
                              className="w-full bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded p-2 text-sm text-gray-900 dark:text-slate-100 font-mono pr-10"
                            />
                            {project.accessType === 'password' && (
                              <button 
                                onClick={() => setShowPasswords(prev => ({...prev, [project.id]: !prev[project.id]}))}
                                className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                              >
                                {showPasswords[project.id] ? <EyeOff size={16} /> : <Eye size={16} />}
                              </button>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Files */}
                  <div className="lg:col-span-2 space-y-4">
                    <div className="flex justify-between items-center">
                      <h4 className="font-semibold text-gray-900 dark:text-slate-100 text-sm">Project Files</h4>
                      <div className="relative">
                        <input 
                          type="file" 
                          multiple 
                          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                          onChange={(e) => handleFileUpload(e, project.id)}
                        />
                        <button className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-900 dark:bg-white text-white dark:text-slate-900 rounded text-sm hover:opacity-90">
                          <Plus size={14} /> Upload Files
                        </button>
                      </div>
                    </div>

                    <div className="space-y-2">
                      {Object.entries(uploadProgress).map(([fileName, progress]) => (
                        <div key={fileName} className="bg-white dark:bg-slate-900 p-3 rounded-lg border border-blue-200 dark:border-blue-900 flex items-center justify-between">
                          <span className="text-sm truncate text-gray-700 dark:text-slate-300 mr-4 flex-1">{fileName}</span>
                          <div className="flex items-center gap-3">
                            <div className="w-24 h-1.5 bg-gray-200 dark:bg-slate-700 rounded-full overflow-hidden">
                              <div className="h-full bg-blue-600 transition-all duration-300" style={{ width: `${progress}%` }}></div>
                            </div>
                            <span className="text-xs text-gray-500">{Math.round(progress)}%</span>
                          </div>
                        </div>
                      ))}

                      {project.files.length === 0 && Object.keys(uploadProgress).length === 0 && (
                        <div className="text-center py-8 text-sm text-gray-500 bg-white dark:bg-slate-900 rounded-lg border border-dashed border-gray-300 dark:border-slate-700">
                          No files uploaded yet.
                        </div>
                      )}

                      {project.files.map(file => (
                        <div key={file.url} className="bg-white dark:bg-slate-900 p-3 rounded-lg border border-gray-200 dark:border-slate-700 flex items-center justify-between group">
                          <div className="flex items-center gap-3 overflow-hidden flex-1">
                            {file.type.startsWith('image/') ? <ImageIcon size={18} className="text-blue-500 shrink-0" /> : 
                             file.type.startsWith('video/') ? <Video size={18} className="text-purple-500 shrink-0" /> : 
                             <FileText size={18} className="text-gray-400 shrink-0" />}
                            <a href={file.url} target="_blank" rel="noreferrer" className="text-sm text-gray-700 dark:text-slate-300 truncate hover:text-blue-600 dark:hover:text-blue-400 hover:underline">
                              {file.name}
                            </a>
                          </div>
                          <div className="flex items-center gap-4 shrink-0 pl-4">
                            <span className="text-xs text-gray-400">{(file.size / (1024 * 1024)).toFixed(2)} MB</span>
                            <button 
                              onClick={() => deleteFile(project.id, file.url)}
                              className="text-gray-400 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100"
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {deleteConfirm && (
        <ConfirmModal 
          isOpen={!!deleteConfirm}
          title="Delete Shared Project?"
          message={`Are you sure you want to delete the shared project "${deleteConfirm.clientName}"? This will permanently delete all uploaded files and break the share link.`}
          confirmLabel="Delete Everything"
          onConfirm={handleDelete}
          onCancel={() => setDeleteConfirm(null)}
        />
      )}
    </div>
  );
};
