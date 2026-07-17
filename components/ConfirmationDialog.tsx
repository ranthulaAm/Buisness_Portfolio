import React from 'react';
import { AlertCircle, Trash2, X } from 'lucide-react';

interface ConfirmationDialogProps {
    isOpen: boolean;
    title: string;
    message: string;
    confirmText?: string;
    cancelText?: string;
    onConfirm: () => void;
    onCancel: () => void;
    type?: 'danger' | 'warning' | 'info';
}

export const ConfirmationDialog: React.FC<ConfirmationDialogProps> = ({
    isOpen,
    title,
    message,
    confirmText = 'Yes',
    cancelText = 'No',
    onConfirm,
    onCancel,
    type = 'danger'
}) => {
    if (!isOpen) return null;
    return (
        <div className="fixed inset-0 z-[999] flex items-center justify-center p-4">
            <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" onClick={onCancel}></div>
            <div className="bg-white dark:bg-slate-900 rounded-3xl p-8 max-w-md w-full relative z-10 animate-fade-in shadow-2xl">
                <button onClick={onCancel} className="absolute top-4 right-4 p-2 text-gray-400 hover:text-gray-900 dark:text-slate-100 hover:bg-gray-100 dark:hover:bg-slate-700 dark:bg-slate-800 rounded-full transition-colors">
                    <X size={20} />
                </button>
                
                <div className="flex flex-col items-center text-center">
                    <div className={`p-4 rounded-full mb-4 ${type === 'danger' ? 'bg-red-100 text-red-600' : type === 'warning' ? 'bg-orange-100 text-orange-600' : 'bg-blue-100 text-blue-600'}`}>
                        {type === 'danger' ? <Trash2 size={32} /> : <AlertCircle size={32} />}
                    </div>
                    <h3 className="text-2xl font-bold text-gray-900 dark:text-slate-100 mb-2">{title}</h3>
                    <p className="text-gray-500 dark:text-slate-400 mb-8">{message}</p>
                    
                    <div className="flex gap-4 w-full">
                        <button 
                            onClick={onCancel}
                            className="flex-1 py-3 px-4 bg-gray-100 dark:bg-slate-800 hover:bg-gray-200 text-gray-900 dark:text-slate-100 font-bold rounded-xl transition-colors"
                        >
                            {cancelText}
                        </button>
                        <button 
                            onClick={onConfirm}
                            className={`flex-1 py-3 px-4 font-bold rounded-xl transition-colors text-white ${type === 'danger' ? 'bg-red-600 hover:bg-red-700' : type === 'warning' ? 'bg-orange-600 hover:bg-orange-700' : 'bg-blue-600 hover:bg-blue-700'}`}
                        >
                            {confirmText}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};
