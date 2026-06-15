import React, { useState, useEffect } from 'react';
import { getExperience, deleteExperience, updateExperience, addExperience, ExperienceItem } from '../services/dataService';
import { Loader2, Trash2, Briefcase, Plus, Save, Eye, EyeOff } from 'lucide-react';
import { ConfirmModal } from './ConfirmModal';

export const AdminExperience: React.FC = () => {
    const [experience, setExperience] = useState<ExperienceItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [itemToDelete, setItemToDelete] = useState<number | null>(null);

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        setLoading(true);
        try {
            const data = await getExperience();
            setExperience(data);
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    const handleAdd = () => {
        setExperience([{ id: 'temp_' + Date.now(), role: 'New Role', company: 'Company Name', period: '2022 - Present', description: 'Job responsibilities' }, ...experience]);
    };

    const handleChange = (index: number, field: keyof ExperienceItem, value: any) => {
        const newArr = [...experience];
        newArr[index] = { ...newArr[index], [field]: value };
        setExperience(newArr);
    };

    const handleSave = async (index: number) => {
        const item = experience[index];
        try {
            if (item.id && !item.id.toString().startsWith('temp_')) {
                await updateExperience(item.id, item);
            } else {
                const obj = { ...item };
                if (obj.id && obj.id.toString().startsWith('temp_')) delete obj.id;
                const ref = await addExperience(obj);
                const newArr = [...experience];
                newArr[index].id = ref.id;
                setExperience(newArr);
            }
            alert("Saved experience!");
        } catch (e) {
            console.error(e);
            alert("Save failed");
        }
    };

    const confirmDelete = async () => {
        if (itemToDelete === null) return;
        const index = itemToDelete;
        const item = experience[index];
        setItemToDelete(null);
        if (item.id && !item.id.toString().startsWith('temp_')) {
            await deleteExperience(item.id);
        }
        setExperience(experience.filter((_, i) => i !== index));
    };

    const handleDelete = (index: number) => {
        setItemToDelete(index);
    };

    return (
        <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-6 max-w-4xl mx-auto relative">
            <ConfirmModal 
                isOpen={itemToDelete !== null}
                title="Delete Experience Entry"
                message="Are you sure you want to delete this? This action is permanent."
                confirmText="Yes, Delete Forever"
                onConfirm={confirmDelete}
                onCancel={() => setItemToDelete(null)}
            />
            <div className="flex justify-between items-center mb-6">
                <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                    <Briefcase className="text-blue-600" size={20} /> Work Experience
                </h3>
                <button onClick={handleAdd} className="bg-green-600 text-white hover:bg-green-700 px-4 py-2 rounded-lg text-sm font-semibold flex items-center gap-2 transition-colors">
                    <Plus size={16} /> Add Role
                </button>
            </div>

            {loading ? (
                <div className="flex justify-center py-12"><Loader2 className="animate-spin text-gray-400" size={32} /></div>
            ) : (
                <div className="space-y-4">
                    {experience.sort((a,b) => (a.order || 0) - (b.order || 0)).map((s, i) => (
                        <div key={s.id || i} className={`border border-gray-200 rounded-xl p-5 flex flex-col gap-3 ${s.hidden ? 'bg-gray-100 opacity-70' : 'bg-gray-50'}`}>
                            <div className="flex gap-4">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 flex-1">
                                    <input 
                                        value={s.role}
                                        onChange={e => handleChange(i, 'role', e.target.value)}
                                        className="font-bold text-gray-900 bg-transparent border-b border-gray-300 focus:border-blue-500 outline-none w-full pb-1 text-lg"
                                        placeholder="Job Role / Title"
                                    />
                                    <input 
                                        value={s.period}
                                        onChange={e => handleChange(i, 'period', e.target.value)}
                                        className="font-mono text-sm text-blue-600 bg-transparent border-b border-gray-300 focus:border-blue-500 outline-none w-full pb-1 md:text-right"
                                        placeholder="Period (e.g. 2020 - Present)"
                                    />
                                </div>
                                <div className="flex items-center gap-1">
                                    <label className="text-[10px] text-gray-400 font-bold uppercase">Order</label>
                                    <input 
                                        type="number" 
                                        value={s.order || 0}
                                        onChange={e => handleChange(i, 'order', Number(e.target.value))}
                                        className="w-12 text-center bg-white border border-gray-200 rounded-lg outline-none text-sm px-1 py-1"
                                    />
                                </div>
                            </div>
                            <input 
                                value={s.company}
                                onChange={e => handleChange(i, 'company', e.target.value)}
                                className="font-semibold text-gray-700 bg-transparent border-b border-gray-300 focus:border-blue-500 outline-none w-full pb-1"
                                placeholder="Company Name"
                            />
                            <textarea 
                                value={s.description}
                                onChange={e => handleChange(i, 'description', e.target.value)}
                                className="text-sm text-gray-600 min-h-[80px] resize-none bg-white border border-gray-200 focus:border-blue-500 rounded-lg p-3 outline-none w-full"
                                placeholder="Description of achievements and responsibilities..."
                            />
                            <div className="flex gap-2 justify-end mt-2 pt-2 border-t border-gray-100">
                                <button onClick={() => handleChange(i, 'hidden', !s.hidden)} className="text-gray-500 hover:text-blue-600 hover:bg-blue-50 p-2 rounded-lg transition-colors" title={s.hidden ? "Show" : "Hide"}>
                                    {s.hidden ? <EyeOff size={16} /> : <Eye size={16} />}
                                </button>
                                <button onClick={() => handleDelete(i)} className="text-gray-400 hover:text-red-500 hover:bg-red-50 p-2 rounded-lg transition-colors">
                                    <Trash2 size={16} />
                                </button>
                                <button onClick={() => handleSave(i)} className="bg-blue-50 hover:bg-blue-100 text-blue-700 px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-1 transition-colors">
                                    <Save size={14} /> Save
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
