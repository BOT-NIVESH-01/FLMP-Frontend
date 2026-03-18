import React from 'react';

export const InputField = ({ icon: Icon, className = '', ...props }) => {
    return (
        <div className={`relative ${className}`}>
            {Icon && <Icon size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#0A4D9C]" />}
            <input
                {...props}
                className="w-full rounded-lg border border-[#E0E0E0] bg-white/95 py-3 text-sm text-[#1A1A1A] placeholder:text-[#999999] focus:border-[#0A4D9C] focus:outline-none focus:ring-2 focus:ring-[#0A4D9C]/20 transition-all"
                style={{ paddingLeft: Icon ? '2.25rem' : '0.9rem', paddingRight: '0.9rem' }}
            />
        </div>
    );
};
