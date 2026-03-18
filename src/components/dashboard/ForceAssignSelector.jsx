import React, { useState } from 'react';
import { UserPlus } from 'lucide-react';
import { getUserId } from '../../utils/substitutionEngine';

export const ForceAssignSelector = ({ slot, allUsers, onForceAssign }) => {
  const [selectedId, setSelectedId] = useState('');

  return (
    <div className="flex gap-2 items-center mt-3 p-2.5 bg-[#FFF4F0] rounded-xl border border-[#F7E4D1] shadow-soft">
      <UserPlus size={18} className="text-[#CC4A21] shrink-0" />
      <select
        className="text-xs p-1.5 border border-[#F7E4D1] rounded-lg flex-1 bg-white text-[#1A1A1A] focus:outline-none focus:ring-2 focus:ring-[#D2691E]/30 font-medium"
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
        className="px-3.5 py-1.5 bg-[#CC4A21] text-white text-xs font-bold uppercase tracking-wider rounded-lg hover:bg-[#B8391C] disabled:opacity-50 transition-colors shadow-soft"
      >
        Force
      </button>
    </div>
  );
};