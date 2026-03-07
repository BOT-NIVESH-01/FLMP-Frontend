import React from 'react';
import { getUserId } from '../../utils/substitutionEngine';

export const FacultyOverview = ({ users, leaves }) => {
  const today = new Date().toISOString().split('T')[0];
  
  const getStatus = (userId) => {
    const onLeave = leaves.find(l => l.userId === userId && l.date === today && (l.status === 'Approved' || l.status === 'Pending'));
    return onLeave ? { text: 'On Leave', class: 'bg-rose-100 text-rose-800 border-rose-200' } : { text: 'Available', class: 'bg-emerald-100 text-emerald-800 border-emerald-200' };
  };

  return (
    <div className="bg-white border border-slate-200 rounded-3xl shadow-sm overflow-hidden mb-auto">
      <div className="p-6 border-b border-slate-100 bg-slate-50/50">
        <h2 className="text-xl font-bold text-slate-800">Faculty Overview (Today)</h2>
        <p className="text-sm text-slate-500 mt-1">{new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
      </div>
      <div className="overflow-x-auto p-4">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr>
              <th className="p-4 text-xs font-bold text-slate-500 uppercase tracking-wider border-b border-slate-200">Name</th>
              <th className="p-4 text-xs font-bold text-slate-500 uppercase tracking-wider border-b border-slate-200">Department</th>
              <th className="p-4 text-xs font-bold text-slate-500 uppercase tracking-wider border-b border-slate-200">Current Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {users.map(u => {
              const status = getStatus(getUserId(u));
              return (
                <tr key={getUserId(u)} className="hover:bg-slate-50/80 transition-colors">
                  <td className="p-4 font-semibold text-slate-800 text-sm">{u.name}</td>
                  <td className="p-4 text-slate-600 text-sm">{u.department}</td>
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