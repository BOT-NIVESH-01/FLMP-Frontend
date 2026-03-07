import React from 'react';
import { CheckCircle, AlertCircle, Info, X } from 'lucide-react';

export const ToastContainer = ({ toasts, removeToast }) => {
  if (toasts.length === 0) return null;
  return (
    <div className="fixed bottom-6 right-6 z-[9999] flex flex-col gap-3">
      {toasts.map(toast => (
        <div 
          key={toast.id} 
          className={`min-w-[300px] p-4 rounded-xl text-white shadow-xl flex items-center justify-between transition-all duration-300 transform translate-x-0 ${
            toast.type === 'success' ? 'bg-emerald-600' : 
            toast.type === 'error' ? 'bg-rose-500' : 'bg-blue-600'
          }`}
        >
          <div className="flex items-center gap-3 font-medium text-sm">
            {toast.type === 'success' && <CheckCircle size={20} />}
            {toast.type === 'error' && <AlertCircle size={20} />}
            {toast.type === 'info' && <Info size={20} />}
            <span>{toast.message}</span>
          </div>
          <button 
            onClick={() => removeToast(toast.id)} 
            className="text-white/80 hover:text-white transition-colors"
          >
            <X size={16} />
          </button>
        </div>
      ))}
    </div>
  );
};