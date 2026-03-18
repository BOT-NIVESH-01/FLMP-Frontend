import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export const TimetableTooltip = ({ subject, class: classInfo, faculty, children }) => {
  const [showTooltip, setShowTooltip] = useState(false);

  return (
    <div
      className="relative"
      onMouseEnter={() => setShowTooltip(true)}
      onMouseLeave={() => setShowTooltip(false)}
    >
      {children}

      <AnimatePresence>
        {showTooltip && (
          <motion.div
            initial={{ opacity: 0, y: -10, scale: 0.95 }}
            animate={{ opacity: 1, y: -5, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 z-50 w-max"
          >
            <div className="glass-card shadow-lg rounded-xl p-3 border border-[#E0E0E0] bg-white backdrop-blur-xl">
              <div className="space-y-2 text-sm">
                {subject && (
                  <div className="flex items-start gap-2">
                    <span className="text-[#0A4D9C] font-semibold min-w-fit">Subject:</span>
                    <span className="text-[#666666]">{subject}</span>
                  </div>
                )}
                {classInfo && (
                  <div className="flex items-start gap-2">
                    <span className="text-[#1E73BE] font-semibold min-w-fit">Class:</span>
                    <span className="text-[#666666]">{classInfo}</span>
                  </div>
                )}
                {faculty && (
                  <div className="flex items-start gap-2">
                    <span className="text-[#228B22] font-semibold min-w-fit">Faculty:</span>
                    <span className="text-[#666666]">{faculty}</span>
                  </div>
                )}
              </div>
              {/* Arrow */}
              <div className="absolute top-full left-1/2 -translate-x-1/2 w-2 h-2 bg-white rotate-45 border-r border-b border-[#E0E0E0]"></div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
