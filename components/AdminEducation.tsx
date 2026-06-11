import React, { useState, useEffect } from 'react';
import { getEducation, deleteEducation, updateEducation, addEducation, EducationItem } from '../services/dataService';
import { Loader2, Trash2, GraduationCap, Plus, Save, Eye, EyeOff } from 'lucide-react';

export const AdminEducation: React.FC = () => {
    const [education, setEducation] = useState<EducationItem[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        setLoading(true);
        try {
            const data = await getEducation();
            setEducation(data);
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    const handleAdd = () => {
        setEducation([{ degree: 'New Degree', institution: 'Institution Name', year: '2020 - 2024', description: 'Study details' }, ...education]);
    };

    const handleChange = (index: number, field: keyof EducationItem, value: any) => {
        const newArr = [...education];
        newArr[index] = { ...newArr[index], [field]: value };
        setEducation(newArr);
    };

    const handleSave = async (index: number) => {
        const item = education[index];
        try {
            if (item.id) {
                await updateEducation(item.id, item);
            } else {
                const ref = await addEducation(item);
                const newArr = [...education];
                newArr[index].id = ref.id;
                setEducation(newArr);
            }
            alert("Saved education!");
        } catch (e) {
            console.error(e);
            alert("Save failed");
        }
    };

    const handleDelete = async (index: number) => {
        const item = education[index];
        if (item.id) {
            await deleteEducation(item.id);
        }
        setEducation(education.filter((_, i) => i !== index));
    };

    return (
        <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-6 max-w-4xl mx-auto">
            <div className="flex justify-between items-center mb-6">
                <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                    <GraduationCap className="text-blue-600" size={20} /> Education History
                </h3>
                <button onClick={handleAdd} className="bg-green-600 text-white hover:bg-green-700 px-4 py-2 rounded-lg text-sm font-semibold flex items-center gap-2 transition-colors">
                    <Plus size={16} /> Add Entry
                </button>
            </div>

            {loading ? (
                <div className="flex justify-center py-12"><Loader2 className="animate-spin text-gray-400" size={32} /></div>
            ) : (
                <div className="space-y-4">
                    {education.sort((a,b) => (a.order || 0) - (b.order || 0)).map((s, i) => (
                        <div key={s.id || i} className={`border border-gray-200 rounded-xl p-5 flex flex-col gap-3 ${s.hidden ? 'bg-gray-100 opacity-70' : 'bg-gray-50'}`}>
                            <div className="flex gap-4">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 flex-1">
                                    <input 
                                        value={s.degree}
                                        onChange={e => handleChange(i, 'degree', e.target.value)}
                                        className="font-bold text-gray-900 bg-transparent border-b border-gray-300 focus:border-blue-500 outline-none w-full pb-1 text-lg"
                                        placeholder="Degree / Certificate"
                                    />
                                    <input 
                                        value={s.year}
                                        onChange={e => handleChange(i, 'year', e.target.value)}
                                        className="font-mono text-sm text-blue-600 bg-transparent border-b border-gray-300 focus:border-blue-500 outline-none w-full pb-1 md:text-right"
                                        placeholder="Year (e.g. 2018 - 2022)"
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
                                value={s.institution}
                                onChange={e => handleChange(i, 'institution', e.target.value)}
                                className="font-semibold text-gray-700 bg-transparent border-b border-gray-300 focus:border-blue-500 outline-none w-full pb-1"
                                placeholder="Institution Name"
                            />
                            <textarea 
                                value={s.description}
                                onChange={e => handleChange(i, 'description', e.target.value)}
                                className="text-sm text-gray-600 min-h-[60px] resize-none bg-white border border-gray-200 focus:border-blue-500 rounded-lg p-3 outline-none w-full"
                                placeholder="Description of studies..."
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
