import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';

export const Modal = React.memo(({ isOpen, title, onClose, children, footer, size = 'md' }) => {
  const sizeClasses = {
    sm: 'w-full max-w-sm',
    md: 'w-full max-w-2xl',
    lg: 'w-full max-w-4xl',
    xl: 'w-full max-w-6xl'
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm"
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ type: 'spring', stiffness: 300, damping: 25 }}
            className={`fixed top-1/2 left-1/2 z-50 -translate-x-1/2 -translate-y-1/2 ${sizeClasses[size]}`}
          >
            <div className="glass-card shadow-soft mx-4 overflow-hidden bg-white">
              {/* Header */}
              {title && (
                <div className="flex items-center justify-between border-b border-[#E0E0E0] px-6 py-4">
                  <h2 className="text-xl font-bold text-[#0A4D9C]">{title}</h2>
                  <button
                    onClick={onClose}
                    className="rounded-lg p-1.5 text-[#666666] hover:bg-[#F4F7FB] hover:text-[#0A4D9C] transition-colors"
                  >
                    <X size={20} />
                  </button>
                </div>
              )}

              {/* Body */}
              <div className="max-h-[600px] overflow-y-auto p-6">
                {children}
              </div>

              {/* Footer */}
              {footer && (
                <div className="flex items-center justify-end gap-3 border-t border-[#E0E0E0] px-6 py-4 bg-[#F4F7FB]/50">
                  {footer}
                </div>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
});
