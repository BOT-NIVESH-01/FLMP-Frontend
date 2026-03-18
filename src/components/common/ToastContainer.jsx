import React from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { CheckCircle, AlertCircle, Info, X } from 'lucide-react';

export const ToastContainer = ({ toasts, removeToast }) => {
  if (toasts.length === 0) return null;

  const getToastStyles = (type) => {
    if (type === 'success') {
      return 'border-[#D5F4CF]/60 bg-[#F0FDF4] text-[#228B22]';
    }
    if (type === 'error') {
      return 'border-[#FDD7C8]/60 bg-[#FFF4F0] text-[#CD5C5C]';
    }
    return 'border-[#D0E2F7]/60 bg-[#F4F7FB] text-[#0A4D9C]';
  };

  return (
    <div className="fixed bottom-6 right-6 z-[9999] flex w-[min(92vw,360px)] flex-col gap-3">
      <AnimatePresence>
        {toasts.map((toast) => (
          <motion.div
            key={toast.id}
            initial={{ opacity: 0, x: 24, scale: 0.96 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: 24, scale: 0.96 }}
            transition={{ duration: 0.22 }}
            className={`shadow-soft rounded-2xl border p-4 backdrop-blur-xl ${getToastStyles(toast.type)}`}
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-2.5 text-sm font-medium">
                {toast.type === 'success' && <CheckCircle size={20} />}
                {toast.type === 'error' && <AlertCircle size={20} />}
                {toast.type === 'info' && <Info size={20} />}
                <span>{toast.message}</span>
              </div>
              <button
                onClick={() => removeToast(toast.id)}
                className="rounded-md p-1 text-[#666666]/80 transition-colors hover:bg-[#E0E0E0]/20 hover:text-[#0A4D9C]"
              >
                <X size={16} />
              </button>
            </div>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
};