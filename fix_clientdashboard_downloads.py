import sys

content = open("pages/ClientDashboard.tsx").read()

if "import { handleSingleDownload, handleBulkDownload } from '../utils/downloadHelpers';" not in content:
    content = content.replace("import { updateOrder, getOrdersByEmail } from '../services/storageService';", "import { updateOrder, getOrdersByEmail } from '../services/storageService';\nimport { handleSingleDownload, handleBulkDownload } from '../utils/downloadHelpers';")

if "const [isDownloadingAll, setIsDownloadingAll] = useState(false);" not in content:
    content = content.replace("const [isDownloading, setIsDownloading] = useState(false);", "const [isDownloading, setIsDownloading] = useState(false);\n    const [isDownloadingAll, setIsDownloadingAll] = useState(false);\n    const [downloadProgress, setDownloadProgress] = useState(0);")

old_files_render = """          {isCompleted && order.finalFiles && order.finalFiles.length > 0 && order.finalFiles.map((file, idx) => (
             <a
               key={`final-${idx}`}
               href={file.data}
               download={file.name}
               target="_blank"
               rel="noreferrer"
               className="border-2 border-blue-600 text-white bg-blue-600 shadow-md px-6 py-3 rounded-full text-xs font-bold uppercase tracking-widest hover:bg-blue-700 hover:border-blue-700 transition-colors flex items-center gap-2 group"
             >
                <Download size={14} className="group-hover:-translate-y-0.5 transition-transform animate-bounce" /> Download Final Assets
             </a>
          ))}"""

new_files_render = """          {isCompleted && order.finalFiles && order.finalFiles.length > 1 && (
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
              className="border-2 border-gray-900 text-white bg-gray-900 shadow-md px-6 py-3 rounded-full text-xs font-bold uppercase tracking-widest hover:bg-black transition-colors flex items-center gap-2"
            >
              {isDownloadingAll ? (
                <><Loader2 size={14} className="animate-spin" /> Preparing {downloadProgress}/{order.finalFiles.length}...</>
              ) : (
                <><ArrowDown size={14} /> Download All Files</>
              )}
            </button>
          )}
          {isCompleted && order.finalFiles && order.finalFiles.length > 0 && order.finalFiles.map((file, idx) => (
             <button
               key={`final-${idx}`}
               onClick={(e) => {
                 e.preventDefault();
                 handleSingleDownload(file.data, file.name);
               }}
               className="border-2 border-blue-600 text-white bg-blue-600 shadow-md px-6 py-3 rounded-full text-xs font-bold uppercase tracking-widest hover:bg-blue-700 hover:border-blue-700 transition-colors flex items-center gap-2 group"
             >
                <Download size={14} className="group-hover:-translate-y-0.5 transition-transform animate-bounce" /> 
                {order.finalFiles.length > 1 ? `Download ${file.name}` : 'Download Final Asset'}
             </button>
          ))}"""

if old_files_render in content:
    content = content.replace(old_files_render, new_files_render)
    open("pages/ClientDashboard.tsx", "w").write(content)
    print("Replaced download elements in ClientDashboard.tsx")
else:
    print("Could not find finalFiles map in ClientDashboard.tsx")

