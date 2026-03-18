import React from 'react';
import { getUserId } from '../../utils/substitutionEngine';

export const FacultyOverview = ({ users, leaves }) => {
  const today = new Date().toISOString().split('T')[0];
  
  const getStatus = (userId) => {
    const onLeave = leaves.find(l => l.userId === userId && l.date === today && (l.status === 'Approved' || l.status === 'Pending'));
    return onLeave ? { text: 'On Leave', class: 'bg-[#FFF4F0] text-[#CD5C5C] border-[#F7E4D1]' } : { text: 'Available', class: 'bg-[#F0FDF4] text-[#228B22] border-[#D5F4CF]' };
  };

  return (
    <div className="bg-white border border-[#E0E0E0] rounded-3xl shadow-soft overflow-hidden mb-auto">
      <div className="p-6 border-b border-[#E0E0E0] bg-gradient-to-r from-[#F4F7FB] to-white">
        <h2 className="text-xl font-bold text-[#0A4D9C]">Faculty Overview (Today)</h2>
        <p className="text-sm text-[#666666] mt-1">{new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
      </div>
      <div className="overflow-x-auto p-4">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr>
              <th className="p-4 text-xs font-bold text-[#0A4D9C] uppercase tracking-wider border-b border-[#E0E0E0]">Name</th>
              <th className="p-4 text-xs font-bold text-[#0A4D9C] uppercase tracking-wider border-b border-[#E0E0E0]">Department</th>
              <th className="p-4 text-xs font-bold text-[#0A4D9C] uppercase tracking-wider border-b border-[#E0E0E0]">Current Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#E0E0E0]">
            {users.map(u => {
              const status = getStatus(getUserId(u));
              return (
                <tr key={getUserId(u)} className="hover:bg-[#F4F7FB]/80 transition-colors">
                  <td className="p-4 font-semibold text-[#1A1A1A] text-sm">{u.name}</td>
                  <td className="p-4 text-[#475569] text-sm">{u.department}</td>
                  <td className="p-4">
                    <span className={`px-2.5 py-1 rounded-full text-xs font-bold tracking-wide uppercase border ${status.class}`}>
                      {status.text}
                    </span>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};