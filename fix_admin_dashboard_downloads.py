import sys

content = open("pages/AdminDashboard.tsx").read()

if "const [isDownloadingAll, setIsDownloadingAll] = useState(false);" not in content:
    content = content.replace("const [isLoading, setIsLoading] = useState(true);", "const [isLoading, setIsLoading] = useState(true);\n  const [isDownloadingAll, setIsDownloadingAll] = useState(false);\n  const [downloadProgress, setDownloadProgress] = useState(0);")

old_files_render = """                                   {selectedOrder?.files && selectedOrder.files.length > 0 ? (
                                     <div className="space-y-2">
                                       {selectedOrder.files.map((f, i) => (
                                          <a key={i} href={f.data} download={f.name} target="_blank" rel="noopener noreferrer" className="flex items-center justify-between p-3 bg-gray-50 dark:bg-slate-800 hover:bg-blue-50 border border-gray-200 dark:border-slate-700 rounded-lg group transition-colors cursor-pointer">
                                              <div className="flex items-center gap-3 overflow-hidden">
                                                 <div className="bg-white dark:bg-slate-900 p-1.5 rounded border border-gray-200 dark:border-slate-700 text-gray-500 dark:text-slate-400"><ImageIcon size={14} /></div>
                                                 <span className="text-sm text-gray-700 dark:text-slate-300 font-medium truncate">{f.name}</span>
                                              </div>
                                              <Download size={14} className="text-gray-400 group-hover:text-blue-500" />
                                          </a>
                                       ))}
                                     </div>
                                   ) : ("""

new_files_render = """                                   {selectedOrder?.files && selectedOrder.files.length > 0 ? (
                                     <div className="space-y-2">
                                       {selectedOrder.files.length > 1 && (
                                         <button
                                            onClick={async () => {
                                              if (isDownloadingAll) return;
                                              setIsDownloadingAll(true);
                                              setDownloadProgress(0);
                                              const clientName = selectedOrder.clientEmail.split('@')[0] || 'Client';
                                              await handleBulkDownload(
                                                selectedOrder.files.map(f => ({ url: f.data, name: f.name })),
                                                `${clientName}_Order_${selectedOrder.id}_Files`,
                                                (prog) => setDownloadProgress(prog)
                                              );
                                              setIsDownloadingAll(false);
                                            }}
                                            disabled={isDownloadingAll}
                                            className="w-full flex items-center justify-center gap-2 p-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-all shadow-sm mb-3"
                                         >
                                            {isDownloadingAll ? (
                                              <><Loader2 size={16} className="animate-spin" /> Preparing {downloadProgress}/{selectedOrder.files.length}...</>
                                            ) : (
                                              <><Download size={16} /> Download All Files</>
                                            )}
                                         </button>
                                       )}
                                       {selectedOrder.files.map((f, i) => (
                                          <button key={i} onClick={(e) => {
                                             e.preventDefault();
                                             handleSingleDownload(f.data, f.name);
                                          }} className="w-full flex items-center justify-between p-3 bg-gray-50 dark:bg-slate-800 hover:bg-blue-50 border border-gray-200 dark:border-slate-700 rounded-lg group transition-colors cursor-pointer text-left">
                                              <div className="flex items-center gap-3 overflow-hidden">
                                                 <div className="bg-white dark:bg-slate-900 p-1.5 rounded border border-gray-200 dark:border-slate-700 text-gray-500 dark:text-slate-400"><ImageIcon size={14} /></div>
                                                 <span className="text-sm text-gray-700 dark:text-slate-300 font-medium truncate">{f.name}</span>
                                              </div>
                                              <Download size={14} className="text-gray-400 group-hover:text-blue-500" />
                                          </button>
                                       ))}
                                     </div>
                                   ) : ("""

if old_files_render in content:
    content = content.replace(old_files_render, new_files_render)
    open("pages/AdminDashboard.tsx", "w").write(content)
    print("Replaced download elements in AdminDashboard.tsx")
else:
    print("Could not find finalFiles map in AdminDashboard.tsx")

