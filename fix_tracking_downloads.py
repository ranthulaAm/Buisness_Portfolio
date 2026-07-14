import sys
import re

content = open("pages/Tracking.tsx").read()

if "import { handleSingleDownload, handleBulkDownload } from '../utils/downloadHelpers';" not in content:
    content = content.replace("import { OrderStatus } from '../types';", "import { OrderStatus } from '../types';\nimport { handleSingleDownload, handleBulkDownload } from '../utils/downloadHelpers';")

# Add bulk download state
if "const [isDownloadingAll, setIsDownloadingAll] = useState(false);" not in content:
    content = content.replace("const [order, setOrder] = useState<Order | null>(null);", "const [order, setOrder] = useState<Order | null>(null);\n  const [isDownloadingAll, setIsDownloadingAll] = useState(false);\n  const [downloadProgress, setDownloadProgress] = useState(0);")

# Replace finalFiles rendering
old_files_render = """                            <div className="space-y-3">
                              {order.finalFiles.map((f, i) => (
                                 <a 
                                   key={i} 
                                   href={f.data} 
                                   download={f.name}
                                   target="_blank" 
                                   rel="noopener noreferrer"
                                   className="flex items-center justify-between p-4 bg-blue-600 hover:bg-blue-700 text-white border border-blue-700 rounded-2xl group transition-all shadow-md group-hover:shadow-lg"
                                 >
                                    <div className="flex items-center gap-4">
                                       <div className="p-2 bg-white/20 rounded-lg text-white group-hover:scale-110 transition-transform">
                                          <ImageIcon size={16} />
                                       </div>
                                       <span className="text-xs font-bold text-white truncate max-w-[180px]">{f.name}</span>
                                    </div>
                                    <div className="flex items-center gap-2 bg-white/20 px-3 py-1.5 rounded-lg text-white font-bold uppercase tracking-wider text-[10px]">
                                       <Download size={14} className="group-hover:-translate-y-0.5 transition-transform animate-bounce" />
                                       Download Final Assets
                                    </div>
                                 </a>
                              ))}
                            </div>"""

new_files_render = """                            <div className="space-y-3">
                              {order.finalFiles.length > 1 && (
                                <button
                                  onClick={async () => {
                                    if (isDownloadingAll) return;
                                    setIsDownloadingAll(true);
                                    setDownloadProgress(0);
                                    await handleBulkDownload(
                                      order.finalFiles.map(f => ({ url: f.data, name: f.name })),
                                      `Order_${order.id}_Files`,
                                      (prog) => setDownloadProgress(prog)
                                    );
                                    setIsDownloadingAll(false);
                                  }}
                                  disabled={isDownloadingAll}
                                  className="w-full flex items-center justify-center gap-2 p-4 bg-gray-900 hover:bg-black text-white rounded-2xl transition-all shadow-md mb-4"
                                >
                                  {isDownloadingAll ? (
                                    <><Loader2 size={18} className="animate-spin" /> Preparing {downloadProgress}/{order.finalFiles.length}...</>
                                  ) : (
                                    <><ArrowDown size={18} /> Download All Files ({order.finalFiles.length})</>
                                  )}
                                </button>
                              )}
                              {order.finalFiles.map((f, i) => (
                                 <button 
                                   key={i} 
                                   onClick={(e) => {
                                     e.preventDefault();
                                     handleSingleDownload(f.data, f.name);
                                   }}
                                   className="w-full flex items-center justify-between p-4 bg-blue-600 hover:bg-blue-700 text-white border border-blue-700 rounded-2xl group transition-all shadow-md group-hover:shadow-lg"
                                 >
                                    <div className="flex items-center gap-4">
                                       <div className="p-2 bg-white/20 rounded-lg text-white group-hover:scale-110 transition-transform">
                                          <ImageIcon size={16} />
                                       </div>
                                       <span className="text-xs font-bold text-white truncate max-w-[180px] text-left">{f.name}</span>
                                    </div>
                                    <div className="flex items-center gap-2 bg-white/20 px-3 py-1.5 rounded-lg text-white font-bold uppercase tracking-wider text-[10px]">
                                       <Download size={14} className="group-hover:-translate-y-0.5 transition-transform animate-bounce" />
                                       Download File
                                    </div>
                                 </button>
                              ))}
                            </div>"""

if old_files_render in content:
    content = content.replace(old_files_render, new_files_render)
    open("pages/Tracking.tsx", "w").write(content)
    print("Replaced download elements in Tracking.tsx")
else:
    print("Could not find finalFiles map in Tracking.tsx")

