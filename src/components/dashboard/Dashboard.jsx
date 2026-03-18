import React, { useState, useMemo } from 'react';
import axios from 'axios';
import { motion } from 'framer-motion';
import {
  Calendar, CheckCircle, Clock, User, Users, LogOut, BookOpen, Shield,
  Eye, AlertCircle, XCircle, Check, UserPlus, Plus, Trash2, Save, Loader,
  Edit, AlertOctagon, X, ChevronRight, Grid, FileText, Menu, Moon, Sun,
  Search, Building2, MapPin, Sparkles
} from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';

const API_URL = 'http://localhost:5000/api';

// ============================================================================
// UTILITIES
// ============================================================================
const getDayName = (dateStr) => {
  if (!dateStr) return '';
  const date = new Date(dateStr + 'T12:00:00');
  return date.toLocaleDateString('en-US', { weekday: 'long' });
};

const getDatesInRange = (startDate, endDate) => {
  const dates = [];
  const currDate = new Date(startDate + 'T12:00:00');
  const lastDate = new Date(endDate + 'T12:00:00');

  while (currDate <= lastDate) {
    dates.push(currDate.toISOString().split('T')[0]);
    currDate.setDate(currDate.getDate() + 1);
  }
  return dates;
};

const getUserId = (user) => user._id || user.id;

const SLOT_TIMES = {
  1: { start: 8 * 60, end: 8 * 60 + 50 },
  2: { start: 9 * 60 + 10, end: 10 * 60 },
  3: { start: 10 * 60, end: 10 * 60 + 50 },
  4: { start: 11 * 60 + 10, end: 12 * 60 },
  5: { start: 12 * 60, end: 12 * 60 + 50 },
  6: { start: 13 * 60 + 40, end: 14 * 60 + 30 },
  7: { start: 14 * 60 + 30, end: 15 * 60 + 20 },
  8: { start: 15 * 60 + 20, end: 16 * 60 + 10 },
};

const timeStrToMinutes = (timeStr, period) => {
  if (!timeStr) return 0;
  let [h, m] = timeStr.split(':').map(Number);
  if (period === 'PM' && h !== 12) h += 12;
  if (period === 'AM' && h === 12) h = 0;
  return h * 60 + m;
};

const findAvailableSubstitutes = (dateStr, slot, originalUserId, allUsers, timetable, leaves) => {
  const dayName = getDayName(dateStr);
  // Use Set for O(1) lookups instead of array .includes() which is O(n)
  const usersOnLeaveSet = new Set(
    leaves
      .filter(l => l.date === dateStr && (l.status === 'Pending' || l.status === 'Approved'))
      .map(l => l.userId)
  );

  const candidates = allUsers.filter(u => {
    const role = (u.role || '').toLowerCase();
    return (
      getUserId(u) !== originalUserId &&
      !usersOnLeaveSet.has(getUserId(u)) &&
      role !== 'admin' &&
      role !== 'deo'
    );
  });

  return candidates.filter(candidate => {
    const hasClass = timetable.find(t => {
      const isUser = t.userId === getUserId(candidate);
      const isSlot = t.slot === slot;
      if (!isUser || !isSlot) return false;
      if (t.date) return t.date === dateStr;
      return t.day === dayName;
    });
    return !hasClass;
  });
};

// ============================================================================
// SUB-COMPONENTS
// ============================================================================

const StatusBadge = ({ status }) => {
  let badgeClass = 'bg-[#FFF1E6] text-[#CC4A21] border-[#F7E4D1]';
  let Icon = Clock;

  if (status === 'Accepted' || status === 'Approved') {
    badgeClass = 'bg-[#F0FDF4] text-[#228B22] border-[#D5F4CF]';
    Icon = CheckCircle;
  }
  else if (status === 'Rejected') {
    badgeClass = 'bg-[#FFF4F0] text-[#CD5C5C] border-[#FDD7C8]';
    Icon = XCircle;
  }

  return (
    <span className={`px-2.5 py-1 rounded-full text-[0.7rem] font-bold tracking-wide uppercase flex items-center gap-1.5 border w-fit ${badgeClass}`}>
      <Icon size={12} strokeWidth={2.5} />
      {status}
    </span>
  );
};

const TimePicker = ({ label, value, period, onChange }) => {
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
        <div className="flex flex-col gap-1 bg-white p-1 rounded-xl">
          <button
            type="button"
            className={`px-3 py-1 text-xs font-bold rounded-lg transition-all ${period === 'AM' ? 'bg-white shadow-sm text-[#0A4D9C]' : 'text-[#666666] hover:text-[#1A1A1A] hover:bg-[#F4F7FB]'}`}
            onClick={() => onChange('period', 'AM')}
          >AM</button>
          <button
            type="button"
            className={`px-3 py-1 text-xs font-bold rounded-lg transition-all ${period === 'PM' ? 'bg-white shadow-sm text-[#0A4D9C]' : 'text-[#666666] hover:text-[#1A1A1A] hover:bg-[#F4F7FB]'}`}
            onClick={() => onChange('period', 'PM')}
          >PM</button>
        </div>
      </div>
    </div>
  );
};

const ForceAssignSelector = ({ slot, allUsers, onForceAssign }) => {
  const [selectedId, setSelectedId] = useState('');
  const selectableUsers = allUsers.filter(u => {
    const role = (u.role || '').toLowerCase();
    return role !== 'admin' && role !== 'deo';
  });

  return (
    <div className="flex gap-2 items-center mt-3 p-2.5 bg-[#FDB752]/20 rounded-xl border border-[#FDB752]/60 shadow-sm">
      <UserPlus size={18} className="text-[#CC8B1D] shrink-0" />
      <select
        className="text-xs p-1.5 border border-[#FDB752] rounded-lg flex-1 bg-white focus:outline-none focus:ring-2 focus:ring-[#FDB752] font-medium text-[#1A1A1A]"
        value={selectedId}
        onChange={(e) => setSelectedId(e.target.value)}
        disabled={selectableUsers.length === 0}
      >
        <option value="">-- Force Assign Substitute --</option>
        {selectableUsers.map(u => (
          <option key={getUserId(u)} value={getUserId(u)}>{u.name} ({u.department})</option>
        ))}
      </select>
      <button
        disabled={!selectedId}
        onClick={() => {
          const user = selectableUsers.find(u => getUserId(u) === selectedId);
          onForceAssign(slot, selectedId, user.name);
        }}
        className="px-3.5 py-1.5 bg-[#FDB752] text-white text-xs font-bold uppercase tracking-wider rounded-lg hover:bg-[#E6A917] disabled:opacity-50 transition-colors shadow-sm"
      >
        Force
      </button>
    </div>
  );
};

const FacultyOverview = ({ isDark, users, leaves }) => {
  const today = new Date().toISOString().split('T')[0];
  const getStatus = (userId) => {
    const onLeave = leaves.find(l => l.userId === userId && l.date === today && (l.status === 'Approved' || l.status === 'Pending'));
    return onLeave ? { text: 'On Leave', class: 'bg-[#FFF4F0] text-[#CD5C5C] border-[#FDD7C8]' } : { text: 'Available', class: 'bg-[#F0FDF4] text-[#228B22] border-[#D5F4CF]' };
  };

  return (
    <div className="glass-card shadow-soft border border-[#E0E0E0] rounded-2xl overflow-hidden mb-auto transition-colors">
      <div className="p-6 border-b transition-colors border-[#E0E0E0] bg-gradient-to-r from-white to-[#F8FAFC]">
        <h2 className="text-xl font-bold text-[#1A1A1A]">Faculty Overview (Today)</h2>
        <p className="text-sm mt-1 text-[#666666]">{new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
      </div>
      <div className="overflow-x-auto p-4">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr>
              <th className="p-4 text-xs font-bold uppercase tracking-wider border-b text-[#666666] border-[#E0E0E0]">Name</th>
              <th className="p-4 text-xs font-bold uppercase tracking-wider border-b text-[#666666] border-[#E0E0E0]">Department</th>
              <th className="p-4 text-xs font-bold uppercase tracking-wider border-b text-[#666666] border-[#E0E0E0]">Current Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#E0E0E0]">
            {users.map(u => {
              const status = getStatus(getUserId(u));
              return (
                <tr key={getUserId(u)} className="transition-colors hover:bg-[#F4F7FB]/40">
                  <td className="p-4 font-semibold text-sm text-[#1A1A1A]">{u.name}</td>
                  <td className="p-4 text-sm text-[#666666]">{u.department}</td>
                  <td className="p-4">
                    <span className={`px-2.5 py-1 rounded text-xs font-bold tracking-wide uppercase border ${status.class}`}>
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

const TimetableView = ({ isDark, user, timetable, allUsers = [], leaves = [] }) => {
  const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const slots = [
    { id: 2, time: '9:00 – 10:00', start: '9:00', end: '10:00' },
    { id: 3, time: '10:00 – 11:00', start: '10:00', end: '11:00' },
    { id: 4, time: '11:00 – 12:00', start: '11:00', end: '12:00' },
    { id: 6, time: '1:00 – 2:00', start: '1:00', end: '2:00' },
    { id: 7, time: '2:00 – 3:00', start: '2:00', end: '3:00' },
    { id: 8, time: '3:00 – 4:00', start: '3:00', end: '4:00' },
  ];

  const [weekOffset, setWeekOffset] = useState(0);
  const [departmentFilter, setDepartmentFilter] = useState('All');
  const [facultyFilter, setFacultyFilter] = useState(getUserId(user));
  const [searchText, setSearchText] = useState('');

  const facultyUsers = useMemo(
    () => allUsers.filter(u => (u.role || '').toLowerCase() !== 'admin'),
    [allUsers]
  );

  const departments = useMemo(() => {
    const depts = new Set(facultyUsers.map(u => u.department).filter(Boolean));
    return ['All', ...Array.from(depts)];
  }, [facultyUsers]);

  const filteredFacultyUsers = useMemo(() => {
    const searchTerm = searchText.trim().toLowerCase();
    return facultyUsers.filter(f => {
      const deptMatch = departmentFilter === 'All' || f.department === departmentFilter;
      const searchMatch = !searchTerm || f.name.toLowerCase().includes(searchTerm) || f.department?.toLowerCase().includes(searchTerm);
      return deptMatch && searchMatch;
    });
  }, [facultyUsers, departmentFilter, searchText]);

  const selectedFacultyId = useMemo(() => {
    const hasSelected = filteredFacultyUsers.some(f => getUserId(f) === facultyFilter);
    if (hasSelected) return facultyFilter;
    if (filteredFacultyUsers.length > 0) return getUserId(filteredFacultyUsers[0]);
    return getUserId(user);
  }, [filteredFacultyUsers, facultyFilter, user]);

  const selectedFaculty = useMemo(() => {
    return facultyUsers.find(f => getUserId(f) === selectedFacultyId) || user;
  }, [facultyUsers, selectedFacultyId, user]);

  const getWeekStart = (date) => {
    const d = new Date(date);
    const day = d.getDay();
    const diff = (day === 0 ? -6 : 1) - day;
    d.setDate(d.getDate() + diff + (weekOffset * 7));
    d.setHours(0, 0, 0, 0);
    return d;
  };

  const weekStart = useMemo(() => getWeekStart(new Date()), [weekOffset]);

  const getDateForDay = (dayName) => {
    const dayIndex = days.indexOf(dayName);
    const date = new Date(weekStart);
    date.setDate(weekStart.getDate() + dayIndex);
    return date.toISOString().split('T')[0];
  };

  const normalize = (value) => (value || '').toString().toLowerCase();

  const getSchedule = (day, slotId) => {
    const entry = timetable.find(t => t.userId === selectedFacultyId && t.day === day && t.slot === slotId);
    if (!entry) return null;
    const haystack = `${entry.subject} ${entry.class} ${selectedFaculty?.name} ${selectedFaculty?.department}`.toLowerCase();
    const searchTerm = searchText.trim().toLowerCase();
    return !searchTerm || haystack.includes(searchTerm) ? entry : null;
  };

  const isDateWithinLeave = (leave, dateStr) => {
    if (!leave.date) return false;
    if (!leave.endDate) return leave.date === dateStr;
    return dateStr >= leave.date && dateStr <= leave.endDate;
  };

  const isLeaveAffectedClass = (day, slotId, schedule) => {
    if (!schedule) return false;
    const classDate = getDateForDay(day);
    return leaves.some(leave => {
      if (leave.userId !== selectedFacultyId) return false;
      if (!['Pending', 'Approved'].includes(leave.status)) return false;

      const substitutions = leave.substitutions || [];
      if (substitutions.length > 0) {
        return substitutions.some(s => s.date === classDate && s.slot === slotId);
      }
      return isDateWithinLeave(leave, classDate);
    });
  };

  const getDepartmentColor = (department, subject) => {
    const text = normalize(department || subject);
    if (text.includes('computer') || text.includes('cse')) return { bg: 'bg-blue-50', border: 'border-blue-200', accent: 'text-blue-700' };
    if (text.includes('electronics') || text.includes('ece')) return { bg: 'bg-purple-50', border: 'border-purple-200', accent: 'text-purple-700' };
    if (text.includes('mechanical')) return { bg: 'bg-orange-50', border: 'border-orange-200', accent: 'text-orange-700' };
    if (text.includes('civil')) return { bg: 'bg-green-50', border: 'border-green-200', accent: 'text-green-700' };
    if (text.includes('math')) return { bg: 'bg-indigo-50', border: 'border-indigo-200', accent: 'text-indigo-700' };
    return { bg: 'bg-slate-50', border: 'border-slate-200', accent: 'text-slate-700' };
  };

  const getAvailabilityStatus = (candidateId, day, slotId) => {
    const hasSameSlotClass = timetable.some(t => t.userId === candidateId && t.day === day && t.slot === slotId);
    if (hasSameSlotClass) return { label: 'Assigned', dot: 'bg-red-500', text: 'text-red-600' };

    const hasAdjacent = timetable.some(t => t.userId === candidateId && t.day === day && (t.slot === slotId - 1 || t.slot === slotId + 1));
    if (hasAdjacent) return { label: 'Busy Soon', dot: 'bg-yellow-500', text: 'text-yellow-600' };

    return { label: 'Available', dot: 'bg-green-500', text: 'text-green-600' };
  };

  const affectedClasses = useMemo(() => {
    const items = [];
    days.forEach(day => {
      slots.forEach(slot => {
        const schedule = getSchedule(day, slot.id);
        if (!isLeaveAffectedClass(day, slot.id, schedule)) return;

        const dateStr = getDateForDay(day);
        const suggested = findAvailableSubstitutes(dateStr, slot.id, selectedFacultyId, facultyUsers, timetable, leaves)
          .slice(0, 4)
          .map(candidate => {
            const status = getAvailabilityStatus(getUserId(candidate), day, slot.id);
            return {
              id: getUserId(candidate),
              name: candidate.name,
              department: candidate.department,
              status,
            };
          });

        items.push({
          key: `${day}-${slot.id}`,
          day,
          time: slot.time,
          subject: schedule.subject,
          className: schedule.class,
          suggestions: suggested,
        });
      });
    });
    return items;
  }, [days, slots, selectedFacultyId, facultyUsers, timetable, leaves, searchText, weekOffset]);

  const weekLabel = useMemo(() => {
    const end = new Date(weekStart);
    end.setDate(weekStart.getDate() + 5);
    return `${weekStart.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - ${end.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`;
  }, [weekStart]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="glass-card shadow-soft border border-[#E0E0E0] flex flex-col overflow-hidden rounded-2xl h-full bg-gradient-to-br from-white to-[#F8FAFC]"
    >
      <div className="p-5 md:p-6 border-b border-[#E0E0E0] bg-gradient-to-r from-white to-[#F8FAFC]">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold flex items-center gap-3 text-[#1A1A1A]">
              <div className="p-2 rounded-lg bg-[#0A4D9C]/10">
                <Calendar size={22} className="text-[#0A4D9C]" />
              </div>
              Timetable Dashboard
            </h2>
            <p className="text-xs mt-2 text-[#666666]">Modern weekly schedule view with substitute insights and availability tracking</p>
          </div>
          <div className="text-xs font-semibold px-3 py-1.5 rounded-full border border-[#D0E2F7] bg-[#F4F7FB] text-[#0A4D9C]">
            Week: {weekLabel}
          </div>
        </div>

        <div className="mt-5 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
          <select
            value={weekOffset}
            onChange={(e) => setWeekOffset(Number(e.target.value))}
            className="w-full border border-[#E0E0E0] rounded-xl px-3.5 py-2.5 text-sm bg-white text-[#1A1A1A]"
          >
            <option value={-1}>Previous Week</option>
            <option value={0}>Current Week</option>
            <option value={1}>Next Week</option>
          </select>

          <select
            value={departmentFilter}
            onChange={(e) => setDepartmentFilter(e.target.value)}
            className="w-full border border-[#E0E0E0] rounded-xl px-3.5 py-2.5 text-sm bg-white text-[#1A1A1A]"
          >
            {departments.map(d => <option key={d} value={d}>{d === 'All' ? 'All Departments' : d}</option>)}
          </select>

          <select
            value={selectedFacultyId}
            onChange={(e) => setFacultyFilter(e.target.value)}
            className="w-full border border-[#E0E0E0] rounded-xl px-3.5 py-2.5 text-sm bg-white text-[#1A1A1A]"
          >
            {filteredFacultyUsers.map(f => <option key={getUserId(f)} value={getUserId(f)}>{f.name}</option>)}
          </select>

          <div className="relative">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#666666]" />
            <input
              type="text"
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              placeholder="Search subject / class"
              className="w-full border border-[#E0E0E0] rounded-xl pl-9 pr-3.5 py-2.5 text-sm bg-white text-[#1A1A1A] placeholder-[#999999]"
            />
          </div>
        </div>
      </div>

      <div className="p-4 md:p-6 flex-1 overflow-y-auto">
        <div className="hidden md:block overflow-x-auto rounded-2xl border border-[#E0E0E0] bg-white">
          <table className="w-max min-w-full border-separate border-spacing-0">
            <thead>
              <tr className="bg-[#F4F7FB]">
                <th className="sticky left-0 z-30 w-36 min-w-[9rem] p-3 text-left text-xs font-bold uppercase tracking-wider text-[#0A4D9C] border-r border-[#E0E0E0]">Time</th>
                {days.map(day => (
                  <th key={day} className="w-48 min-w-[12rem] p-3 text-left text-xs font-bold uppercase tracking-wider text-[#1A1A1A] border-r border-[#E0E0E0] last:border-r-0">{day}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {slots.map(slot => (
                <tr key={slot.id} className="border-t border-[#E0E0E0]">
                  <td className="sticky left-0 z-20 p-3 align-top border-r border-[#E0E0E0] bg-white">
                    <div className="text-sm font-bold text-[#0A4D9C]">{slot.time}</div>
                  </td>
                  {days.map(day => {
                    const schedule = getSchedule(day, slot.id);
                    const isAffected = isLeaveAffectedClass(day, slot.id, schedule);
                    const deptColor = getDepartmentColor(selectedFaculty?.department, schedule?.subject);

                    return (
                      <td key={`${day}-${slot.id}`} className="p-2 border-r border-[#E0E0E0] last:border-r-0 align-top">
                        {schedule ? (
                          <motion.div
                            whileHover={{ scale: 1.02, y: -2 }}
                            transition={{ duration: 0.2 }}
                            className={`group relative rounded-xl p-2.5 shadow-[0_6px_16px_rgba(0,0,0,0.1)] border transition-all ${isAffected ? 'bg-[#FFF1F1] border-[#CD5C5C]/50 hover:shadow-[0_10px_24px_rgba(205,92,92,0.25)]' : `${deptColor.bg} ${deptColor.border} hover:shadow-[0_10px_24px_rgba(10,77,156,0.2)]`}`}
                          >
                            <div className={`text-sm font-bold leading-tight ${isAffected ? 'text-[#CD5C5C]' : deptColor.accent}`}>{schedule.subject.replace('Sub: ', '')}</div>
                            <div className="mt-1 text-xs font-semibold text-[#1A1A1A]">{selectedFaculty?.name || 'Faculty'}</div>
                            <div className="mt-1 flex items-center gap-1.5 text-[0.72rem] text-[#666666]"><MapPin size={12} /> {schedule.room || schedule.class || 'Room TBD'}</div>
                            <div className="mt-1 flex items-center gap-1.5 text-[0.72rem] text-[#666666]"><Building2 size={12} /> {selectedFaculty?.department || 'Department'}</div>

                            {isAffected && (
                              <div className="mt-2 text-[0.65rem] px-2 py-0.5 rounded-full bg-[#CD5C5C]/15 text-[#CD5C5C] font-bold inline-flex items-center gap-1">
                                <Sparkles size={11} /> Faculty on leave
                              </div>
                            )}

                            <div className="pointer-events-none absolute left-1/2 -translate-x-1/2 bottom-full mb-2 opacity-0 group-hover:opacity-100 transition-opacity z-30">
                              <div className="w-64 rounded-xl border border-[#E0E0E0] bg-white shadow-xl p-3 text-xs text-[#1A1A1A]">
                                <div className="font-bold text-[#0A4D9C] mb-1">{schedule.subject}</div>
                                <div>Faculty: {selectedFaculty?.name || 'N/A'}</div>
                                <div>Room: {schedule.room || schedule.class || 'Room TBD'}</div>
                                <div>Department: {selectedFaculty?.department || 'N/A'}</div>
                                <div>Duration: {slot.start} - {slot.end}</div>
                              </div>
                            </div>
                          </motion.div>
                        ) : (
                          <div className="group rounded-xl p-3 min-h-[122px] border border-dashed border-[#E0E0E0] bg-[#F4F7FB]/70 hover:bg-[#EDF2F8] transition-all flex flex-col items-center justify-center gap-2 text-[#999999]">
                            <Plus size={16} />
                            <div className="text-xs font-bold uppercase tracking-wider">Available Slot</div>
                          </div>
                        )}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="md:hidden space-y-3">
          {slots.map(slot => (
            <div key={slot.id} className="rounded-xl border border-[#E0E0E0] bg-white overflow-hidden">
              <div className="px-4 py-2.5 bg-[#F4F7FB] border-b border-[#E0E0E0]">
                <div className="text-sm font-bold text-[#0A4D9C]">{slot.time}</div>
              </div>
              <div className="p-3 grid grid-cols-1 gap-2">
                {days.map(day => {
                  const schedule = getSchedule(day, slot.id);
                  const isAffected = isLeaveAffectedClass(day, slot.id, schedule);
                  const deptColor = getDepartmentColor(selectedFaculty?.department, schedule?.subject);
                  return (
                    <div key={`${day}-${slot.id}`} className="rounded-lg border border-[#E0E0E0] p-2.5">
                      <div className="text-[0.7rem] font-bold uppercase tracking-wider text-[#666666] mb-1">{day}</div>
                      {schedule ? (
                        <div className={`rounded-lg p-2 border ${isAffected ? 'bg-[#FFF1F1] border-[#CD5C5C]/50' : `${deptColor.bg} ${deptColor.border}`}`}>
                          <div className={`text-sm font-bold ${isAffected ? 'text-[#CD5C5C]' : deptColor.accent}`}>{schedule.subject.replace('Sub: ', '')}</div>
                          <div className="text-xs text-[#666666] mt-1">{schedule.class || 'Room TBD'}</div>
                        </div>
                      ) : (
                        <div className="rounded-lg border border-dashed border-[#E0E0E0] bg-[#F4F7FB]/70 p-3 text-xs text-[#666666] flex items-center justify-center gap-1.5">
                          <Plus size={14} /> Available Slot
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        <div className="mt-6">
          <h3 className="text-sm font-bold uppercase tracking-widest mb-3 text-[#CD5C5C]">Suggested Substitutes</h3>
          {affectedClasses.length === 0 ? (
            <div className="rounded-xl border border-dashed border-[#E0E0E0] bg-[#F4F7FB]/70 p-4 text-sm text-[#666666]">
              No leave-affected classes found in this week for the selected faculty.
            </div>
          ) : (
            <div className="space-y-3">
              {affectedClasses.map(item => (
                <div key={item.key} className="rounded-xl border border-[#FDD7C8] bg-[#FFF4F0] p-4">
                  <div className="flex flex-wrap items-center gap-2 text-sm">
                    <span className="font-bold text-[#CD5C5C]">{item.day} • {item.time}</span>
                    <span className="text-[#1A1A1A]">{item.subject}</span>
                    <span className="text-[#666666]">({item.className})</span>
                  </div>

                  <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2">
                    {item.suggestions.length === 0 ? (
                      <div className="col-span-full text-xs font-semibold text-[#CD5C5C]">No substitute faculty available.</div>
                    ) : item.suggestions.map(s => (
                      <div key={s.id} className="bg-white border border-[#E0E0E0] rounded-lg p-3 flex items-center gap-2.5">
                        <div className="w-9 h-9 rounded-full bg-[#0A4D9C]/10 text-[#0A4D9C] font-bold text-sm flex items-center justify-center">
                          {s.name?.split(' ').map(part => part[0]).join('').slice(0, 2).toUpperCase()}
                        </div>
                        <div className="min-w-0">
                          <div className="text-xs font-bold text-[#1A1A1A] truncate">{s.name}</div>
                          <div className="text-[0.7rem] text-[#666666] truncate">{s.department || 'Department'}</div>
                          <div className={`mt-1 text-[0.68rem] font-bold flex items-center gap-1 ${s.status.text}`}>
                            <span className={`w-2 h-2 rounded-full ${s.status.dot}`}></span>{s.status.label}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
};

const AdminPortal = ({ isDark, addToast, allUsers, timetable, refreshData }) => {
  const [activeTab, setActiveTab] = useState('create');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState('');

  const [userDetails, setUserDetails] = useState({
    name: '', email: '', password: '', role: 'Faculty', department: 'Computer Science'
  });
  const [timetableEntries, setTimetableEntries] = useState([
    { day: 'Monday', slot: 1, subject: '', class: '' }
  ]);
  const [newSlot, setNewSlot] = useState({ day: 'Monday', slot: 1, subject: '', class: '' });

  const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
  const slots = [1, 2, 3, 4, 5, 6, 7, 8];

  const handleUserChange = (e) => setUserDetails({ ...userDetails, [e.target.name]: e.target.value });
  const handleTimetableChange = (index, field, value) => {
    const newEntries = [...timetableEntries];
    newEntries[index][field] = value;
    setTimetableEntries(newEntries);
  };
  const addTimetableEntry = () => setTimetableEntries([...timetableEntries, { day: 'Monday', slot: 1, subject: '', class: '' }]);
  const removeTimetableEntry = (index) => setTimetableEntries(timetableEntries.filter((_, i) => i !== index));

  const handleCreateSubmit = async (e) => {
    e.preventDefault();
    if (!userDetails.name || !userDetails.email || !userDetails.password) {
      addToast('Please fill all required user details.', 'error');
      return;
    }
    const invalidEntries = timetableEntries.some(t => !t.subject || !t.class);
    if (invalidEntries) {
      addToast('Please complete all timetable entries or remove empty ones.', 'error');
      return;
    }

    setIsSubmitting(true);
    try {
      const token = localStorage.getItem('token');
      const config = { headers: { 'x-auth-token': token } };

      const userRes = await axios.post(`${API_URL}/data/admin/users`, userDetails, config);
      const newUserId = userRes.data._id || userRes.data.id;

      if (timetableEntries.length > 0) {
        const payload = timetableEntries.map(entry => ({ ...entry, userId: newUserId }));
        await axios.post(`${API_URL}/data/admin/timetable/bulk`, { entries: payload }, config);
      }

      addToast(`Account for ${userDetails.name} created successfully!`, 'success');
      setUserDetails({ name: '', email: '', password: '', role: 'Faculty', department: 'Computer Science' });
      setTimetableEntries([{ day: 'Monday', slot: 1, subject: '', class: '' }]);
      refreshData();
    } catch (err) {
      addToast(err.response?.data?.msg || 'Failed to create account.', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteUser = async () => {
    if (!window.confirm("Are you sure you want to permanently delete this faculty member and all their timetables?")) return;
    try {
      const token = localStorage.getItem('token');
      await axios.delete(`${API_URL}/data/admin/users/${selectedUserId}`, { headers: { 'x-auth-token': token } });
      addToast('Faculty member deleted successfully.', 'success');
      setSelectedUserId('');
      refreshData();
    } catch (err) {
      addToast('Failed to delete faculty.', 'error');
    }
  };

  const handleDeleteSlot = async (slotId) => {
    try {
      const token = localStorage.getItem('token');
      await axios.delete(`${API_URL}/data/admin/timetable/${slotId}`, { headers: { 'x-auth-token': token } });
      addToast('Timetable slot deleted.', 'success');
      refreshData();
    } catch (err) {
      addToast('Failed to delete slot.', 'error');
    }
  };

  const handleAddSingleSlot = async (e) => {
    e.preventDefault();
    if (!newSlot.subject || !newSlot.class) return addToast('Fill all slot details', 'error');

    setIsSubmitting(true);
    try {
      const token = localStorage.getItem('token');
      await axios.post(`${API_URL}/data/admin/timetable`, { ...newSlot, userId: selectedUserId }, { headers: { 'x-auth-token': token } });
      addToast('Slot added successfully.', 'success');
      setNewSlot({ day: 'Monday', slot: 1, subject: '', class: '' });
      refreshData();
    } catch (err) {
      addToast('Failed to add slot.', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const safeId = (u) => u._id || u.id;
  const facultyList = allUsers.filter(u => u.role?.toUpperCase() !== 'ADMIN');
  const selectedUserTimetable = timetable.filter(t => t.userId === selectedUserId);

  return (
    <div className="glass-card shadow-soft border border-[#E0E0E0] flex flex-col overflow-hidden rounded-2xl h-full transition-colors bg-gradient-to-br from-white to-[#F8FAFC]">
      <div className="p-6 border-b border-[#E0E0E0] sticky top-0 z-20 transition-colors bg-gradient-to-r from-white to-[#F8FAFC]">
        <h2 className="text-xl font-bold flex items-center gap-3 mb-2 text-[#1A1A1A]">
          <div className="p-2 rounded-lg bg-[#228B22]/10">
            <Shield size={24} className="text-[#228B22]" />
          </div>
          System Administration
        </h2>
        <p className="text-xs text-[#666666]">Manage accounts, faculty profiles, and platform configurations</p>
      </div>

      <div className="flex border-b border-[#E0E0E0] px-2 bg-[#F4F7FB]/40">
        <button
          onClick={() => setActiveTab('create')}
          className={`py-3 px-4 font-bold text-sm border-b-2 transition-colors ${activeTab === 'create' ? 'border-[#228B22] text-[#228B22]' : isDark ? 'border-transparent text-[#666666] hover:text-slate-200' : 'border-transparent text-[#666666] hover:text-[#1A1A1A]'}`}
        >
          <div className="flex items-center gap-2"><UserPlus size={16} /> Create Faculty</div>
        </button>
        <button
          onClick={() => setActiveTab('manage')}
          className={`py-3 px-4 font-bold text-sm border-b-2 transition-colors ${activeTab === 'manage' ? 'border-[#228B22] text-[#228B22]' : isDark ? 'border-transparent text-[#666666] hover:text-slate-200' : 'border-transparent text-[#666666] hover:text-[#1A1A1A]'}`}
        >
          <div className="flex items-center gap-2"><Edit size={16} /> Manage Faculty</div>
        </button>
      </div>

      <div className="flex-1 overflow-y-auto">
        <div className="p-6 md:p-8">
          {activeTab === 'create' ? (
            <form onSubmit={handleCreateSubmit} className="flex flex-col gap-8 animate-[slideIn_0.2s_ease-out]">
              <div>
                <h3 className={`text-sm font-bold uppercase tracking-widest mb-4 flex items-center gap-2 border-b pb-2 ${isDark ? 'text-[#0A4D9C] border-slate-700/50' : 'text-[#0A4D9C] border-[#E0E0E0]/50'}`}>
                  <UserPlus size={16} /> 1. Account Details
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div className="flex flex-col gap-1.5">
                    <label className={`text-sm font-semibold pl-1 ${isDark ? 'text-[#1A1A1A]' : 'text-[#666666]'}`}>Full Name</label>
                    <input type="text" name="name" value={userDetails.name} onChange={handleUserChange} placeholder="e.g., Dr. Alan Turing" className={`border rounded-xl px-4 py-2.5 text-sm outline-none transition-colors focus:ring-2 focus:ring-[#0A4D9C]/30 ${isDark ? 'border-slate-600/50 bg-slate-900/50 text-slate-100 placeholder-slate-500' : 'border-[#E0E0E0] bg-white text-[#1A1A1A] placeholder-[#666666]'}`} required />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className={`text-sm font-semibold pl-1 ${isDark ? 'text-[#1A1A1A]' : 'text-[#666666]'}`}>Email Address</label>
                    <input type="email" name="email" value={userDetails.email} onChange={handleUserChange} placeholder="faculty@vvit.edu" className={`border rounded-xl px-4 py-2.5 text-sm outline-none transition-colors focus:ring-2 focus:ring-[#0A4D9C]/30 ${isDark ? 'border-slate-600/50 bg-slate-900/50 text-slate-100 placeholder-slate-500' : 'border-[#E0E0E0] bg-white text-[#1A1A1A] placeholder-[#666666]'}`} required />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className={`text-sm font-semibold pl-1 ${isDark ? 'text-[#1A1A1A]' : 'text-[#666666]'}`}>Temporary Password</label>
                    <input type="text" name="password" value={userDetails.password} onChange={handleUserChange} placeholder="Initial password" className={`border rounded-xl px-4 py-2.5 text-sm outline-none transition-colors focus:ring-2 focus:ring-[#0A4D9C]/30 ${isDark ? 'border-slate-600/50 bg-slate-900/50 text-slate-100 placeholder-slate-500' : 'border-[#E0E0E0] bg-white text-[#1A1A1A] placeholder-[#666666]'}`} required />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className={`text-sm font-semibold pl-1 ${isDark ? 'text-[#1A1A1A]' : 'text-[#666666]'}`}>Department</label>
                    <input type="text" name="department" value={userDetails.department} onChange={handleUserChange} placeholder="e.g., Computer Science" className={`border rounded-xl px-4 py-2.5 text-sm outline-none transition-colors focus:ring-2 focus:ring-[#0A4D9C]/30 ${isDark ? 'border-slate-600/50 bg-slate-900/50 text-slate-100 placeholder-slate-500' : 'border-[#E0E0E0] bg-white text-[#1A1A1A] placeholder-[#666666]'}`} required />
                  </div>
                  <div className="flex flex-col gap-1.5 md:col-span-2">
                    <label className={`text-sm font-semibold pl-1 ${isDark ? 'text-[#1A1A1A]' : 'text-[#666666]'}`}>Role</label>
                    <select name="role" value={userDetails.role} onChange={handleUserChange} className={`border rounded-xl px-4 py-2.5 text-sm outline-none transition-colors focus:ring-2 focus:ring-[#0A4D9C]/30 ${isDark ? 'border-slate-600/50 bg-slate-900/50 text-slate-100' : 'border-[#E0E0E0] bg-white text-[#1A1A1A]'}`}>
                      <option value="Faculty" className={isDark ? 'bg-slate-900 text-slate-100' : 'bg-[#F4F7FB] text-[#1A1A1A]'}>Faculty</option>
                      <option value="HOD" className={isDark ? 'bg-slate-900 text-slate-100' : 'bg-[#F4F7FB] text-[#1A1A1A]'}>Head of Department (HOD)</option>
                      <option value="DEO" className={isDark ? 'bg-slate-900 text-slate-100' : 'bg-[#F4F7FB] text-[#1A1A1A]'}>Department Executive Officer (DEO)</option>
                    </select>
                  </div>
                </div>
              </div>

              <div>
                <div className={`flex items-center justify-between mb-4 border-b pb-2 ${isDark ? 'border-slate-700/50' : 'border-[#E0E0E0]/50'}`}>
                  <h3 className={`text-sm font-bold uppercase tracking-widest flex items-center gap-2 ${isDark ? 'text-[#0A4D9C]' : 'text-[#0A4D9C]'}`}>
                    <Calendar size={16} /> 2. Timetable Setup
                  </h3>
                  <button type="button" onClick={addTimetableEntry} className="text-[#228B22] text-sm font-bold flex items-center gap-1 hover:text-[#228B22] transition-colors">
                    <Plus size={16} /> Add Slot
                  </button>
                </div>

                <div className="flex flex-col gap-3">
                  {timetableEntries.map((entry, index) => (
                    <div key={index} className={`grid grid-cols-1 md:grid-cols-[1fr_1fr_2fr_1fr_auto] gap-3 items-center p-3 rounded-xl border transition-all ${isDark ? 'bg-slate-900/40 border-slate-700/50 hover:border-slate-600 hover:bg-slate-900/60' : 'bg-white border-[#E0E0E0] hover:border-[#0A4D9C] hover:bg-[#F4F7FB]'}`}>
                      <div className="flex flex-col gap-1">
                        <label className={`text-[0.65rem] font-bold uppercase ml-1 ${isDark ? 'text-[#666666]' : 'text-[#666666]'}`}>Day</label>
                        <select value={entry.day} onChange={(e) => handleTimetableChange(index, 'day', e.target.value)} className={`border rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[#0A4D9C]/30 transition-colors ${isDark ? 'border-slate-600/50 bg-slate-900/50 text-slate-100' : 'border-[#E0E0E0] bg-white text-[#1A1A1A]'}`}>
                          {days.map(d => <option key={d} value={d} className={isDark ? 'bg-slate-900 text-slate-100' : 'bg-[#F4F7FB] text-[#1A1A1A]'}>{d}</option>)}
                        </select>
                      </div>
                      <div className="flex flex-col gap-1">
                        <label className={`text-[0.65rem] font-bold uppercase ml-1 ${isDark ? 'text-[#666666]' : 'text-[#666666]'}`}>Slot</label>
                        <select value={entry.slot} onChange={(e) => handleTimetableChange(index, 'slot', Number(e.target.value))} className={`border rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[#0A4D9C]/30 transition-colors ${isDark ? 'border-slate-600/50 bg-slate-900/50 text-slate-100' : 'border-[#E0E0E0] bg-white text-[#1A1A1A]'}`}>
                          {slots.map(s => <option key={s} value={s} className={isDark ? 'bg-slate-900 text-slate-100' : 'bg-[#F4F7FB] text-[#1A1A1A]'}>Slot {s}</option>)}
                        </select>
                      </div>
                      <div className="flex flex-col gap-1">
                        <label className={`text-[0.65rem] font-bold uppercase ml-1 ${isDark ? 'text-[#666666]' : 'text-[#666666]'}`}>Subject</label>
                        <input type="text" value={entry.subject} onChange={(e) => handleTimetableChange(index, 'subject', e.target.value)} placeholder="e.g., Data Structures" className={`border rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[#0A4D9C]/30 transition-colors ${isDark ? 'border-slate-600/50 bg-slate-900/50 text-slate-100 placeholder-slate-500' : 'border-[#E0E0E0] bg-white text-[#1A1A1A] placeholder-[#666666]'}`} required />
                      </div>
                      <div className="flex flex-col gap-1">
                        <label className={`text-[0.65rem] font-bold uppercase ml-1 ${isDark ? 'text-[#666666]' : 'text-[#666666]'}`}>Class Code</label>
                        <input type="text" value={entry.class} onChange={(e) => handleTimetableChange(index, 'class', e.target.value)} placeholder="e.g., CS-A" className={`border rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[#0A4D9C]/30 transition-colors ${isDark ? 'border-slate-600/50 bg-slate-900/50 text-slate-100 placeholder-slate-500' : 'border-[#E0E0E0] bg-white text-[#1A1A1A] placeholder-[#666666]'}`} required />
                      </div>
                      <div className="flex flex-col gap-1 md:mt-4">
                        <button type="button" onClick={() => removeTimetableEntry(index)} className="p-2 text-[#CD5C5C] hover:text-[#CD5C5C] hover:bg-[#FFF4F0] rounded-lg transition-colors" title="Remove slot">
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </div>
                  ))}

                  {timetableEntries.length === 0 && (
                    <div className={`text-center py-8 rounded-xl border border-dashed text-sm ${isDark ? 'bg-slate-800/40 border-slate-700/50 text-[#666666]' : 'bg-[#F4F7FB]/40 border-[#E0E0E0]/50 text-[#666666]'}`}>
                      No classes added. Faculty will have a completely free timetable.
                    </div>
                  )}
                </div>
              </div>

              <div className={`pt-4 border-t flex justify-end ${isDark ? 'border-slate-700/50' : 'border-[#E0E0E0]/50'}`}>
                <button type="submit" disabled={isSubmitting} className="bg-[#228B22] hover:bg-[#1a6b1a] text-white font-bold py-3 px-8 rounded-xl shadow-lg shadow-[#228B22]/30 transition-all flex items-center gap-2 active:scale-95 disabled:opacity-70">
                  {isSubmitting ? <Loader className="animate-spin" size={18} /> : <Save size={18} />}
                  {isSubmitting ? 'Creating...' : 'Save Faculty & Timetable'}
                </button>
              </div>
            </form>
          ) : (
            <div className="flex flex-col gap-6 animate-[slideIn_0.2s_ease-out]">
              <div className={`glass-card shadow-soft p-5 rounded-2xl border flex flex-col sm:flex-row items-center justify-between gap-4 ${isDark ? 'bg-slate-900/40 border-slate-700/50' : 'bg-[#F4F7FB]/40 border-[#E0E0E0]'}`}>
                <div className="w-full sm:w-1/2">
                  <label className={`text-xs font-bold uppercase tracking-widest mb-1.5 block ml-1 ${isDark ? 'text-[#666666]' : 'text-[#666666]'}`}>Select Faculty Member</label>
                  <select
                    className={`w-full border rounded-xl px-4 py-3 text-sm outline-none shadow-sm font-semibold transition-colors focus:ring-2 focus:ring-[#0A4D9C]/30 ${isDark ? 'border-slate-600/50 bg-slate-900/50 text-slate-100' : 'border-[#E0E0E0] bg-white text-[#1A1A1A]'}`}
                    value={selectedUserId}
                    onChange={(e) => setSelectedUserId(e.target.value)}
                  >
                    <option value="" className={isDark ? 'bg-slate-900 text-[#666666]' : 'bg-[#F4F7FB] text-[#666666]'}>-- Choose Faculty Member --</option>
                    {facultyList.map(u => (
                      <option key={safeId(u)} value={safeId(u)} className={isDark ? 'bg-slate-900 text-slate-100' : 'bg-[#F4F7FB] text-[#1A1A1A]'}>{u.name} ({u.department})</option>
                    ))}
                  </select>
                </div>

                {selectedUserId && (
                  <button
                    onClick={handleDeleteUser}
                    className="w-full sm:w-auto mt-auto bg-white border-2 border-[#CD5C5C] text-[#CD5C5C] hover:bg-[#FFF4F0] hover:border-[#A65318] font-bold py-2.5 px-5 rounded-xl transition-all flex items-center justify-center gap-2"
                  >
                    <AlertOctagon size={18} /> Delete Permanently
                  </button>
                )}
              </div>

              {selectedUserId && (
                <div className="flex flex-col gap-6 mt-4">
                  <div>
                    <h3 className={`text-sm font-bold uppercase tracking-widest mb-4 pb-2 border-b ${isDark ? 'text-[#0A4D9C] border-slate-700/50' : 'text-[#0A4D9C] border-[#E0E0E0]/50'}`}>
                      Current Timetable ({selectedUserTimetable.length} Slots)
                    </h3>
                    <div className={`grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 max-h-[300px] overflow-y-auto pr-2`}>
                      {selectedUserTimetable.map(slot => (
                        <div key={slot._id} className={`glass-card border p-4 rounded-xl shadow-sm flex flex-col justify-between transition-all ${isDark ? 'bg-slate-900/40 border-slate-700/50 hover:border-slate-600/80' : 'bg-[#F4F7FB]/40 border-[#E0E0E0] hover:border-[#0A4D9C]'}`}>
                          <div className="flex justify-between items-start mb-2">
                            <span className={`text-[0.65rem] font-bold px-2 py-0.5 rounded uppercase tracking-wider ${isDark ? 'bg-[#E0E0E0]/50 text-[#1A1A1A]' : 'bg-[#E0E0E0]/50 text-[#1A1A1A]'}`}>{slot.day} • S{slot.slot}</span>
                            <button onClick={() => handleDeleteSlot(slot._id)} className="text-[#666666] hover:text-red-400 transition-colors"><Trash2 size={16} /></button>
                          </div>
                          <div>
                            <div className={`font-bold text-sm leading-tight ${isDark ? 'text-slate-100' : 'text-[#1A1A1A]'}`}>{slot.subject}</div>
                            <div className={`text-xs font-semibold mt-1 ${isDark ? 'text-[#228B22]' : 'text-[#228B22]'}`}>{slot.class}</div>
                          </div>
                        </div>
                      ))}
                      {selectedUserTimetable.length === 0 && (
                        <p className={`text-sm italic col-span-full ${isDark ? 'text-[#666666]' : 'text-[#666666]'}`}>No active timetable slots for this faculty.</p>
                      )}
                    </div>
                  </div>

                  <div className={`glass-card border p-5 rounded-2xl ${isDark ? 'bg-slate-900/40 border-emerald-600/30' : 'bg-[#F4F7FB]/40 border-[#228B22]/40'}`}>
                    <h3 className={`text-sm font-bold mb-3 flex items-center gap-2 ${isDark ? 'text-[#228B22]' : 'text-emerald-700'}`}>
                      <Plus size={16} /> Add New Class Slot
                    </h3>
                    <form onSubmit={handleAddSingleSlot} className="flex flex-wrap items-end gap-3">
                      <div className="flex flex-col gap-1 flex-1 min-w-[100px]">
                        <label className={`text-[0.65rem] font-bold uppercase ${isDark ? 'text-[#666666]' : 'text-[#666666]'}`}>Day</label>
                        <select value={newSlot.day} onChange={(e) => setNewSlot({ ...newSlot, day: e.target.value })} className={`border rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[#0A4D9C]/30 transition-colors ${isDark ? 'border-slate-600/50 bg-slate-900/50 text-slate-100' : 'border-[#E0E0E0] bg-white text-[#1A1A1A]'}`}>
                          {days.map(d => <option key={d} value={d} className={isDark ? 'bg-slate-900 text-slate-100' : 'bg-[#F4F7FB] text-[#1A1A1A]'}>{d}</option>)}
                        </select>
                      </div>
                      <div className="flex flex-col gap-1 flex-1 min-w-[90px]">
                        <label className={`text-[0.65rem] font-bold uppercase ${isDark ? 'text-[#666666]' : 'text-[#666666]'}`}>Slot</label>
                        <select value={newSlot.slot} onChange={(e) => setNewSlot({ ...newSlot, slot: Number(e.target.value) })} className={`border rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[#0A4D9C]/30 transition-colors ${isDark ? 'border-slate-600/50 bg-slate-900/50 text-slate-100' : 'border-[#E0E0E0] bg-white text-[#1A1A1A]'}`}>
                          {slots.map(s => <option key={s} value={s} className={isDark ? 'bg-slate-900 text-slate-100' : 'bg-[#F4F7FB] text-[#1A1A1A]'}>Slot {s}</option>)}
                        </select>
                      </div>
                      <div className="flex flex-col gap-1 flex-[2] min-w-[150px]">
                        <label className={`text-[0.65rem] font-bold uppercase ${isDark ? 'text-[#666666]' : 'text-[#666666]'}`}>Subject</label>
                        <input type="text" value={newSlot.subject} onChange={(e) => setNewSlot({ ...newSlot, subject: e.target.value })} placeholder="Subject" className={`border rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[#0A4D9C]/30 transition-colors ${isDark ? 'border-slate-600/50 bg-slate-900/50 text-slate-100 placeholder-slate-500' : 'border-[#E0E0E0] bg-white text-[#1A1A1A] placeholder-[#666666]'}`} required />
                      </div>
                      <div className="flex flex-col gap-1 flex-[1.5] min-w-[100px]">
                        <label className={`text-[0.65rem] font-bold uppercase ${isDark ? 'text-[#666666]' : 'text-[#666666]'}`}>Class</label>
                        <input type="text" value={newSlot.class} onChange={(e) => setNewSlot({ ...newSlot, class: e.target.value })} placeholder="Class" className={`border rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[#0A4D9C]/30 transition-colors ${isDark ? 'border-slate-600/50 bg-slate-900/50 text-slate-100 placeholder-slate-500' : 'border-[#E0E0E0] bg-white text-[#1A1A1A] placeholder-[#666666]'}`} required />
                      </div>
                      <button type="submit" disabled={isSubmitting} className="bg-[#228B22] hover:bg-[#1a6b1a] text-white font-bold py-2 px-5 rounded-lg shadow-md transition-all h-[38px] disabled:opacity-50">
                        Add
                      </button>
                    </form>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const LeaveApplicationForm = ({ user, allUsers, onClose, onSubmit, addToast, timetable, leaves }) => {
  const [step, setStep] = useState(1);
  const isDeoUser = user.role?.toLowerCase() === 'deo';
  const [formData, setFormData] = useState({
    type: 'Casual', date: '', endDate: '', reason: '', substitutions: [],
    startTime: '08:00', startTimePeriod: 'AM', endTime: '10:00', endTimePeriod: 'AM'
  });

  const classesReqSubstitution = useMemo(() => {
    if (!formData.date) return [];
    let dates = [formData.date];
    if (formData.type === 'Medical' && formData.endDate) {
      dates = getDatesInRange(formData.date, formData.endDate);
    }
    const classes = [];
    dates.forEach(dateStr => {
      const dayName = getDayName(dateStr);
      const dailyClasses = timetable.filter(t => t.userId === getUserId(user) && t.day === dayName);
      dailyClasses.forEach(cls => {
        let includeClass = true;
        if (formData.type === 'Partial' && formData.startTime && formData.endTime) {
          const leaveStartMins = timeStrToMinutes(formData.startTime, formData.startTimePeriod);
          const leaveEndMins = timeStrToMinutes(formData.endTime, formData.endTimePeriod);
          const slotInfo = SLOT_TIMES[cls.slot];
          if (slotInfo) {
            const isOverlapping = (leaveStartMins < slotInfo.end) && (leaveEndMins > slotInfo.start);
            if (!isOverlapping) includeClass = false;
          }
        }
        if (includeClass) classes.push({ ...cls, date: dateStr, displayDate: dateStr });
      });
    });
    return classes;
  }, [formData.date, formData.endDate, formData.type, formData.startTime, formData.startTimePeriod, formData.endTime, formData.endTimePeriod, user, timetable]);

  const shouldSkipSubstitutionStep = isDeoUser || ((formData.type === 'Partial' || formData.type === 'Casual') && classesReqSubstitution.length === 0);

  const handleNext = () => {
    if (step === 1) {
      if (!formData.date || !formData.reason) return addToast("Please fill all fields to proceed", "error");
      if (formData.type === 'Medical') {
        if (!formData.endDate) return addToast("End Date is required for Medical Leave", "error");
        const start = new Date(formData.date);
        const end = new Date(formData.endDate);
        const diffDays = Math.ceil(Math.abs(end - start) / (1000 * 60 * 60 * 24)) + 1;
        if (diffDays < 10) return addToast("Medical leave must be at least 10 days.", "error");
      }
      if (formData.type === 'Partial' && (!formData.startTime || !formData.endTime)) return addToast("Start and End time required for Partial Leave", "error");

      if (shouldSkipSubstitutionStep) {
        onSubmit({
          ...formData,
          startTime: formData.type === 'Partial' ? `${formData.startTime} ${formData.startTimePeriod}` : undefined,
          endTime: formData.type === 'Partial' ? `${formData.endTime} ${formData.endTimePeriod}` : undefined,
          substitutions: []
        });
        return;
      }

      const generatedSubs = [];
      classesReqSubstitution.forEach(cls => {
        const available = findAvailableSubstitutes(cls.date, cls.slot, getUserId(user), allUsers, timetable, leaves);
        if (available.length > 0) {
          available.forEach(u => generatedSubs.push({ date: cls.date, slot: cls.slot, subject: cls.subject, class: cls.class, subId: getUserId(u), subName: u.name }));
        } else {
          generatedSubs.push({ date: cls.date, slot: cls.slot, subject: cls.subject, class: cls.class, subId: null, subName: 'No Faculty Available' });
        }
      });
      setFormData(prev => ({ ...prev, substitutions: generatedSubs }));
      setStep(2);
    } else {
      const hasMissingSubs = formData.substitutions.some(s => !s.subId);
      const isExempt = formData.type === 'Medical' || (formData.type === 'Partial' && classesReqSubstitution.length === 0);
      if (!isExempt && hasMissingSubs) return addToast("Cannot submit: No substitutes available for some classes.", "error");

      onSubmit({
        ...formData,
        startTime: formData.type === 'Partial' ? `${formData.startTime} ${formData.startTimePeriod}` : undefined,
        endTime: formData.type === 'Partial' ? `${formData.endTime} ${formData.endTimePeriod}` : undefined,
        substitutions: formData.substitutions.map(s => ({ ...s, subId: s.subId || null, subName: s.subName || 'Unassigned' }))
      });
    }
  };

  const groupedSubs = useMemo(() => {
    const groups = {};
    formData.substitutions.forEach(sub => {
      const key = `${sub.date}-${sub.slot}`;
      if (!groups[key]) groups[key] = { date: sub.date, slot: sub.slot, subject: sub.subject, class: sub.class, candidates: [] };
      groups[key].candidates.push(sub);
    });
    return Object.values(groups).sort((a, b) => a.date.localeCompare(b.date) || a.slot - b.slot);
  }, [formData.substitutions]);

  const handleTimeChange = (field, key, value) => {
    setFormData(prev => ({ ...prev, [key === 'time' ? field : field + 'Period']: value }));
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm font-sans">
      <div className="bg-white rounded-[2rem] shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden animate-[slideIn_0.2s_ease-out]">
        <div className="bg-gradient-to-r from-[#0A4D9C] to-[#1E73BE] px-6 py-5 flex justify-between items-center text-white shrink-0">
          <div>
            <h3 className="text-xl font-bold">Apply for Leave</h3>
            <p className="text-[#D0E2F7] text-xs font-medium mt-1">Step {step} of {shouldSkipSubstitutionStep ? '1' : '2'}</p>
          </div>
          <button onClick={onClose} className="p-2 bg-white/10 hover:bg-white/20 rounded-full transition-colors"><X size={20} /></button>
        </div>
        <div className="p-6 overflow-y-auto flex-1 bg-[#F4F7FB]/50">
          {step === 1 ? (
            <div className="flex flex-col gap-5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div className="flex flex-col gap-1.5">
                  <label className="text-sm font-semibold text-[#0A4D9C] pl-1">Leave Type</label>
                  <select className="border border-[#E0E0E0] rounded-xl px-4 py-2.5 text-sm text-[#1A1A1A] focus:outline-none focus:ring-2 focus:ring-[#0A4D9C]/30 focus:border-[#0A4D9C] bg-white shadow-soft" value={formData.type} onChange={e => setFormData({ ...formData, type: e.target.value })}>
                    <option>Casual</option><option>Medical</option><option>Partial</option>
                  </select>
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-sm font-semibold text-[#0A4D9C] pl-1">Start Date</label>
                  <input type="date" className="border border-[#E0E0E0] rounded-xl px-4 py-2.5 text-sm text-[#1A1A1A] focus:outline-none focus:ring-2 focus:ring-[#0A4D9C]/30 focus:border-[#0A4D9C] bg-white shadow-soft" value={formData.date} onChange={e => setFormData({ ...formData, date: e.target.value })} />
                </div>
              </div>
              {formData.type === 'Medical' && (
                <div className="flex flex-col gap-1.5">
                  <label className="text-sm font-semibold text-[#0A4D9C] pl-1">End Date</label>
                  <input type="date" className="border border-[#E0E0E0] rounded-xl px-4 py-2.5 text-sm text-[#1A1A1A] focus:outline-none focus:ring-2 focus:ring-[#0A4D9C]/30 focus:border-[#0A4D9C] bg-white shadow-soft" value={formData.endDate} onChange={e => setFormData({ ...formData, endDate: e.target.value })} />
                </div>
              )}
              {formData.type === 'Partial' && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <TimePicker label="Start Time" value={formData.startTime} period={formData.startTimePeriod} onChange={(key, val) => handleTimeChange('startTime', key, val)} />
                  <TimePicker label="End Time" value={formData.endTime} period={formData.endTimePeriod} onChange={(key, val) => handleTimeChange('endTime', key, val)} />
                </div>
              )}
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-semibold text-[#0A4D9C] pl-1">Reason</label>
                <textarea className="border border-[#E0E0E0] rounded-xl px-4 py-3 text-sm text-[#1A1A1A] placeholder:text-[#999999] focus:outline-none focus:ring-2 focus:ring-[#0A4D9C]/30 focus:border-[#0A4D9C] bg-white shadow-soft min-h-[100px]" value={formData.reason} onChange={e => setFormData({ ...formData, reason: e.target.value })} />
              </div>
            </div>
          ) : (
            <div className="flex flex-col gap-5">
              <div className="bg-[#F4F7FB] border border-[#D0E2F7] p-5 rounded-xl flex flex-col gap-2">
                <h4 className="font-bold text-[#0A4D9C] flex items-center gap-2"><Shield size={18} /> Substitution Engine</h4>
              </div>
              {classesReqSubstitution.length > 0 && (
                <div className="flex flex-col gap-3">
                  {groupedSubs.map((group, idx) => (
                    <div key={idx} className="border border-[#E0E0E0] rounded-xl bg-white shadow-soft overflow-hidden">
                      <div className="flex justify-between items-center p-4 bg-[#F4F7FB] border-b border-[#E0E0E0]">
                        <div>
                          <div className="font-bold text-sm text-[#0A4D9C]">{group.date} • Slot {group.slot}</div>
                          <div className="text-xs text-[#666666] font-medium mt-0.5">{group.subject} ({group.class})</div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
        <div className="bg-[#F4F7FB] p-5 border-t border-[#E0E0E0] flex justify-between shrink-0">
          {step === 2 && <button onClick={() => setStep(1)} className="px-5 py-2.5 bg-white border border-[#E0E0E0] rounded-xl font-semibold text-[#1A1A1A] hover:bg-[#F4F7FB]">Back</button>}
          <button onClick={handleNext} className="ml-auto px-6 py-2.5 bg-gradient-to-r from-[#0A4D9C] to-[#1E73BE] text-white rounded-xl font-bold flex items-center gap-2 hover:from-[#0A3A7A] hover:to-[#1A5FA0]">
            {step === 1 && !shouldSkipSubstitutionStep ? <>Next Step <ChevronRight size={18} /></> : <>Submit Application <Check size={18} /></>}
          </button>
        </div>
      </div>
    </div>
  );
};

const FacultyAccountManager = ({ isDark, allUsers, addToast, refreshData }) => {
  const facultyUsers = useMemo(
    () => allUsers.filter(u => (u.role || '').toUpperCase() === 'FACULTY'),
    [allUsers]
  );

  const [selectedFacultyId, setSelectedFacultyId] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleFacultySelect = (facultyId) => {
    setSelectedFacultyId(facultyId);
    const selected = facultyUsers.find(u => getUserId(u) === facultyId);
    setEmail(selected?.email || '');
    setPassword('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedFacultyId) {
      addToast('Please select a faculty member.', 'error');
      return;
    }

    const normalizedEmail = email.trim();
    const normalizedPassword = password.trim();

    if (!normalizedEmail && !normalizedPassword) {
      addToast('Please update email or password.', 'error');
      return;
    }

    setIsSubmitting(true);
    try {
      const token = localStorage.getItem('token');
      const payload = {};
      if (normalizedEmail) payload.email = normalizedEmail;
      if (normalizedPassword) payload.password = normalizedPassword;

      await axios.patch(
        `${API_URL}/data/admin/users/${selectedFacultyId}/credentials`,
        payload,
        { headers: { 'x-auth-token': token } }
      );

      addToast('Faculty credentials updated successfully.', 'success');
      setPassword('');
      refreshData(false);
    } catch (err) {
      addToast(err.response?.data?.msg || 'Failed to update faculty details.', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="glass-card shadow-soft border border-[#E0E0E0] rounded-2xl overflow-hidden bg-gradient-to-br from-white to-[#F8FAFC]">
      <div className="p-6 border-b border-[#E0E0E0] bg-gradient-to-r from-white to-[#F8FAFC]">
        <h3 className="m-0 font-bold text-[#1A1A1A] text-xl flex items-center gap-3">
          <div className="bg-[#0A4D9C]/10 p-2 rounded-lg"><Edit size={22} className="text-[#0A4D9C]" /></div>
          Update Faculty Details
        </h3>
        <p className="text-sm text-[#666666] mt-2">Select a faculty member and update email or password.</p>
      </div>

      <form onSubmit={handleSubmit} className="p-6 grid grid-cols-1 md:grid-cols-2 gap-5">
        <div className="flex flex-col gap-1.5 md:col-span-2">
          <label className={`text-sm font-semibold pl-1 ${isDark ? 'text-[#1A1A1A]' : 'text-[#666666]'}`}>Faculty</label>
          <select
            value={selectedFacultyId}
            onChange={(e) => handleFacultySelect(e.target.value)}
            className={`border rounded-xl px-4 py-2.5 text-sm outline-none transition-colors focus:ring-2 focus:ring-[#0A4D9C]/30 ${isDark ? 'border-slate-600/50 bg-slate-900/50 text-slate-100' : 'border-[#E0E0E0] bg-white text-[#1A1A1A]'}`}
            required
          >
            <option value="">Select Faculty</option>
            {facultyUsers.map((faculty) => (
              <option key={getUserId(faculty)} value={getUserId(faculty)}>
                {faculty.name} ({faculty.department})
              </option>
            ))}
          </select>
        </div>

        <div className="flex flex-col gap-1.5">
          <label className={`text-sm font-semibold pl-1 ${isDark ? 'text-[#1A1A1A]' : 'text-[#666666]'}`}>Email</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="faculty@vvit.edu"
            className={`border rounded-xl px-4 py-2.5 text-sm outline-none transition-colors focus:ring-2 focus:ring-[#0A4D9C]/30 ${isDark ? 'border-slate-600/50 bg-slate-900/50 text-slate-100 placeholder-slate-500' : 'border-[#E0E0E0] bg-white text-[#1A1A1A] placeholder-[#666666]'}`}
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <label className={`text-sm font-semibold pl-1 ${isDark ? 'text-[#1A1A1A]' : 'text-[#666666]'}`}>New Password</label>
          <input
            type="text"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Leave blank to keep current password"
            className={`border rounded-xl px-4 py-2.5 text-sm outline-none transition-colors focus:ring-2 focus:ring-[#0A4D9C]/30 ${isDark ? 'border-slate-600/50 bg-slate-900/50 text-slate-100 placeholder-slate-500' : 'border-[#E0E0E0] bg-white text-[#1A1A1A] placeholder-[#666666]'}`}
          />
        </div>

        <div className="md:col-span-2 flex justify-end">
          <button
            type="submit"
            disabled={isSubmitting}
            className="px-6 py-2.5 bg-gradient-to-r from-[#0A4D9C] to-[#1E73BE] text-white rounded-xl font-bold flex items-center gap-2 hover:from-[#0A3A7A] hover:to-[#1A5FA0] disabled:opacity-60"
          >
            {isSubmitting ? <Loader size={16} className="animate-spin" /> : <Save size={16} />}
            {isSubmitting ? 'Updating...' : 'Update Details'}
          </button>
        </div>
      </form>
    </div>
  );
};

export const Dashboard = ({ user, allUsers, leaves, timetable, onLogout, onRequestLeave, onApproveLeave, onAcceptSubRequest, onForceAssign, addToast, refreshData }) => {
  const { isDark } = useTheme(); // Light mode only
  const isAdmin = user.role?.toLowerCase() === 'admin';
  const isHod = user.role?.toLowerCase() === 'hod';
  const isDeo = user.role?.toLowerCase() === 'deo';
  const canApproveLeaves = isAdmin || isHod;
  const canForceAssign = isAdmin || isDeo;
  const canViewApprovalQueue = canApproveLeaves || isDeo;
  const canSeeTimetable = !isAdmin && !isDeo;

  const [showLeaveForm, setShowLeaveForm] = useState(false);
  const [currentView, setCurrentView] = useState(isAdmin ? 'admin_portal' : 'dashboard');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const myLeaves = leaves.filter(l => l.userId === getUserId(user));
  const userId = getUserId(user);

  const getLocalDateString = () => {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const normalizeDateOnly = (value) => {
    if (!value) return '';
    return String(value).split('T')[0];
  };

  const todayStr = getLocalDateString();
  const isLeaveActive = (leave) => {
    if (!leave?.date) return false;
    const startDate = normalizeDateOnly(leave.date);
    const endDate = normalizeDateOnly(leave.endDate || leave.date);
    return endDate >= todayStr;
  };

  const approvalQueueLeaves = canViewApprovalQueue
    ? leaves.filter(l => isDeo ? isLeaveActive(l) : l.status === 'Pending')
    : [];
  const approvedLeavesForHod = isHod ? leaves.filter(l => l.status === 'Approved') : [];

  const incomingSubRequests = isDeo ? [] : leaves.flatMap(l => {
    const acceptedSlots = new Set();
    l.substitutions.forEach(s => { if (s.status === 'Accepted') acceptedSlots.add(`${s.date}-${s.slot}`); });
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
    <div className={`flex h-screen w-screen overflow-hidden font-sans transition-colors duration-300 ${isDark
      ? 'bg-slate-900 text-slate-100'
      : 'bg-[#F4F7FB] text-slate-900'
      }`}>
      {/* Mobile Menu Backdrop */}
      {mobileMenuOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={() => setMobileMenuOpen(false)}
          className={`fixed inset-0 z-30 md:hidden ${isDark ? 'bg-black/50' : 'bg-black/30'}`}
        />
      )}

      {/* Sidebar - Hidden on mobile */}
      <div className={`fixed md:relative w-72 flex flex-col shrink-0 h-screen border-r z-40 transition-transform duration-300 ${mobileMenuOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
        } bg-gradient-to-b from-white to-[#F8FAFC] border-[#E0E0E0]`}>
        {/* Header */}
        <div className="border-b border-[#E0E0E0] bg-gradient-to-r from-white to-[#F8FAFC] p-4">
          <div className="relative overflow-hidden rounded-2xl border border-[#D8E6F7] bg-gradient-to-br from-[#F4F7FB] via-white to-[#EBF4FF] px-4 py-4 shadow-md">
            <div className="pointer-events-none absolute -left-8 -top-8 h-20 w-20 rounded-full bg-[#1E73BE]/10 blur-2xl" />
            <div className="pointer-events-none absolute -bottom-8 -right-8 h-20 w-20 rounded-full bg-[#0A4D9C]/10 blur-2xl" />
            <div className="relative flex items-center justify-center">
              <div className="relative flex h-24 w-24 shrink-0 items-center justify-center rounded-2xl border border-[#D8E6F7] bg-white/75 backdrop-blur-sm">
                <img src="/vvit-logo.svg" alt="VVIT" className="h-20 w-20 object-contain" />
              </div>
            </div>
          </div>
        </div>

        {/* Scrollable Navigation Area */}
        <nav className="flex-1 overflow-y-auto py-6 flex flex-col gap-1 px-3 scrollbar-thin transition-colors scrollbar-thumb-[#D0D0D0] scrollbar-track-transparent">
          {/* User Profile Card */}
          <div className="px-3 pb-4 mb-2">
            <div className="glass-card p-4 rounded-xl flex items-center gap-3 border border-[#E0E0E0] bg-gradient-to-br from-[#F4F7FB] to-[#F0F4FF] hover:from-[#EBF4FF] hover:to-[#F0F4FF] transition-all">
              <div className="bg-gradient-to-br from-[#0A4D9C]/10 to-[#1E73BE]/10 p-2.5 rounded-full text-[#1E73BE] shrink-0"><User size={20} /></div>
              <div className="overflow-hidden min-w-0">
                <div className="font-bold text-[#1A1A1A] text-sm truncate">{user.name}</div>
                <div className="text-xs text-[#0A4D9C] font-semibold mt-0.5 uppercase tracking-wider">{user.role}</div>
              </div>
            </div>
          </div>

          {/* Navigation Label */}
          <div className="text-[0.65rem] font-bold text-[#0A4D9C] uppercase tracking-widest px-4 mb-3 mt-2">Navigation</div>

          {/* Navigation Buttons */}
          {!isAdmin && (
            <>
              <button
                onClick={() => setCurrentView('dashboard')}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all font-medium text-sm group ${currentView === 'dashboard'
                  ? 'bg-gradient-to-r from-[#0A4D9C] to-[#1E73BE] text-white shadow-lg shadow-[#0A4D9C]/40'
                  : 'text-[#666666] hover:text-[#1A1A1A] hover:bg-[#F4F7FB]'
                  }`}
              >
                <BookOpen size={18} className={currentView === 'dashboard' ? 'text-white' : 'group-hover:text-[#0A4D9C]'} />
                Dashboard
              </button>
              {canSeeTimetable && (
                <button
                  onClick={() => setCurrentView('timetable')}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all font-medium text-sm group ${currentView === 'timetable'
                    ? 'bg-gradient-to-r from-[#0A4D9C] to-[#1E73BE] text-white shadow-lg shadow-[#0A4D9C]/40'
                    : 'text-[#666666] hover:text-[#1A1A1A] hover:bg-[#F4F7FB]'
                    }`}
                >
                  <Calendar size={18} className={currentView === 'timetable' ? 'text-white' : 'group-hover:text-[#0A4D9C]'} />
                  Timetable
                </button>
              )}

              {isDeo && (
                <button
                  onClick={() => setCurrentView('faculty_accounts')}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all font-medium text-sm group ${currentView === 'faculty_accounts'
                    ? 'bg-gradient-to-r from-[#0A4D9C] to-[#1E73BE] text-white shadow-lg shadow-[#0A4D9C]/40'
                    : 'text-[#666666] hover:text-[#1A1A1A] hover:bg-[#F4F7FB]'
                    }`}
                >
                  <Edit size={18} className={currentView === 'faculty_accounts' ? 'text-white' : 'group-hover:text-[#0A4D9C]'} />
                  Update Faculty Details
                </button>
              )}
            </>
          )}

          {canViewApprovalQueue && (
            <button
              onClick={() => setCurrentView('faculty_overview')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all font-medium text-sm group ${currentView === 'faculty_overview'
                ? 'bg-gradient-to-r from-[#0A4D9C] to-[#1E73BE] text-white shadow-lg shadow-[#0A4D9C]/40'
                : 'text-[#666666] hover:text-[#1A1A1A] hover:bg-[#F4F7FB]'
                }`}
            >
              <Users size={18} className={currentView === 'faculty_overview' ? 'text-white' : 'group-hover:text-[#0A4D9C]'} />
              Faculty Status
            </button>
          )}

          {isAdmin && (
            <button
              onClick={() => setCurrentView('admin_portal')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all font-medium text-sm group ${currentView === 'admin_portal'
                ? 'bg-gradient-to-r from-[#228B22] to-[#1a6b1a] text-white shadow-lg shadow-[#228B22]/40'
                : 'text-[#666666] hover:text-[#1A1A1A] hover:bg-[#F4F7FB]'
                }`}
            >
              <Shield size={18} className={currentView === 'admin_portal' ? 'text-white' : 'group-hover:text-[#228B22]'} />
              Admin Panel
            </button>
          )}
        </nav>

        {/* Footer - Logout */}
        <div className="p-4 border-t shrink-0 bg-gradient-to-r from-white to-[#F8FAFC] border-[#E0E0E0]">
          <button
            onClick={onLogout}
            className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-red-500 to-red-600 text-white rounded-lg transition-all font-bold text-sm shadow-lg group active:scale-95 hover:from-red-600 hover:to-red-700"
          >
            <LogOut size={18} className="group-hover:translate-x-1 transition-transform" />
            Sign Out
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-6 md:p-10 relative transition-colors bg-gradient-to-br from-white via-[#F8FAFC] to-[#F4F7FB]">
        {/* Mobile hamburger menu */}
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="md:hidden fixed top-4 left-4 z-50 p-2 rounded-lg transition-colors bg-white/80 hover:bg-[#F4F7FB]/80"
        >
          <Menu size={24} className="text-[#0A4D9C]" />
        </button>

        <div className="max-w-7xl mx-auto w-full flex flex-col gap-6 sm:gap-8 mt-14 md:mt-0">

          {currentView === 'admin_portal' && isAdmin ? (
            <AdminPortal isDark={isDark} addToast={addToast} allUsers={allUsers} timetable={timetable} refreshData={refreshData} />
          ) : currentView === 'faculty_accounts' && isDeo ? (
            <FacultyAccountManager isDark={isDark} addToast={addToast} allUsers={allUsers} refreshData={refreshData} />
          ) : currentView === 'timetable' ? (
            <TimetableView isDark={isDark} user={user} timetable={timetable} allUsers={allUsers} leaves={leaves} />
          ) : currentView === 'faculty_overview' ? (
            <FacultyOverview isDark={isDark} users={allUsers} leaves={leaves} />
          ) : (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
                {/* Casual Leave Card */}
                <div className="group glass-card shadow-soft p-4 sm:p-6 rounded-2xl flex flex-col justify-between relative overflow-hidden border border-[#D0E2F7] bg-gradient-to-br from-[#F4F7FB] via-white to-[#F0F4FF] hover:to-[#E8F0FF] transition-all duration-300">
                  <div className="absolute -right-8 -top-8 w-32 h-32 bg-[#0A4D9C]/10 rounded-full blur-2xl group-hover:bg-[#0A4D9C]/20 transition-all"></div>
                  <div className="absolute -right-4 -bottom-4 text-[#0A4D9C]/20 group-hover:text-[#0A4D9C]/30 transition-colors"><Calendar size={80} className="sm:w-[100px] sm:h-[100px]" /></div>
                  <div className="relative z-10">
                    <div className="text-xs font-bold uppercase tracking-wider text-[#0A4D9C] mb-2">Casual Leave</div>
                    <div className="flex items-end gap-2">
                      <div className="text-3xl sm:text-4xl font-extrabold bg-gradient-to-r from-[#0A4D9C] to-[#1E73BE] bg-clip-text text-transparent">{user.leaveBalance?.casual || 0}</div>
                      <div className="text-xs sm:text-sm font-semibold text-[#666666] mb-1">/ 12</div>
                    </div>
                  </div>
                </div>

                {/* Medical Leave Card */}
                <div className="group glass-card shadow-soft p-4 sm:p-6 rounded-2xl flex flex-col justify-between relative overflow-hidden border border-[#D5F4CF] bg-gradient-to-br from-[#F0FDF4] via-white to-[#E8F9E6] hover:to-[#DFF5DE] transition-all duration-300">
                  <div className="absolute -right-8 -top-8 w-32 h-32 bg-[#228B22]/10 rounded-full blur-2xl group-hover:bg-[#228B22]/20 transition-all"></div>
                  <div className="absolute -right-4 -bottom-4 text-[#228B22]/20 group-hover:text-[#228B22]/30 transition-colors"><CheckCircle size={80} className="sm:w-[100px] sm:h-[100px]" /></div>
                  <div className="relative z-10">
                    <div className="text-xs font-bold uppercase tracking-wider text-[#228B22] mb-2">Medical Leave</div>
                    <div className="flex items-end gap-2">
                      <div className="text-3xl sm:text-4xl font-extrabold bg-gradient-to-r from-[#228B22] to-[#1a6b1a] bg-clip-text text-transparent">{user.leaveBalance?.sick || 0}</div>
                      <div className="text-xs sm:text-sm font-semibold text-[#666666] mb-1">/ 10</div>
                    </div>
                  </div>
                </div>

                {/* Department Card */}
                <div className="group glass-card shadow-soft p-4 sm:p-6 rounded-2xl flex flex-col justify-between relative overflow-hidden border border-[#D0E2F7] bg-gradient-to-br from-[#F4F7FB] via-white to-[#E8F0FF] hover:to-[#E0E8FF] transition-all duration-300">
                  <div className="absolute -right-8 -top-8 w-32 h-32 bg-[#1E73BE]/10 rounded-full blur-2xl group-hover:bg-[#1E73BE]/20 transition-all"></div>
                  <div className="absolute -right-4 -bottom-4 text-[#1E73BE]/20 group-hover:text-[#1E73BE]/30 transition-colors"><Shield size={80} className="sm:w-[100px] sm:h-[100px]" /></div>
                  <div className="relative z-10">
                    <div className="text-xs font-bold uppercase tracking-wider text-[#0A4D9C] mb-2">Department</div>
                    <div className="text-base sm:text-lg font-extrabold text-[#0A4D9C]">{user.department}</div>
                  </div>
                </div>

                {/* Apply Leave Button */}
                <button onClick={() => setShowLeaveForm(true)} className="group btn-gradient-primary hover:brightness-125 shadow-soft p-4 sm:p-6 rounded-2xl flex flex-col items-center justify-center gap-2 sm:gap-3 transition-all active:scale-95 border border-[#0A4D9C]/50 relative overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                  <div className="bg-[#0A4D9C]/60 group-hover:bg-[#0A4D9C]/80 p-2.5 sm:p-3 rounded-full group-hover:scale-110 transition-all"><Calendar size={20} className="sm:w-6 sm:h-6 text-white" /></div>
                  <div className="relative z-10 text-center">
                    <span className="block text-base sm:text-lg font-bold text-white">Apply Leave</span>
                    <span className="text-xs text-white/80">Request time off</span>
                  </div>
                </button>
              </div>

              {incomingSubRequests.length > 0 && (
                <div className="glass-card shadow-soft border border-[#F7E4D1] rounded-2xl overflow-hidden bg-gradient-to-br from-[#FFF4F0] to-white hover:bg-gradient-to-br hover:from-[#FFF4F0] hover:to-[#FDF8F4] transition-all">
                  <div className="p-6 bg-gradient-to-r from-[#FFF4F0] to-[#FFF1E6] border-b border-[#F7E4D1] flex justify-between items-center">
                    <h3 className="m-0 text-[#CC4A21] flex items-center font-bold gap-2 text-lg">
                      <div className="bg-[#CC4A21]/40 p-2 rounded-lg"><AlertCircle size={22} /></div>
                      Substitution Requests
                    </h3>
                    <span className="bg-[#CC4A21]/60 hover:bg-[#CC4A21]/80 text-white px-4 py-1.5 rounded-full text-xs font-bold border border-[#CC4A21]/80 transition-colors">{incomingSubRequests.length} Pending</span>
                  </div>
                  <div className="divide-y divide-[#F7E4D1]">
                    {incomingSubRequests.map((req, idx) => (
                      <div key={idx} className="p-6 flex items-center justify-between flex-wrap gap-4 hover:bg-[#FFF4F0]/50 transition-colors group">
                        <div>
                          <p className="font-bold text-base text-[#1A1A1A] mb-2 group-hover:text-[#CC4A21] transition-colors">Substitute for <span className="font-extrabold text-[#CC4A21]">{req.requester}</span></p>
                          <div className="text-xs text-[#666666] font-medium flex gap-5 flex-wrap">
                            <span className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-lg border border-[#E0E0E0]"><Calendar size={14} className="text-[#0A4D9C]" /> {req.date || req.leaveDate}</span>
                            <span className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-lg border border-[#E0E0E0]"><Clock size={14} className="text-[#D2691E]" /> Slot {req.slot}</span>
                            <span className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-lg border border-[#E0E0E0]"><BookOpen size={14} className="text-[#0A4D9C]" /> {req.class}</span>
                          </div>
                        </div>
                        <div className="flex gap-3">
                          <button onClick={() => onAcceptSubRequest(req.leaveId, req.slot, false)} className="px-5 py-2.5 border border-[#666666] text-[#1A1A1A] rounded-lg text-sm font-semibold hover:bg-[#F4F7FB] hover:text-[#1A1A1A] transition-all active:scale-95">
                            Decline
                          </button>
                          <button onClick={() => onAcceptSubRequest(req.leaveId, req.slot, true)} className="px-5 py-2.5 bg-gradient-to-r from-emerald-600/90 to-teal-600/90 text-white rounded-lg text-sm font-bold shadow-lg shadow-[#228B22]/30 hover:from-[#228B22] hover:to-[#1a6b1a] transition-all active:scale-95">
                            Accept Class
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {canViewApprovalQueue && (
                <div className="glass-card shadow-soft border border-[#E0E0E0] rounded-2xl overflow-hidden mb-auto bg-gradient-to-br from-white to-[#F8FAFC]">
                  <div className="p-6 border-b border-[#E0E0E0] bg-gradient-to-r from-white to-[#F8FAFC]">
                    <h3 className="m-0 font-bold text-[#1A1A1A] text-xl flex items-center gap-3">
                      <div className="bg-[#0A4D9C]/10 p-2 rounded-lg"><FileText size={22} className="text-[#0A4D9C]" /></div>
                      {isDeo ? 'Current Active Leave Requests' : 'Pending Leave Approvals'}
                    </h3>
                  </div>
                  <div className="overflow-x-auto p-4">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr>
                          <th className="p-4 text-xs font-bold text-[#666666] uppercase tracking-wider border-b border-[#E0E0E0]">Faculty</th>
                          <th className="p-4 text-xs font-bold text-[#666666] uppercase tracking-wider border-b border-[#E0E0E0]">Details</th>
                          <th className="p-4 text-xs font-bold text-[#666666] uppercase tracking-wider border-b border-[#E0E0E0] min-w-[300px]">Substitutions Plan</th>
                          <th className="p-4 text-xs font-bold text-[#666666] uppercase tracking-wider border-b border-[#E0E0E0] text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#E0E0E0]">
                        {approvalQueueLeaves.map(l => {
                          const groupedBySlot = {};
                          l.substitutions.forEach(s => {
                            const key = `${s.date}-${s.slot}`;
                            if (!groupedBySlot[key]) groupedBySlot[key] = { date: s.date, slot: s.slot, candidates: [], accepted: null };
                            groupedBySlot[key].candidates.push(s);
                            if (s.status === 'Accepted') groupedBySlot[key].accepted = s;
                          });

                          const hasAcceptedSubstitution = l.substitutions.some(s => s.status === 'Accepted');
                          const hasPendingSubstitution = l.substitutions.some(s => s.status === 'Pending');
                          const actionStatus = hasAcceptedSubstitution ? 'Accepted' : hasPendingSubstitution ? 'Pending' : 'Rejected';

                          return (
                            <tr key={l._id} className="hover:bg-[#F4F7FB]/40 transition-colors">
                              <td className="p-4 align-top"><div className="font-bold text-[#1A1A1A] text-sm">{l.userName}</div></td>
                              <td className="p-4 align-top">
                                <span className="inline-block px-2 py-0.5 bg-[#F4F7FB] text-[#0A4D9C] text-[0.65rem] font-bold uppercase rounded mb-1 border border-[#D0E2F7]">{l.type}</span>
                                <div className="text-xs font-medium text-[#0A4D9C] mb-1">{l.date}</div>
                                <div className="text-xs text-[#666666] max-w-xs line-clamp-2 italic border-l-2 border-[#E0E0E0] pl-2">{l.reason}</div>
                              </td>
                              <td className="p-4 align-top">
                                {l.substitutions.length > 0 ? (
                                  <ul className="flex flex-col gap-3">
                                    {Object.values(groupedBySlot).map((group, gIdx) => (
                                      <li key={gIdx} className="glass-card p-3 rounded-lg border border-[#E0E0E0] bg-white">
                                        <div className="flex items-center justify-between mb-1">
                                          <div className="flex items-center gap-2">
                                            <span className="bg-[#F4F7FB] text-[#0A4D9C] text-xs font-bold px-2 py-0.5 rounded border border-[#D0E2F7]">{group.date} • S{group.slot}</span>
                                            {group.accepted ? <span className="font-bold text-sm text-[#228B22]">{group.accepted.subName}</span> : <span className="text-xs font-semibold text-[#CC4A21] bg-[#FFF1E6] px-2 py-0.5 rounded border border-[#F7E4D1]">{isHod ? 'Awaiting' : `Pending (${group.candidates.length} Notified)`}</span>}
                                          </div>
                                          {group.accepted && <StatusBadge status="Accepted" />}
                                        </div>
                                        {!group.accepted && canForceAssign && (
                                          <div className="mt-2 border-t border-[#E0E0E0] pt-2">
                                            <ForceAssignSelector slot={group.slot} allUsers={findAvailableSubstitutes(group.date || l.date, group.slot, l.userId, allUsers, timetable, leaves)} onForceAssign={(slot, subId, subName) => onForceAssign(l._id, slot, subId, subName)} />
                                          </div>
                                        )}
                                      </li>
                                    ))}
                                  </ul>
                                ) : <span className="text-[#666666] text-sm italic font-medium">No substitutions required</span>}
                              </td>
                              <td className="p-4 align-top text-right">
                                {canApproveLeaves ? (
                                  <div className="flex flex-col gap-2 justify-end items-end">
                                    <button onClick={() => onApproveLeave(l._id, 'Approved')} className="w-full max-w-[120px] bg-[#228B22] hover:bg-[#1a6b1a] text-white font-bold py-2 rounded-lg text-xs shadow-soft transition-all active:scale-95">Approve Leave</button>
                                    <button onClick={() => onApproveLeave(l._id, 'Rejected')} className="w-full max-w-[120px] bg-[#CD5C5C] hover:bg-[#B84A4A] text-white font-bold py-2 rounded-lg text-xs transition-all active:scale-95">Reject</button>
                                  </div>
                                ) : (
                                  <div className="flex justify-end">
                                    <StatusBadge status={isDeo ? l.status : actionStatus} />
                                  </div>
                                )}
                              </td>
                            </tr>
                          )
                        })}
                        {approvalQueueLeaves.length === 0 && <tr><td colSpan="4" className="text-center p-8 text-white0 font-medium italic">All caught up! No requests to review.</td></tr>}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {isHod && (
                <div className="glass-card shadow-soft border border-[#E0E0E0] rounded-2xl overflow-hidden mb-auto bg-gradient-to-br from-white to-[#F8FAFC]">
                  <div className="p-6 border-b border-[#E0E0E0] bg-gradient-to-r from-white to-[#F8FAFC]">
                    <h3 className="m-0 font-bold text-[#1A1A1A] text-xl flex items-center gap-3">
                      <div className="bg-[#228B22]/10 p-2 rounded-lg"><CheckCircle size={22} className="text-[#228B22]" /></div>
                      Approved Leaves
                    </h3>
                  </div>
                  <div className="overflow-x-auto p-4">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr>
                          <th className="p-4 text-xs font-bold text-[#666666] uppercase tracking-wider border-b border-[#E0E0E0]">Faculty</th>
                          <th className="p-4 text-xs font-bold text-[#666666] uppercase tracking-wider border-b border-[#E0E0E0]">Date</th>
                          <th className="p-4 text-xs font-bold text-[#666666] uppercase tracking-wider border-b border-[#E0E0E0]">Substitution Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#E0E0E0]">
                        {approvedLeavesForHod.map((leave) => {
                          const groupedBySlot = {};
                          (leave.substitutions || []).forEach(sub => {
                            const key = `${sub.date || leave.date}-${sub.slot}`;
                            if (!groupedBySlot[key]) {
                              groupedBySlot[key] = {
                                date: sub.date || leave.date,
                                slot: sub.slot,
                                accepted: null,
                                pendingCount: 0,
                                rejectedCount: 0
                              };
                            }
                            if (sub.status === 'Accepted') groupedBySlot[key].accepted = sub;
                            else if (sub.status === 'Pending') groupedBySlot[key].pendingCount += 1;
                            else if (sub.status === 'Rejected') groupedBySlot[key].rejectedCount += 1;
                          });

                          const slotStatuses = Object.values(groupedBySlot).sort((a, b) => a.date.localeCompare(b.date) || a.slot - b.slot);

                          return (
                            <tr key={leave._id} className="hover:bg-[#F4F7FB]/40 transition-colors">
                              <td className="p-4 align-top"><div className="font-bold text-[#1A1A1A] text-sm">{leave.userName}</div></td>
                              <td className="p-4 align-top"><div className="text-xs font-semibold text-[#0A4D9C]">{leave.date}{leave.endDate ? ` to ${leave.endDate}` : ''}</div></td>
                              <td className="p-4 align-top">
                                {slotStatuses.length > 0 ? (
                                  <div className="flex flex-col gap-2">
                                    {slotStatuses.map((slotInfo, index) => (
                                      <div key={index} className="flex flex-wrap items-center gap-2 text-xs">
                                        <span className="bg-[#F4F7FB] text-[#0A4D9C] font-bold px-2 py-0.5 rounded border border-[#D0E2F7]">{slotInfo.date} • S{slotInfo.slot}</span>
                                        {slotInfo.accepted ? (
                                          <>
                                            <span className="font-bold text-[#228B22]">{slotInfo.accepted.subName}</span>
                                            <StatusBadge status="Accepted" />
                                          </>
                                        ) : slotInfo.pendingCount > 0 ? (
                                          <span className="text-[#CC4A21] font-semibold bg-[#FFF1E6] px-2 py-0.5 rounded border border-[#F7E4D1]">Awaiting</span>
                                        ) : (
                                          <span className="text-[#CD5C5C] font-semibold bg-[#FFF4F0] px-2 py-0.5 rounded border border-[#FDD7C8]">Rejected</span>
                                        )}
                                      </div>
                                    ))}
                                  </div>
                                ) : (
                                  <span className="text-[#666666] text-sm italic font-medium">No substitutions required</span>
                                )}
                              </td>
                            </tr>
                          );
                        })}
                        {approvedLeavesForHod.length === 0 && (
                          <tr>
                            <td colSpan="3" className="text-center p-8 text-white0 font-medium italic">No approved leaves found.</td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              <div className="glass-card shadow-soft border border-slate-700/50 rounded-2xl overflow-hidden mb-auto bg-gradient-to-br from-slate-800/80 to-slate-900/40">
                <div className="p-6 border-b border-slate-700/50 bg-gradient-to-r from-purple-950/60 to-slate-900/60"><h3 className="m-0 font-bold text-slate-100 text-xl flex items-center gap-3">
                  <div className="bg-purple-600/40 p-2 rounded-lg"><Calendar size={22} className="text-purple-300" /></div>
                  My Leave History
                </h3></div>
                <div className="overflow-x-auto p-4">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr>
                        <th className="p-4 text-xs font-bold text-[#666666] uppercase tracking-wider border-b border-slate-700/50">Date & Type</th>
                        <th className="p-4 text-xs font-bold text-[#666666] uppercase tracking-wider border-b border-slate-700/50">Reason</th>
                        <th className="p-4 text-xs font-bold text-[#666666] uppercase tracking-wider border-b border-slate-700/50">Substitutes</th>
                        <th className="p-4 text-xs font-bold text-[#666666] uppercase tracking-wider border-b border-slate-700/50 text-right">HOD Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-700/50">
                      {myLeaves.map(l => {
                        const uniqueSlots = {};
                        l.substitutions.forEach(s => {
                          const key = `${s.date || l.date}-${s.slot}`;
                          if (!uniqueSlots[key]) uniqueSlots[key] = { date: s.date || l.date, slot: s.slot, accepted: null, pendingCount: 0, rejectedCount: 0 };
                          if (s.status === 'Accepted') uniqueSlots[key].accepted = s.subName;
                          else if (s.status === 'Pending') uniqueSlots[key].pendingCount++;
                          else if (s.status === 'Rejected') uniqueSlots[key].rejectedCount++;
                        });
                        const slotList = Object.values(uniqueSlots).sort((a, b) => a.date.localeCompare(b.date) || a.slot - b.slot);

                        return (
                          <tr key={l._id} className="hover:bg-slate-800/40 transition-colors">
                            <td className="p-4 align-top">
                              <div className="flex w-fit items-center px-2 py-0.5 rounded border border-slate-500/70 bg-slate-700/40 font-bold text-white text-sm mb-2">{l.date}</div>
                              <span className="inline-block px-2.5 py-0.5 bg-[#E0E0E0]/60 border border-[#666666] text-[#1A1A1A] text-[0.65rem] font-bold uppercase rounded tracking-wide">{l.type}</span>
                            </td>
                            <td className="p-4 align-top"><p className="text-xs text-[#666666] max-w-xs">{l.reason}</p></td>
                            <td className="p-4 align-top">
                              {slotList.length === 0 ? (
                                <span className="px-3 py-1 bg-[#E0E0E0]/60 text-[#666666] rounded text-xs font-semibold inline-flex items-center gap-1.5 border border-slate-600"><Check size={12} /> {['Casual', 'Partial'].includes(l.type) ? 'Not Required' : '-'}</span>
                              ) : (
                                <div className="flex flex-col gap-2">
                                  {slotList.map((slotInfo, idx) => (
                                    <div key={idx} className="flex items-center gap-2">
                                      <span className="bg-[#E0E0E0]/60 text-[#1A1A1A] text-[0.65rem] font-bold px-1.5 py-0.5 rounded border border-slate-600">S{slotInfo.slot}</span>
                                      {slotInfo.accepted ? <span className="text-[#228B22] text-xs font-bold flex items-center gap-1"><CheckCircle size={12} className="shrink-0" /> {l.type === 'Medical' ? `${slotInfo.date} - ` : ''} {slotInfo.accepted}</span> : slotInfo.pendingCount > 0 ? <span className="text-[#D2691E] text-xs font-semibold flex items-center gap-1"><Clock size={12} className="shrink-0" /> {l.type === 'Medical' ? `${slotInfo.date} - ` : ''} Waiting ({slotInfo.pendingCount})</span> : <span className="text-red-400 text-xs font-semibold flex items-center gap-1"><XCircle size={12} className="shrink-0" /> Cancelled/Rejected</span>}
                                    </div>
                                  ))}
                                </div>
                              )}
                            </td>
                            <td className="p-4 align-top text-right"><div className="flex justify-end"><StatusBadge status={l.status} /></div></td>
                          </tr>
                        );
                      })}
                      {myLeaves.length === 0 && <tr><td colSpan="4" className="text-center p-8 text-white0 font-medium italic">No leave history found.</td></tr>}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      {showLeaveForm && (
        <LeaveApplicationForm user={user} allUsers={allUsers} onClose={() => setShowLeaveForm(false)} onSubmit={(data) => { onRequestLeave(data); setShowLeaveForm(false); }} addToast={addToast} timetable={timetable} leaves={leaves} />
      )}
    </div>
  );
};
