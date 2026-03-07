import React, { useState } from 'react';
import { Calendar, CheckCircle, Clock, User, Users, LogOut, BookOpen, Shield, Eye, AlertCircle, XCircle, Check } from 'lucide-react';
import { TimetableView } from '../timetable/TimeTableView';
import { FacultyOverview } from './FacultyOverview';
import { LeaveApplicationForm } from './LeaveApplicationForm';
import { ForceAssignSelector } from './ForceAssignSelector';
import { StatusBadge } from '../common/StatusBadge';
import { getUserId, findAvailableSubstitutes } from '../../utils/substitutionEngine';

export const Dashboard = ({ user, allUsers, leaves, timetable, onLogout, onRequestLeave, onApproveLeave, onAcceptSubRequest, onForceAssign, addToast }) => {
  const [showLeaveForm, setShowLeaveForm] = useState(false);
  const [currentView, setCurrentView] = useState('dashboard');

  const myLeaves = leaves.filter(l => l.userId === getUserId(user));
  const userId = getUserId(user);
  
  const isAdminOrHod = ['admin', 'hod'].includes(user.role?.toLowerCase());
  
  const pendingApprovals = isAdminOrHod
    ? leaves.filter(l => l.status === 'Pending')
    : [];

  const incomingSubRequests = leaves.flatMap(l => {
     const acceptedSlots = new Set();
     l.substitutions.forEach(s => {
        if (s.status === 'Accepted') {
           acceptedSlots.add(`${s.date}-${s.slot}`);
        }
     });

     return l.substitutions
      .filter(s => {
         if (s.subId !== userId) return false;
         if (s.status !== 'Pending') return false;
         const slotKey = `${s.date}-${s.slot}`;
         if (acceptedSlots.has(slotKey)) return false;
         return true;
      })
      .map(s => ({ ...s, leaveId: l._id, leaveDate: l.date, requester: l.userName }));
  });

  return (
    <div className="flex h-screen w-screen bg-slate-50 overflow-hidden font-sans text-slate-800">
      <div className="w-72 bg-slate-900 flex flex-col shrink-0 h-full shadow-2xl relative z-20">
        <div className="p-6 border-b border-slate-800 flex items-center gap-3 text-white">
          <div className="bg-blue-600 p-2 rounded-xl shadow-inner shadow-blue-500/50">
            <Shield size={24} strokeWidth={2.5} />
          </div>
          <h1 className="font-extrabold text-xl tracking-tight">UniAdmin</h1>
        </div>
        
        <div className="flex-1 overflow-y-auto py-6 flex flex-col gap-6">
          <div className="px-6">
            <div className="bg-slate-800/80 border border-slate-700/50 p-4 rounded-2xl flex items-center gap-4">
              <div className="bg-slate-700 p-2.5 rounded-full text-slate-300 shrink-0">
                <User size={20} />
              </div>
              <div className="overflow-hidden">
                <div className="font-bold text-white text-sm truncate">{user.name}</div>
                <div className="text-xs text-blue-400 font-semibold mt-0.5 uppercase tracking-wide">{user.role}</div>
              </div>
            </div>
          </div>

          <nav className="flex flex-col gap-1.5 px-3">
            <div className="text-[0.65rem] font-bold text-slate-500 uppercase tracking-widest px-4 mb-2">Navigation</div>
            <button
              onClick={() => setCurrentView('dashboard')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all font-medium text-sm ${currentView === 'dashboard' ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20' : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'}`}
            >
              <BookOpen size={18} /> Dashboard
            </button>
            <button
              onClick={() => setCurrentView('timetable')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all font-medium text-sm ${currentView === 'timetable' ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20' : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'}`}
            >
              <Calendar size={18} /> Master Timetable
            </button>
            {isAdminOrHod && (
              <button
                onClick={() => setCurrentView('faculty_overview')}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all font-medium text-sm ${currentView === 'faculty_overview' ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20' : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'}`}
              >
                <Users size={18} /> Faculty Status
              </button>
            )}
          </nav>
        </div>

        <div className="p-4 border-t border-slate-800 shrink-0">
          <button onClick={onLogout} className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-rose-400 hover:bg-rose-500/10 hover:text-rose-300 transition-colors text-sm font-bold">
            <LogOut size={18} /> Sign Out
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-6 md:p-10 relative">
        <div className="max-w-7xl mx-auto w-full flex flex-col gap-8 h-full">

          {currentView === 'timetable' ? (
            <TimetableView user={user} timetable={timetable} />
          ) : currentView === 'faculty_overview' ? (
            <FacultyOverview users={allUsers} leaves={leaves} />
          ) : (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
                <div className="bg-white border border-slate-200 p-6 rounded-3xl shadow-sm flex flex-col justify-center relative overflow-hidden">
                  <div className="absolute -right-4 -bottom-4 text-slate-100"><Calendar size={100} /></div>
                  <div className="relative z-10">
                    <div className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">Casual Leave</div>
                    <div className="text-3xl font-extrabold text-slate-800">{user.leaveBalance.casual} <span className="text-base font-semibold text-slate-400">/ 12</span></div>
                  </div>
                </div>
                <div className="bg-white border border-slate-200 p-6 rounded-3xl shadow-sm flex flex-col justify-center relative overflow-hidden">
                  <div className="absolute -right-4 -bottom-4 text-rose-50"><CheckCircle size={100} /></div>
                  <div className="relative z-10">
                    <div className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">Medical Leave</div>
                    <div className="text-3xl font-extrabold text-slate-800">{user.leaveBalance.sick} <span className="text-base font-semibold text-slate-400">/ 10</span></div>
                  </div>
                </div>
                <div className="bg-white border border-slate-200 p-6 rounded-3xl shadow-sm flex flex-col justify-center relative overflow-hidden">
                  <div className="absolute -right-4 -bottom-4 text-blue-50"><Shield size={100} /></div>
                  <div className="relative z-10">
                    <div className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">Department</div>
                    <div className="text-lg font-bold text-blue-600 leading-tight pr-8">{user.department}</div>
                  </div>
                </div>
                
                <button
                  onClick={() => setShowLeaveForm(true)}
                  className="bg-blue-600 hover:bg-blue-700 text-white border border-blue-700 p-6 rounded-3xl shadow-md shadow-blue-600/20 flex flex-col items-center justify-center gap-3 transition-all active:scale-95 group"
                >
                  <div className="bg-white/20 p-3 rounded-full group-hover:bg-white/30 transition-colors">
                    <Calendar size={24} />
                  </div>
                  <span className="text-lg font-bold">Apply Leave</span>
                </button>
              </div>

              {incomingSubRequests.length > 0 && (
                <div className="bg-white border border-amber-200 rounded-3xl shadow-sm overflow-hidden">
                  <div className="p-5 bg-amber-50 border-b border-amber-100 flex justify-between items-center">
                    <h3 className="m-0 text-amber-800 flex items-center font-bold gap-2">
                      <AlertCircle size={20} /> Substitution Requests
                    </h3>
                    <span className="bg-amber-200 text-amber-900 px-3 py-1 rounded-full text-xs font-bold">{incomingSubRequests.length} Pending</span>
                  </div>
                  <div className="divide-y divide-slate-100">
                    {incomingSubRequests.map((req, idx) => (
                      <div key={idx} className="p-5 flex items-center justify-between flex-wrap gap-4 hover:bg-slate-50 transition-colors">
                        <div>
                          <p className="font-bold text-sm text-slate-800 mb-1">Substitute for {req.requester}</p>
                          <div className="text-xs text-slate-500 font-medium flex gap-4">
                            <span className="flex items-center gap-1.5"><Calendar size={14} className="text-slate-400" /> {req.date || req.leaveDate}</span>
                            <span className="flex items-center gap-1.5"><Clock size={14} className="text-slate-400" /> Slot {req.slot}</span>
                            <span className="flex items-center gap-1.5"><BookOpen size={14} className="text-slate-400" /> {req.class}</span>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <button
                            onClick={() => onAcceptSubRequest(req.leaveId, req.slot, false)}
                            className="px-4 py-2 border border-slate-300 text-slate-600 rounded-xl text-sm font-semibold hover:bg-slate-100 transition-colors"
                          >
                            Decline
                          </button>
                          <button
                            onClick={() => onAcceptSubRequest(req.leaveId, req.slot, true)}
                            className="px-4 py-2 bg-blue-600 text-white rounded-xl text-sm font-bold shadow-md shadow-blue-600/20 hover:bg-blue-700 transition-colors"
                          >
                            Accept Class
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {isAdminOrHod && (
                <div className="bg-white border border-slate-200 rounded-3xl shadow-sm overflow-hidden mb-auto">
                  <div className="p-6 border-b border-slate-100 bg-slate-50/50">
                    <h3 className="m-0 font-bold text-slate-800 text-lg">Pending Leave Approvals</h3>
                  </div>
                  <div className="overflow-x-auto p-4">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr>
                          <th className="p-4 text-xs font-bold text-slate-500 uppercase tracking-wider border-b border-slate-200">Faculty</th>
                          <th className="p-4 text-xs font-bold text-slate-500 uppercase tracking-wider border-b border-slate-200">Details</th>
                          <th className="p-4 text-xs font-bold text-slate-500 uppercase tracking-wider border-b border-slate-200 min-w-[300px]">Substitutions Plan</th>
                          <th className="p-4 text-xs font-bold text-slate-500 uppercase tracking-wider border-b border-slate-200 text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {pendingApprovals.map(l => {
                          const groupedBySlot = {};
                          l.substitutions.forEach(s => {
                             const key = `${s.date}-${s.slot}`;
                             if (!groupedBySlot[key]) groupedBySlot[key] = { date: s.date, slot: s.slot, candidates: [], accepted: null };
                             groupedBySlot[key].candidates.push(s);
                             if (s.status === 'Accepted') groupedBySlot[key].accepted = s;
                          });

                          return (
                          <tr key={l._id} className="hover:bg-slate-50/50">
                            <td className="p-4 align-top">
                              <div className="font-bold text-slate-800 text-sm">{l.userName}</div>
                            </td>
                            <td className="p-4 align-top">
                              <span className="inline-block px-2 py-0.5 bg-blue-100 text-blue-800 text-[0.65rem] font-bold uppercase rounded mb-1">{l.type}</span>
                              <div className="text-xs font-medium text-slate-600 mb-1">{l.date}</div>
                              <div className="text-xs text-slate-500 max-w-xs line-clamp-2 italic border-l-2 border-slate-300 pl-2">{l.reason}</div>
                            </td>
                            <td className="p-4 align-top">
                              {l.substitutions.length > 0 ? (
                                <ul className="flex flex-col gap-3">
                                  {Object.values(groupedBySlot).map((group, gIdx) => (
                                    <li key={gIdx} className="bg-slate-50 p-3 rounded-xl border border-slate-200">
                                      <div className="flex items-center justify-between mb-1">
                                         <div className="flex items-center gap-2">
                                            <span className="bg-slate-200 text-slate-700 text-xs font-bold px-2 py-0.5 rounded shadow-sm">{group.date} • S{group.slot}</span>
                                            {group.accepted ? (
                                              <span className="font-bold text-sm text-emerald-700">{group.accepted.subName}</span>
                                            ) : (
                                              <span className="text-xs font-semibold text-amber-600 bg-amber-100 px-2 py-0.5 rounded">Pending ({group.candidates.length} Notified)</span>
                                            )}
                                         </div>
                                         {group.accepted && <StatusBadge status="Accepted" />}
                                      </div>
                                      {!group.accepted && (
                                        <div className="mt-2 border-t border-slate-200 pt-2">
                                           <ForceAssignSelector 
                                             slot={group.slot} 
                                             allUsers={findAvailableSubstitutes(group.date || l.date, group.slot, l.userId, allUsers, timetable, leaves)}
                                             onForceAssign={(slot, subId, subName) => onForceAssign(l._id, slot, subId, subName)}
                                           />
                                        </div>
                                      )}
                                    </li>
                                  ))}
                                </ul>
                              ) : <span className="text-slate-400 text-sm italic font-medium">No substitutions required</span>}
                            </td>
                            <td className="p-4 align-top text-right">
                              <div className="flex flex-col gap-2 justify-end items-end">
                                <button onClick={() => onApproveLeave(l._id, 'Approved')} className="w-full max-w-[120px] bg-emerald-500 hover:bg-emerald-600 text-white font-bold py-2 rounded-xl text-xs shadow-md shadow-emerald-500/20 transition-all active:scale-95">Approve Leave</button>
                                <button onClick={() => onApproveLeave(l._id, 'Rejected')} className="w-full max-w-[120px] bg-white border border-rose-200 text-rose-600 hover:bg-rose-50 font-bold py-2 rounded-xl text-xs transition-colors">Reject</button>
                              </div>
                            </td>
                          </tr>
                        )})}
                        {pendingApprovals.length === 0 && (
                           <tr><td colSpan="4" className="text-center p-8 text-slate-400 font-medium italic">All caught up! No pending approvals.</td></tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              <div className="bg-white border border-slate-200 rounded-3xl shadow-sm overflow-hidden mb-auto">
                <div className="p-6 border-b border-slate-100 bg-slate-50/50">
                  <h3 className="m-0 font-bold text-slate-800 text-lg">My Leave History</h3>
                </div>
                <div className="overflow-x-auto p-4">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr>
                        <th className="p-4 text-xs font-bold text-slate-500 uppercase tracking-wider border-b border-slate-200">Date & Type</th>
                        <th className="p-4 text-xs font-bold text-slate-500 uppercase tracking-wider border-b border-slate-200">Reason</th>
                        <th className="p-4 text-xs font-bold text-slate-500 uppercase tracking-wider border-b border-slate-200">Substitutes</th>
                        <th className="p-4 text-xs font-bold text-slate-500 uppercase tracking-wider border-b border-slate-200 text-right">HOD Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {myLeaves.map(l => {
                        const uniqueSlots = {};
                        l.substitutions.forEach(s => {
                           const key = `${s.date || l.date}-${s.slot}`;
                           if (!uniqueSlots[key]) {
                             uniqueSlots[key] = {
                               date: s.date || l.date,
                               slot: s.slot,
                               accepted: null,
                               pendingCount: 0,
                               rejectedCount: 0
                             };
                           }
                           if (s.status === 'Accepted') {
                             uniqueSlots[key].accepted = s.subName;
                           } else if (s.status === 'Pending') {
                             uniqueSlots[key].pendingCount++;
                           } else if (s.status === 'Rejected') {
                             uniqueSlots[key].rejectedCount++;
                           }
                        });
                        const slotList = Object.values(uniqueSlots).sort((a,b) => {
                            return a.date.localeCompare(b.date) || a.slot - b.slot;
                        });

                        return (
                          <tr key={l._id} className="hover:bg-slate-50/50 transition-colors">
                            <td className="p-4 align-top">
                              <div className="font-bold text-slate-800 text-sm mb-1">{l.date}</div>
                              <span className="inline-block px-2.5 py-0.5 bg-slate-100 border border-slate-200 text-slate-600 text-[0.65rem] font-bold uppercase rounded-full tracking-wide">{l.type}</span>
                            </td>
                            <td className="p-4 align-top">
                              <p className="text-xs text-slate-600 max-w-xs">{l.reason}</p>
                            </td>
                            <td className="p-4 align-top">
                              {slotList.length === 0 ? (
                                <span className="px-3 py-1 bg-slate-100 text-slate-500 rounded-full text-xs font-semibold inline-flex items-center gap-1.5 border border-slate-200">
                                  <Check size={12} />
                                  {['Casual', 'Partial'].includes(l.type) ? 'Not Required' : '-'}
                                </span>
                              ) : (
                                <div className="flex flex-col gap-2">
                                   {slotList.map((slotInfo, idx) => (
                                      <div key={idx} className="flex items-center gap-2">
                                        <span className="bg-slate-100 text-slate-600 text-[0.65rem] font-bold px-1.5 py-0.5 rounded shadow-sm border border-slate-200">
                                          S{slotInfo.slot}
                                        </span>
                                        {slotInfo.accepted ? (
                                          <span className="text-emerald-700 text-xs font-bold flex items-center gap-1">
                                            <CheckCircle size={12} className="shrink-0" /> 
                                            {l.type === 'Medical' ? `${slotInfo.date} - ` : ''} {slotInfo.accepted}
                                          </span>
                                        ) : slotInfo.pendingCount > 0 ? (
                                          <span className="text-amber-600 text-xs font-semibold flex items-center gap-1">
                                            <Clock size={12} className="shrink-0" /> 
                                            {l.type === 'Medical' ? `${slotInfo.date} - ` : ''} Waiting ({slotInfo.pendingCount})
                                          </span>
                                        ) : (
                                          <span className="text-rose-600 text-xs font-semibold flex items-center gap-1">
                                            <XCircle size={12} className="shrink-0" /> Cancelled/Rejected
                                          </span>
                                        )}
                                      </div>
                                   ))}
                                </div>
                              )}
                            </td>
                            <td className="p-4 align-top text-right">
                              <div className="flex justify-end"><StatusBadge status={l.status} /></div>
                            </td>
                          </tr>
                        );
                      })}
                      {myLeaves.length === 0 && (
                        <tr>
                          <td colSpan="4" className="text-center p-8 text-slate-400 font-medium italic">No leave history found.</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      {showLeaveForm && (
        <LeaveApplicationForm
          user={user}
          allUsers={allUsers} 
          onClose={() => setShowLeaveForm(false)}
          onSubmit={(data) => {
            onRequestLeave(data);
            setShowLeaveForm(false);
          }}
          addToast={addToast}
          timetable={timetable}
          leaves={leaves}
        />
      )}
    </div>
  );
};