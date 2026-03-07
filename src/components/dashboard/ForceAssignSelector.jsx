import React, { useState } from 'react';
import { UserPlus } from 'lucide-react';
import { getUserId } from '../../utils/substitutionEngine';

export const ForceAssignSelector = ({ slot, allUsers, onForceAssign }) => {
  const [selectedId, setSelectedId] = useState('');

  return (
    <div className="flex gap-2 items-center mt-3 p-2.5 bg-amber-50 rounded-xl border border-amber-200/60 shadow-sm">
      <UserPlus size={18} className="text-amber-600 shrink-0" />
      <select 
        className="text-xs p-1.5 border border-amber-200 rounded-lg flex-1 bg-white focus:outline-none focus:ring-2 focus:ring-amber-400 font-medium text-slate-700"
        value={selectedId}
        onChange={(e) => setSelectedId(e.target.value)}
      >
        <option value="">-- Force Assign Substitute --</option>
        {allUsers.map(u => (
          <option key={getUserId(u)} value={getUserId(u)}>{u.name} ({u.department})</option>
        ))}
      </select>
      <button 
        disabled={!selectedId}
        onClick={() => {
          const user = allUsers.find(u => getUserId(u) === selectedId);
          onForceAssign(slot, selectedId, user.name);
        }}
        className="px-3.5 py-1.5 bg-amber-500 text-white text-xs font-bold uppercase tracking-wider rounded-lg hover:bg-amber-600 disabled:opacity-50 transition-colors shadow-sm"
      >
        Force
      </button>
    </div>
  );
};