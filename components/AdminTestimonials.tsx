import React, { useState, useEffect } from 'react';
import { Testimonial, getTestimonials, addTestimonial, updateTestimonial, deleteTestimonial } from '../services/dataService';
import { Loader2, Plus, ArrowUp, ArrowDown, Trash2 } from 'lucide-react';

export const AdminTestimonials: React.FC = () => {
    const [testimonials, setTestimonials] = useState<Testimonial[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        getTestimonials().then(data => {
            setTestimonials(data);
            setLoading(false);
        }).catch(e => {
            console.error(e);
            setLoading(false);
        });
    }, []);

    const handleChange = (index: number, field: keyof Testimonial, value: string) => {
        const updated = [...testimonials];
        (updated[index] as any)[field] = value;
        setTestimonials(updated);
    };

    const handleSave = async (index: number) => {
        const item = testimonials[index];
        setLoading(true);
        try {
            if (item.id && !Number.isInteger(Number(item.id))) {
                await updateTestimonial(item.id, { clientName: item.clientName, projectRole: item.projectRole, feedback: item.feedback, order: item.order, rating: item.rating || 5 });
            } else {
                const { id, ...data } = item;
                const ref = await addTestimonial(data);
                const updated = [...testimonials];
                updated[index].id = ref.id;
                setTestimonials(updated);
            }
            alert("Saved testimonial.");
        } catch (e) {
            console.error(e);
            alert("Error saving.");
        } finally {
            setLoading(false);
        }
    };

    const handleAdd = () => {
        setTestimonials([{ clientName: '', projectRole: '', feedback: '', order: testimonials.length, rating: 5 }, ...testimonials]);
    };

    const handleDelete = async (index: number) => {
        const item = testimonials[index];
        if (item.id && !Number.isInteger(Number(item.id))) {
            setLoading(true);
            await deleteTestimonial(item.id);
            setLoading(false);
        }
        setTestimonials(testimonials.filter((_, i) => i !== index));
    };

    const handleMoveUp = async (index: number) => {
        if (index === 0) return;
        const newArr = [...testimonials];
        [newArr[index - 1], newArr[index]] = [newArr[index], newArr[index - 1]];
        newArr.forEach((item, i) => item.order = i);
        setTestimonials(newArr);
    };

    const handleMoveDown = async (index: number) => {
        if (index === testimonials.length - 1) return;
        const newArr = [...testimonials];
        [newArr[index + 1], newArr[index]] = [newArr[index], newArr[index + 1]];
        newArr.forEach((item, i) => item.order = i);
        setTestimonials(newArr);
    };

    return (
        <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-6">
            <div className="flex justify-between items-center mb-6">
                <h3 className="text-lg font-bold text-gray-900">Manage Testimonials</h3>
                <button onClick={handleAdd} className="bg-purple-600 text-white hover:bg-purple-700 px-4 py-2 rounded-lg text-sm font-semibold flex items-center gap-2 transition-colors">
                    <Plus size={16} /> Add Testimonial
                </button>
            </div>

            {loading && testimonials.length === 0 ? (
                <div className="flex justify-center py-12"><Loader2 className="animate-spin text-gray-400" /></div>
            ) : (
                <div className="space-y-6">
                    {testimonials.map((t, idx) => (
                        <div key={t.id || idx} className="bg-gray-50 border border-gray-200 p-6 rounded-2xl relative flex flex-col md:flex-row gap-6">
                            <div className="flex-1 flex flex-col gap-4">
                                <div className="flex flex-col md:flex-row gap-4">
                                    <div className="flex-1">
                                        <label className="text-[10px] uppercase font-bold text-gray-500 mb-1 block">Client Name</label>
                                        <input value={t.clientName} onChange={e => handleChange(idx, 'clientName', e.target.value)} className="w-full border border-gray-200 rounded-lg px-3 py-2 outline-none focus:border-purple-500" placeholder="e.g. Jane Doe" />
                                    </div>
                                    <div className="flex-1">
                                        <label className="text-[10px] uppercase font-bold text-gray-500 mb-1 block">Project Role / Brand</label>
                                        <input value={t.projectRole} onChange={e => handleChange(idx, 'projectRole', e.target.value)} className="w-full border border-gray-200 rounded-lg px-3 py-2 outline-none focus:border-purple-500" placeholder="e.g. CEO at TechCorp" />
                                    </div>
                                    <div>
                                        <label className="text-[10px] uppercase font-bold text-gray-500 mb-1 block">Rating</label>
                                        <select value={t.rating || 5} onChange={e => handleChange(idx, 'rating', Number(e.target.value) as any)} className="w-full border border-gray-200 rounded-lg px-3 py-2 outline-none focus:border-purple-500 bg-white">
                                            {[5,4,3,2,1].map(r => <option key={r} value={r}>{r} Stars</option>)}
                                        </select>
                                    </div>
                                </div>
                                <div>
                                    <label className="text-[10px] uppercase font-bold text-gray-500 mb-1 block">Feedback</label>
                                    <textarea value={t.feedback} onChange={e => handleChange(idx, 'feedback', e.target.value)} className="w-full border border-gray-200 rounded-lg px-3 py-2 outline-none focus:border-purple-500 min-h-[100px] resize-none" placeholder="Client feedback..." />
                                </div>
                            </div>
                            
                            <div className="flex flex-row md:flex-col items-center justify-between border-t border-gray-200 md:border-t-0 md:border-l md:pl-6 pt-4 md:pt-0 gap-2">
                                <div className="flex md:flex-col gap-2">
                                    <button onClick={() => handleMoveUp(idx)} disabled={idx === 0 || loading} className="bg-white border border-gray-200 p-2 rounded hover:bg-gray-100 disabled:opacity-50"><ArrowUp size={16} /></button>
                                    <button onClick={() => handleMoveDown(idx)} disabled={idx === testimonials.length - 1 || loading} className="bg-white border border-gray-200 p-2 rounded hover:bg-gray-100 disabled:opacity-50"><ArrowDown size={16} /></button>
                                </div>
                                <div className="flex md:flex-col gap-2">
                                    <button onClick={() => handleSave(idx)} disabled={loading} className="bg-gray-900 text-white px-4 py-2 rounded-lg text-sm font-bold disabled:opacity-50 hover:bg-gray-800">
                                        {loading ? <Loader2 size={16} className="animate-spin" /> : 'Save'}
                                    </button>
                                    <button onClick={() => handleDelete(idx)} disabled={loading} className="text-red-500 hover:bg-red-50 p-2 rounded-lg transition-colors border border-transparent hover:border-red-200">
                                        <Trash2 size={20} />
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}
                    {testimonials.length === 0 && <div className="text-center py-12 text-gray-400 bg-gray-50 rounded-2xl border border-dashed border-gray-200">No testimonials yet.</div>}
                </div>
            )}
        </div>
    );
};
