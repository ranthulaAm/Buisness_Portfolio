import React, { useState, useEffect } from 'react';
import { getSkills, deleteSkill, updateSkill, addSkill, SkillItem } from '../services/dataService';
import { Loader2, Trash2, Award, Plus, Save, Eye, EyeOff } from 'lucide-react';

export const AdminSkills: React.FC = () => {
    const [skills, setSkills] = useState<SkillItem[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        setLoading(true);
        try {
            const data = await getSkills();
            setSkills(data);
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    const handleAdd = () => {
        setSkills([{ name: 'New Skill', level: 80 }, ...skills]);
    };

    const handleChange = (index: number, field: keyof SkillItem, value: any) => {
        const newArr = [...skills];
        newArr[index] = { ...newArr[index], [field]: value };
        setSkills(newArr);
    };

    const handleSave = async (index: number) => {
        const item = skills[index];
        try {
            if (item.id) {
                await updateSkill(item.id, item);
            } else {
                const ref = await addSkill(item);
                const newArr = [...skills];
                newArr[index].id = ref.id;
                setSkills(newArr);
            }
            alert("Saved skill!");
        } catch (e) {
            console.error(e);
            alert("Save failed");
        }
    };

    const handleDelete = async (index: number) => {
        const item = skills[index];
        if (item.id) {
            await deleteSkill(item.id);
        }
        setSkills(skills.filter((_, i) => i !== index));
    };

    return (
        <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-6 max-w-4xl mx-auto">
            <div className="flex justify-between items-center mb-6">
                <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                    <Award className="text-blue-600" size={20} /> Software Skills
                </h3>
                <button onClick={handleAdd} className="bg-green-600 text-white hover:bg-green-700 px-4 py-2 rounded-lg text-sm font-semibold flex items-center gap-2 transition-colors">
                    <Plus size={16} /> Add Skill
                </button>
            </div>

            {loading ? (
                <div className="flex justify-center py-12"><Loader2 className="animate-spin text-gray-400" size={32} /></div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {skills.sort((a,b) => (a.order || 0) - (b.order || 0)).map((s, i) => (
                        <div key={s.id || i} className={`border border-gray-200 rounded-xl p-4 flex flex-col gap-4 ${s.hidden ? 'bg-gray-100 opacity-70' : 'bg-gray-50'}`}>
                            <div className="flex gap-2">
                                <input 
                                    value={s.name}
                                    onChange={e => handleChange(i, 'name', e.target.value)}
                                    className="font-bold text-gray-900 bg-transparent border-b border-gray-300 focus:border-blue-500 outline-none w-full pb-1 flex-1"
                                    placeholder="Skill Name (e.g. React.js)"
                                />
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
                            <div>
                                <label className="text-[10px] font-black tracking-widest uppercase text-gray-400 block mb-2">Proficiency Level: {s.level}%</label>
                                <input 
                                    type="range" 
                                    min="0" max="100" 
                                    value={s.level}
                                    onChange={e => handleChange(i, 'level', Number(e.target.value))}
                                    className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
                                />
                            </div>
                            <div className="flex gap-2 justify-end mt-2">
                                <button onClick={() => handleChange(i, 'hidden', !s.hidden)} className="text-gray-500 hover:text-blue-600 hover:bg-blue-50 p-2 rounded-lg transition-colors" title={s.hidden ? "Show" : "Hide"}>
                                    {s.hidden ? <EyeOff size={16} /> : <Eye size={16} />}
                                </button>
                                <button onClick={() => handleDelete(i)} className="text-gray-400 hover:text-red-500 hover:bg-red-50 p-2 rounded-lg transition-colors">
                                    <Trash2 size={16} />
                                </button>
                                <button onClick={() => handleSave(i)} className="bg-blue-50 hover:bg-blue-100 text-blue-700 px-3 py-1.5 rounded-lg text-sm font-bold flex items-center gap-1 transition-colors">
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
