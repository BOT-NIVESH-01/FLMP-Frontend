import React from 'react';
import { motion } from 'framer-motion';

const CHANGE_STYLES = {
  positive: {
    textColor: 'text-[#228B22]',
    bgGradient: 'bg-gradient-to-br from-[#228B22]/10 to-[#228B22]/5',
    borderGradient: 'from-[#228B22]/20 to-[#228B22]/5',
    accentGradient: 'from-[#228B22] to-[#1a6b1a]'
  },
  negative: {
    textColor: 'text-[#CD5C5C]',
    bgGradient: 'bg-gradient-to-br from-[#CD5C5C]/10 to-[#CD5C5C]/5',
    borderGradient: 'from-[#CD5C5C]/20 to-[#CD5C5C]/5',
    accentGradient: 'from-[#CD5C5C] to-[#B84A4A]'
  },
  neutral: {
    textColor: 'text-[#0A4D9C]',
    bgGradient: 'bg-gradient-to-br from-[#0A4D9C]/10 to-[#1E73BE]/5',
    borderGradient: 'from-[#0A4D9C]/20 to-[#1E73BE]/5',
    accentGradient: 'from-[#0A4D9C] to-[#1E73BE]'
  }
};

export const StatCard = ({
  icon: Icon,
  label,
  value,
  change,
  changeType = 'neutral'
}) => {
  const { textColor, bgGradient, borderGradient, accentGradient } = CHANGE_STYLES[changeType];

  return (
    <motion.div
      whileHover={{ y: -4, scale: 1.01 }}
      transition={{ type: 'spring', stiffness: 260, damping: 20 }}
      className={`relative overflow-hidden rounded-2xl border border-[#E0E0E0] ${bgGradient} p-6 backdrop-blur-xl shadow-soft`}
    >
      {/* Glowing border gradient */}
      <div className={`absolute inset-0 bg-gradient-to-br ${borderGradient} opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none`} />

      <div className="relative z-10 flex items-start justify-between">
        <div className="flex flex-col gap-2">
          <p className="text-sm font-medium text-[#666666] uppercase tracking-wide">{label}</p>
          <p className="text-4xl font-bold text-[#0A4D9C] font-display">{value}</p>
          {change && (
            <p className={`text-xs font-semibold ${textColor}`}>
              {change}
            </p>
          )}
        </div>

        {Icon && (
          <div className="rounded-xl bg-gradient-to-br from-[#E0E0E0]/60 to-[#F4F7FB]/40 p-3">
            <Icon size={24} className="text-[#0A4D9C]" strokeWidth={1.5} />
          </div>
        )}
      </div>

      {/* Subtle accent line */}
      <div className={`absolute bottom-0 left-0 h-1 bg-gradient-to-r ${accentGradient} w-full opacity-50`} />
    </motion.div>
  );
};
