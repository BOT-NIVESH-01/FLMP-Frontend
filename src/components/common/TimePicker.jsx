import React from 'react';

export const TimePicker = ({ label, value, period, onChange }) => {
  return (
    <div className="flex flex-col gap-2 p-4 bg-white/50 backdrop-blur-md border border-[#E0E0E0]/60 rounded-2xl shadow-[inset_0_1px_4px_rgba(255,255,255,0.5)]">
      <label className="text-xs font-bold text-[#666666] uppercase tracking-widest">{label}</label>
      <div className="flex items-center gap-3">
        <input
          type="time"
          className="text-2xl font-black text-[#1A1A1A] bg-transparent border-none outline-none focus:ring-0 p-0 w-full"
          value={value}
          onChange={(e) => onChange('time', e.target.value)}
        />
        <div className="flex flex-col gap-1 bg-[#F4F7FB]/50 p-1 rounded-xl">
          <button
            type="button"
            className={`px-3 py-1 text-xs font-bold rounded-lg transition-all ${period === 'AM' ? 'bg-white shadow-sm text-[#0A4D9C]' : 'text-[#999999] hover:text-[#666666] hover:bg-[#F4F7FB]'}`}
            onClick={() => onChange('period', 'AM')}
          >
            AM
          </button>
          <button
            type="button"
            className={`px-3 py-1 text-xs font-bold rounded-lg transition-all ${period === 'PM' ? 'bg-white shadow-sm text-[#0A4D9C]' : 'text-[#999999] hover:text-[#666666] hover:bg-[#F4F7FB]'}`}
            onClick={() => onChange('period', 'PM')}
          >
            PM
          </button>
        </div>
      </div>
    </div>
  );
};