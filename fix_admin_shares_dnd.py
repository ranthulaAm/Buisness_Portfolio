import sys
import re

content = open("components/AdminShares.tsx").read()

# Add a move function to update file folder
if "const moveFileToFolder = async " not in content:
    move_fn = """  const moveFileToFolder = async (projectId: string, fileUrl: string, folderName: string) => {
    const project = projects.find(p => p.id === projectId);
    if (!project) return;
    const updatedFiles = project.files.map(f => f.url === fileUrl ? { ...f, folder: folderName } : f);
    await updateSharedProject(projectId, { files: updatedFiles });
  };"""
    content = content.replace("  const deleteFile = ", move_fn + "\n\n  const deleteFile = ")

old_files_render = """                  {/* Files */}
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
                            {(file.type || "").startsWith('image/') ? <ImageIcon size={18} className="text-blue-500 shrink-0" /> : 
                             (file.type || "").startsWith('video/') ? <Video size={18} className="text-purple-500 shrink-0" /> : 
                             <FileText size={18} className="text-gray-400 shrink-0" />}
                            <a href={file.url} target="_blank" rel="noreferrer" className="text-sm text-gray-700 dark:text-slate-300 truncate hover:text-blue-600 dark:hover:text-blue-400 hover:underline">
                              {file.name}
                            </a>
                          </div>
                          <div className="flex items-center gap-4 opacity-0 group-hover:opacity-100 transition-opacity">
                            <span className="text-xs text-gray-400 font-mono">{(file.size / (1024 * 1024)).toFixed(1)}MB</span>
                            <button onClick={() => deleteFile(project.id, file.url)} className="text-gray-400 hover:text-red-500" title="Delete file">
                              <Trash2 size={16} />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>"""

new_files_render = """                  {/* Files with Drag and Drop Folder Organization */}
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

                    <div className="space-y-4">
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

                      {/* Folder View */}
                      {['Unsorted', 'Raw Assets', 'References', 'Final Exports'].map(folder => {
                        const folderFiles = project.files.filter(f => (f.folder || 'Unsorted') === folder);
                        if (folderFiles.length === 0 && folder !== 'Unsorted') return null;
                        
                        return (
                          <div 
                            key={folder}
                            className="bg-gray-50 dark:bg-slate-800/50 p-4 rounded-xl border border-gray-200 dark:border-slate-700"
                            onDragOver={(e) => e.preventDefault()}
                            onDrop={(e) => {
                                e.preventDefault();
                                const fileUrl = e.dataTransfer.getData('fileUrl');
                                if (fileUrl) moveFileToFolder(project.id, fileUrl, folder);
                            }}
                          >
                            <h5 className="text-xs font-bold uppercase tracking-widest text-gray-500 dark:text-slate-400 mb-3">{folder}</h5>
                            <div className="space-y-2">
                              {folderFiles.length === 0 && folder === 'Unsorted' && (
                                <p className="text-xs text-gray-400 italic">Drag files to folders to organize.</p>
                              )}
                              {folderFiles.map(file => (
                                <div 
                                    key={file.url} 
                                    draggable
                                    onDragStart={(e) => e.dataTransfer.setData('fileUrl', file.url)}
                                    className="bg-white dark:bg-slate-900 p-3 rounded-lg border border-gray-200 dark:border-slate-700 flex items-center justify-between group cursor-grab active:cursor-grabbing hover:border-blue-300 dark:hover:border-blue-700 transition-colors"
                                >
                                  <div className="flex items-center gap-3 overflow-hidden flex-1">
                                    {(file.type || "").startsWith('image/') ? <ImageIcon size={18} className="text-blue-500 shrink-0" /> : 
                                     (file.type || "").startsWith('video/') ? <Video size={18} className="text-purple-500 shrink-0" /> : 
                                     <FileText size={18} className="text-gray-400 shrink-0" />}
                                    <a href={file.url} target="_blank" rel="noreferrer" className="text-sm text-gray-700 dark:text-slate-300 truncate hover:text-blue-600 dark:hover:text-blue-400 hover:underline">
                                      {file.name}
                                    </a>
                                  </div>
                                  <div className="flex items-center gap-4 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <span className="text-xs text-gray-400 font-mono">{(file.size / (1024 * 1024)).toFixed(1)}MB</span>
                                    <button onClick={() => deleteFile(project.id, file.url)} className="text-gray-400 hover:text-red-500" title="Delete file">
                                      <Trash2 size={16} />
                                    </button>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>"""

content = content.replace(old_files_render, new_files_render)
open("components/AdminShares.tsx", "w").write(content)
print("Updated AdminShares.tsx for drag and drop folders")
