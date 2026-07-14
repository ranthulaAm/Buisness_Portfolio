import sys
import re

content = open("pages/SharedProjectView.tsx").read()

old_files_render = re.search(r'        \{project\.files\.length === 0 \? \(.*?          </div>\n        \)\}', content, flags=re.DOTALL)

new_files_render = """        {project.files.length === 0 ? (
          <div className="bg-white dark:bg-slate-800 rounded-2xl border border-dashed border-gray-300 dark:border-slate-700 p-12 text-center text-gray-500 dark:text-slate-400">
            No files have been uploaded to this project yet.
          </div>
        ) : (
          <div className="space-y-12">
            {['Unsorted', 'Raw Assets', 'References', 'Final Exports'].map(folder => {
              const folderFiles = project.files.filter(f => (f.folder || 'Unsorted') === folder);
              if (folderFiles.length === 0) return null;
              
              return (
                <div key={folder}>
                  {folder !== 'Unsorted' && <h3 className="text-xl font-display font-bold text-gray-900 dark:text-slate-100 mb-6 border-b border-gray-200 dark:border-slate-700 pb-2">{folder}</h3>}
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {folderFiles.map((file, idx) => {
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
                </div>
              );
            })}
          </div>
        )}"""

if old_files_render:
    content = content.replace(old_files_render.group(0), new_files_render)
    open("pages/SharedProjectView.tsx", "w").write(content)
    print("Replaced SharedProjectView.tsx")
else:
    print("Not found old_files_render regex")

