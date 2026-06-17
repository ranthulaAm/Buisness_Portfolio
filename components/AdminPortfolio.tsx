import React, { useState, useEffect } from 'react';
import { getPortfolioItems, addPortfolioItem, updatePortfolioItem, deletePortfolioItem, PortfolioItem } from '../services/dataService';
import { uploadFileWithProgress } from '../services/fileUploadService';
import { PORTFOLIO_ITEMS as DEFAULT_PORTFOLIO } from '../constants';
import { Save, Plus, Trash2, Loader2, Upload, ArrowUp, ArrowDown, ImageIcon } from 'lucide-react';
import { ConfirmModal } from './ConfirmModal';

export const AdminPortfolio: React.FC = () => {
    const [portfolio, setPortfolio] = useState<PortfolioItem[]>([]);
    const [loading, setLoading] = useState(false);
    const [uploadingIdx, setUploadingIdx] = useState<number | null>(null);
    const [progress, setProgress] = useState(0);
    const [itemToDelete, setItemToDelete] = useState<number | null>(null);

    const handleMoveUp = async (index: number) => {
        if (index === 0) return;
        const newPortfolio = [...portfolio];
        const temp = newPortfolio[index];
        newPortfolio[index] = newPortfolio[index - 1];
        newPortfolio[index - 1] = temp;
        
        // Update order property
        newPortfolio.forEach((item, i) => item.order = i);
        setPortfolio(newPortfolio);
        
        // Save both items implicitly
        setLoading(true);
        try {
            await Promise.all([
                newPortfolio[index].id ? updatePortfolioItem(newPortfolio[index].id as string, newPortfolio[index]) : Promise.resolve(),
                newPortfolio[index-1].id ? updatePortfolioItem(newPortfolio[index-1].id as string, newPortfolio[index-1]) : Promise.resolve()
            ]);
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    const handleMoveDown = async (index: number) => {
        if (index === portfolio.length - 1) return;
        const newPortfolio = [...portfolio];
        const temp = newPortfolio[index];
        newPortfolio[index] = newPortfolio[index + 1];
        newPortfolio[index + 1] = temp;
        
        // Update order property
        newPortfolio.forEach((item, i) => item.order = i);
        setPortfolio(newPortfolio);
        
        // Save both items implicitly
        setLoading(true);
        try {
            await Promise.all([
                newPortfolio[index].id ? updatePortfolioItem(newPortfolio[index].id as string, newPortfolio[index]) : Promise.resolve(),
                newPortfolio[index+1].id ? updatePortfolioItem(newPortfolio[index+1].id as string, newPortfolio[index+1]) : Promise.resolve()
            ]);
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        setLoading(true);
        try {
            const items = await getPortfolioItems();
            if (items.length > 0) {
                setPortfolio(items);
            } else {
                setPortfolio(DEFAULT_PORTFOLIO.map(p => ({ ...p, id: String(p.id) })));
            }
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    const handleAddPortfolio = () => {
        const item: PortfolioItem = {
            id: 'temp_' + Date.now(),
            title: 'New Portfolio Item',
            description: 'Item description',
            category: 'Uncategorized',
            img: ''
        };
        setPortfolio([item, ...portfolio]);
    };

    const handlePortfolioChange = (index: number, field: keyof PortfolioItem, value: string) => {
        const newPortfolio = [...portfolio];
        newPortfolio[index] = { ...newPortfolio[index], [field]: value };
        setPortfolio(newPortfolio);
    };

    const handleFileUpload = async (index: number, file: File, field: 'img' | 'videoUrl') => {
        setUploadingIdx(index);
        setProgress(0);
        try {
            const path = `portfolio/${Date.now()}_${file.name}`;
            const url = await uploadFileWithProgress(file, path, (p) => {
                setProgress(p);
            });
            handlePortfolioChange(index, field, url);
        } catch (e) {
            console.error(e);
            alert("Upload failed.");
        } finally {
            setUploadingIdx(null);
            setProgress(0);
        }
    };

    const handleSavePortfolioItem = async (index: number) => {
        const item = portfolio[index];
        setLoading(true);
        try {
            if (item.id && !item.id.toString().startsWith('temp_') && !Number.isInteger(Number(item.id))) {
                await updatePortfolioItem(item.id, item);
            } else {
                const obj = { ...item };
                delete obj.id;
                const ref = await addPortfolioItem(obj);
                const newPortfolio = [...portfolio];
                newPortfolio[index].id = ref.id;
                setPortfolio(newPortfolio);
            }
            alert("Saved item successfully.");
        } catch (e) {
            console.error(e);
            alert("Error saving item");
        } finally {
            setLoading(false);
        }
    };

    const confirmDelete = async () => {
        if (itemToDelete === null) return;
        const index = itemToDelete;
        const item = portfolio[index];
        
        setItemToDelete(null);
        if (item.id && !item.id.toString().startsWith('temp_') && !Number.isInteger(Number(item.id))) {
            setLoading(true);
            try {
                await deletePortfolioItem(item.id);
            } catch (e) {
                console.error(e);
            }
            setLoading(false);
        }
        setPortfolio(portfolio.filter((_, i) => i !== index));
    };

    const handleDeletePortfolioItem = (index: number) => {
        setItemToDelete(index);
    };

    return (
        <div className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-xl shadow-sm p-6 relative">
            <ConfirmModal 
                isOpen={itemToDelete !== null}
                title="Delete Portfolio Item"
                message="Are you sure you want to delete this item? This action is permanent and cannot be undone."
                confirmText="Yes, Delete Forever"
                onConfirm={confirmDelete}
                onCancel={() => setItemToDelete(null)}
            />
            <div className="flex justify-between items-center mb-6">
                <h3 className="text-lg font-bold text-gray-900 dark:text-slate-100">Live Portfolio Manager</h3>
                <button onClick={handleAddPortfolio} className="bg-green-600 text-white hover:bg-green-700 px-4 py-2 rounded-lg text-sm font-semibold flex items-center gap-2 transition-colors">
                    <Plus size={16} /> Add New Work
                </button>
            </div>
            
            {loading && portfolio.length === 0 ? (
                <div className="flex items-center justify-center py-12"><Loader2 className="animate-spin text-gray-400" size={32} /></div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {portfolio.map((item, i) => (
                        <div key={item.id || i} className="border border-gray-200 dark:border-slate-700 rounded-2xl overflow-hidden shadow-sm flex flex-col group bg-gray-50/50 relative">
                            
                            {/* Image Selection / Viewer */}
                            <div className="h-56 bg-gray-200 flex-shrink-0 relative overflow-hidden flex items-center justify-center">
                                {item.img ? (
                                    <img src={item.img} alt={item.title} className="w-full h-full object-cover" />
                                ) : (
                                    <div className="text-gray-400 flex flex-col items-center gap-2 h-full justify-center">
                                        <ImageIcon size={32} />
                                        <span className="text-sm font-bold">No Image</span>
                                    </div>
                                )}
                                
                                <label className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center cursor-pointer p-4 backdrop-blur-sm z-10">
                                    {uploadingIdx === i ? (
                                        <div className="w-full max-w-[150px]">
                                            <div className="h-2 w-full bg-gray-700 rounded-full overflow-hidden mb-2">
                                                <div className="h-full bg-white dark:bg-slate-900 transition-all" style={{ width: `${progress}%` }}></div>
                                            </div>
                                            <span className="text-white text-xs font-bold text-center block">Uploading {Math.round(progress)}%</span>
                                        </div>
                                    ) : (
                                        <>
                                            <Upload className="text-white mb-2" size={24} />
                                            <span className="text-white font-bold text-sm bg-white/20 px-3 py-1.5 rounded-full">Upload New Image</span>
                                            <input 
                                                type="file" 
                                                className="hidden" 
                                                accept="image/*"
                                                onChange={(e) => {
                                                    const file = e.target.files?.[0];
                                                    if (file) handleFileUpload(i, file, 'img');
                                                }}
                                            />
                                        </>
                                    )}
                                </label>
                            </div>
                            
                            {/* Details Editor */}
                            <div className="p-5 bg-white dark:bg-slate-900 flex-1 flex flex-col gap-4">
                                <div className="flex gap-2 mb-2 absolute top-2 right-2 z-20">
                                    <button onClick={() => handleMoveUp(i)} disabled={i === 0 || loading} className="bg-white/90 dark:bg-slate-900/90 p-1.5 rounded-md hover:bg-gray-100 dark:hover:bg-slate-700 dark:bg-slate-800 shadow-sm disabled:opacity-50">
                                        <ArrowUp size={16} />
                                    </button>
                                    <button onClick={() => handleMoveDown(i)} disabled={i === portfolio.length - 1 || loading} className="bg-white/90 dark:bg-slate-900/90 p-1.5 rounded-md hover:bg-gray-100 dark:hover:bg-slate-700 dark:bg-slate-800 shadow-sm disabled:opacity-50">
                                        <ArrowDown size={16} />
                                    </button>
                                </div>
                                <div>
                                    <label className="text-[10px] font-black tracking-widest uppercase text-gray-400 block mb-1">Project Title</label>
                                    <input 
                                        type="text" 
                                        value={item.title} 
                                        onChange={(e) => handlePortfolioChange(i, 'title', e.target.value)}
                                        className="font-bold text-lg text-gray-900 dark:text-slate-100 border-b border-transparent hover:border-gray-300 dark:border-slate-600 focus:border-blue-500 outline-none transition-colors w-full"
                                        placeholder="Project Title"
                                    />
                                </div>
                                
                                <div>
                                    <label className="text-[10px] font-black tracking-widest uppercase text-gray-400 block mb-1">Video Resource (Optional)</label>
                                    <div className="flex items-center gap-2">
                                        <input 
                                            type="text" 
                                            value={item.videoUrl || ''} 
                                            onChange={(e) => handlePortfolioChange(i, 'videoUrl', e.target.value)}
                                            className="text-sm font-bold text-blue-600 border-b border-transparent hover:border-gray-300 dark:border-slate-600 focus:border-blue-500 outline-none transition-colors flex-1"
                                            placeholder="URL or use upload ->"
                                        />
                                        <label className="cursor-pointer bg-blue-50 hover:bg-blue-100 text-blue-600 px-3 py-1.5 rounded text-xs font-bold transition-colors shadow-sm">
                                            Upload Video
                                            <input 
                                                type="file" 
                                                className="hidden" 
                                                accept="video/mp4,video/webm"
                                                onChange={(e) => {
                                                    const file = e.target.files?.[0];
                                                    if (file) handleFileUpload(i, file, 'videoUrl');
                                                }}
                                            />
                                        </label>
                                    </div>
                                </div>
                                
                                <div>
                                    <label className="text-[10px] font-black tracking-widest uppercase text-gray-400 block mb-1">Category</label>
                                    <input 
                                        type="text" 
                                        value={item.category} 
                                        onChange={(e) => handlePortfolioChange(i, 'category', e.target.value)}
                                        className="text-sm font-bold text-green-600 uppercase tracking-widest border-b border-transparent hover:border-gray-300 dark:border-slate-600 focus:border-blue-500 outline-none transition-colors w-full"
                                        placeholder="Category"
                                    />
                                </div>
                                
                                <div className="flex-1">
                                    <label className="text-[10px] font-black tracking-widest uppercase text-gray-400 block mb-1">Description</label>
                                    <textarea 
                                        value={item.description}
                                        onChange={(e) => handlePortfolioChange(i, 'description', e.target.value)}
                                        className="text-sm text-gray-600 dark:text-slate-400 flex-1 min-h-[80px] resize-none border border-transparent hover:border-gray-200 dark:border-slate-700 focus:border-blue-500 bg-transparent rounded p-1 outline-none transition-colors w-full"
                                        placeholder="Description..."
                                    />
                                </div>
                                
                                <div className="flex gap-3 justify-end mt-2 pt-4 border-t border-gray-100 dark:border-slate-700">
                                     <button onClick={() => handleDeletePortfolioItem(i)} className="text-gray-400 hover:text-red-500 hover:bg-red-50 p-2.5 rounded-lg transition-colors" title="Delete">
                                         <Trash2 size={18} />
                                     </button>
                                     <button onClick={() => handleSavePortfolioItem(i)} className="bg-blue-50 hover:bg-blue-100 text-blue-700 px-4 py-2 rounded-lg text-sm font-bold transition-colors flex items-center gap-2">
                                         {loading ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />} Save
                                     </button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};
