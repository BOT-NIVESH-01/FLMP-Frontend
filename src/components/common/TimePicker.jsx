import React from 'react';

export const TimePicker = ({ label, value, period, onChange }) => {
  return (
    <div className="flex flex-col gap-2 p-4 bg-white/50 backdrop-blur-md border border-slate-200/60 rounded-2xl shadow-[inset_0_1px_4px_rgba(255,255,255,0.5)]">
      <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">{label}</label>
      <div className="flex items-center gap-3">
        <input 
          type="time" 
          className="text-2xl font-black text-slate-800 bg-transparent border-none outline-none focus:ring-0 p-0 w-full"
          value={value}
          onChange={(e) => onChange('time', e.target.value)}
        />
        <div className="flex flex-col gap-1 bg-slate-200/50 p-1 rounded-xl">
          <button 
            type="button"
            className={`px-3 py-1 text-xs font-bold rounded-lg transition-all ${period === 'AM' ? 'bg-white shadow-sm text-blue-600' : 'text-slate-400 hover:text-slate-600 hover:bg-slate-200'}`}
            onClick={() => onChange('period', 'AM')}
          >
            AM
          </button>
          <button 
            type="button"
            className={`px-3 py-1 text-xs font-bold rounded-lg transition-all ${period === 'PM' ? 'bg-white shadow-sm text-blue-600' : 'text-slate-400 hover:text-slate-600 hover:bg-slate-200'}`}
            onClick={() => onChange('period', 'PM')}
          >
            PM
          </button>
        </div>
      </div>
    </div>
  );
};