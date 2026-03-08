import React, { useState, useMemo } from 'react';
import axios from 'axios';
import {
  Calendar, CheckCircle, Clock, User, Users, LogOut, BookOpen, Shield,
  Eye, AlertCircle, XCircle, Check, UserPlus, Plus, Trash2, Save, Loader,
  Edit, AlertOctagon, X, ChevronRight, Grid
} from 'lucide-react';

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
  const usersOnLeave = leaves
    .filter(l => l.date === dateStr && (l.status === 'Pending' || l.status === 'Approved'))
    .map(l => l.userId);

  const candidates = allUsers.filter(u => 
    getUserId(u) !== originalUserId && 
    !usersOnLeave.includes(getUserId(u))
  );

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
  let badgeClass = 'bg-amber-100 text-amber-800 border-amber-200';
  let Icon = Clock;

  if (status === 'Accepted' || status === 'Approved') { 
    badgeClass = 'bg-emerald-100 text-emerald-800 border-emerald-200'; 
    Icon = CheckCircle; 
  }
  else if (status === 'Rejected') { 
    badgeClass = 'bg-rose-100 text-rose-800 border-rose-200'; 
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
          >AM</button>
          <button 
            type="button"
            className={`px-3 py-1 text-xs font-bold rounded-lg transition-all ${period === 'PM' ? 'bg-white shadow-sm text-blue-600' : 'text-slate-400 hover:text-slate-600 hover:bg-slate-200'}`}
            onClick={() => onChange('period', 'PM')}
          >PM</button>
        </div>
      </div>
    </div>
  );
};

const ForceAssignSelector = ({ slot, allUsers, onForceAssign }) => {
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

const FacultyOverview = ({ users, leaves }) => {
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

const TimetableView = ({ user, timetable }) => {
  const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
  const slots = [
    { id: 1, time: '08:00 - 08:50' },
    { id: 2, time: '09:10 - 10:00' },
    { id: 3, time: '10:00 - 10:50' },
    { id: 4, time: '11:10 - 12:00' },
    { id: 5, time: '12:00 - 12:50' },
    { id: 6, time: '01:40 - 02:30' },
    { id: 7, time: '02:30 - 03:20' },
    { id: 8, time: '03:20 - 04:10' },
  ];

  const getSchedule = (day, slotId) => {
    return timetable.find(t => t.userId === getUserId(user) && t.day === day && t.slot === slotId);
  };

  const renderCell = (day, slot) => {
    const schedule = getSchedule(day, slot.id);
    return (
      <td key={slot.id} className="border-r border-slate-200 p-1 align-middle h-16 w-28 min-w-[7rem] bg-white transition-colors hover:bg-slate-50/50">
        {schedule ? (
          <div className={`h-full w-full rounded p-1 flex flex-col justify-center items-center text-center border shadow-[0_1px_2px_rgba(0,0,0,0.02)] transition-all hover:shadow-sm ${
            schedule.subject.startsWith('Sub:') 
              ? 'bg-emerald-50 border-emerald-200' 
              : 'bg-blue-50 border-blue-200'
          }`}>
            <div className={`font-bold text-[0.65rem] leading-tight line-clamp-2 ${
              schedule.subject.startsWith('Sub:') ? 'text-emerald-800' : 'text-blue-800'
            }`}>
              {schedule.subject}
            </div>
            <div className="mt-0.5">
                <span className={`px-1.5 py-0.5 rounded text-[0.55rem] font-extrabold shadow-sm ${
                  schedule.subject.startsWith('Sub:') ? 'bg-emerald-200 text-emerald-900' : 'bg-blue-200 text-blue-900'
                }`}>
                  {schedule.class}
                </span>
            </div>
          </div>
        ) : (
          <div className="h-full w-full rounded flex flex-col items-center justify-center text-slate-300 text-[0.6rem] uppercase tracking-wider font-bold border border-dashed border-slate-200 bg-slate-50/50">
            Free
          </div>
        )}
      </td>
    );
  };

  const renderBreak = (label) => (
    <td className="bg-slate-50 border-r border-slate-200 w-8 min-w-[2rem] p-0 align-middle">
      <div className="mx-auto text-[0.55rem] text-slate-400 font-bold uppercase tracking-widest flex items-center justify-center h-full" style={{ writingMode: 'vertical-rl', transform: 'rotate(180deg)' }}>
        {label}
      </div>
    </td>
  );

  return (
    <div className="bg-white border border-slate-200 rounded-3xl shadow-sm flex flex-col overflow-hidden mb-auto">
      <div className="p-4 border-b border-slate-200 flex justify-between items-center bg-slate-50 shrink-0">
        <div>
          <h2 className="text-lg font-extrabold text-slate-800">My Weekly Timetable</h2>
          <p className="text-xs text-slate-500 font-medium mt-0.5">Academic Year 2023-2024</p>
        </div>
        <div className="bg-white border border-slate-200 text-blue-600 p-2 rounded-xl shadow-sm">
          <Grid size={20} />
        </div>
      </div>
      
      <div className="p-4 overflow-x-auto bg-slate-50/30 flex-1">
        <div className="border border-slate-200 rounded-xl shadow-sm bg-white overflow-hidden w-max mx-auto">
          <table className="w-max border-collapse text-left">
            <thead>
              <tr className="bg-slate-100 border-b border-slate-200">
                <th className="w-20 min-w-[5rem] p-2 font-extrabold text-slate-700 text-xs border-r border-slate-200 text-center sticky left-0 z-20 bg-slate-100 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.05)]">Day</th>
                <th className="w-28 min-w-[7rem] p-1.5 border-r border-slate-200 text-center"><div className="text-[0.65rem] font-extrabold text-slate-700">Slot 1</div><div className="text-[0.55rem] font-medium text-slate-500 mt-0.5">08:00-08:50</div></th>
                <th className="w-8 min-w-[2rem] bg-slate-50 border-r border-slate-200 p-1 align-middle text-center"><div className="mx-auto text-[0.5rem] text-slate-400 font-bold uppercase tracking-widest" style={{ writingMode: 'vertical-rl', transform: 'rotate(180deg)' }}>Break</div></th>
                <th className="w-28 min-w-[7rem] p-1.5 border-r border-slate-200 text-center"><div className="text-[0.65rem] font-extrabold text-slate-700">Slot 2</div><div className="text-[0.55rem] font-medium text-slate-500 mt-0.5">09:10-10:00</div></th>
                <th className="w-28 min-w-[7rem] p-1.5 border-r border-slate-200 text-center"><div className="text-[0.65rem] font-extrabold text-slate-700">Slot 3</div><div className="text-[0.55rem] font-medium text-slate-500 mt-0.5">10:00-10:50</div></th>
                <th className="w-8 min-w-[2rem] bg-slate-50 border-r border-slate-200 p-1 align-middle text-center"><div className="mx-auto text-[0.5rem] text-slate-400 font-bold uppercase tracking-widest" style={{ writingMode: 'vertical-rl', transform: 'rotate(180deg)' }}>Break</div></th>
                <th className="w-28 min-w-[7rem] p-1.5 border-r border-slate-200 text-center"><div className="text-[0.65rem] font-extrabold text-slate-700">Slot 4</div><div className="text-[0.55rem] font-medium text-slate-500 mt-0.5">11:10-12:00</div></th>
                <th className="w-28 min-w-[7rem] p-1.5 border-r border-slate-200 text-center"><div className="text-[0.65rem] font-extrabold text-slate-700">Slot 5</div><div className="text-[0.55rem] font-medium text-slate-500 mt-0.5">12:00-12:50</div></th>
                <th className="w-8 min-w-[2rem] bg-slate-50 border-r border-slate-200 p-1 align-middle text-center"><div className="mx-auto text-[0.5rem] text-slate-400 font-bold uppercase tracking-widest" style={{ writingMode: 'vertical-rl', transform: 'rotate(180deg)' }}>Lunch</div></th>
                <th className="w-28 min-w-[7rem] p-1.5 border-r border-slate-200 text-center"><div className="text-[0.65rem] font-extrabold text-slate-700">Slot 6</div><div className="text-[0.55rem] font-medium text-slate-500 mt-0.5">01:40-02:30</div></th>
                <th className="w-28 min-w-[7rem] p-1.5 border-r border-slate-200 text-center"><div className="text-[0.65rem] font-extrabold text-slate-700">Slot 7</div><div className="text-[0.55rem] font-medium text-slate-500 mt-0.5">02:30-03:20</div></th>
                <th className="w-28 min-w-[7rem] p-1.5 border-r border-slate-200 text-center"><div className="text-[0.65rem] font-extrabold text-slate-700">Slot 8</div><div className="text-[0.55rem] font-medium text-slate-500 mt-0.5">03:20-04:10</div></th>
              </tr>
            </thead>
            <tbody>
              {days.map((day, idx) => (
                <tr key={day} className="border-b border-slate-200 last:border-b-0">
                  <td className="w-20 min-w-[5rem] p-2 font-bold text-slate-700 text-xs border-r border-slate-200 text-center bg-slate-50 sticky left-0 z-10 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.05)]">{day}</td>
                  {renderCell(day, slots[0])}
                  {renderBreak('Break')}
                  {renderCell(day, slots[1])}
                  {renderCell(day, slots[2])}
                  {renderBreak('Break')}
                  {renderCell(day, slots[3])}
                  {renderCell(day, slots[4])}
                  {renderBreak('Lunch')}
                  {renderCell(day, slots[5])}
                  {renderCell(day, slots[6])}
                  {renderCell(day, slots[7])}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

const AdminPortal = ({ addToast, allUsers, timetable, refreshData }) => {
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

      const userRes = await axios.post(`${API_URL}/admin/users`, userDetails, config);
      const newUserId = userRes.data._id || userRes.data.id;

      if (timetableEntries.length > 0) {
        const payload = timetableEntries.map(entry => ({ ...entry, userId: newUserId }));
        await axios.post(`${API_URL}/admin/timetable/bulk`, { entries: payload }, config);
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
      await axios.delete(`${API_URL}/admin/users/${selectedUserId}`, { headers: { 'x-auth-token': token } });
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
      await axios.delete(`${API_URL}/admin/timetable/${slotId}`, { headers: { 'x-auth-token': token } });
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
      await axios.post(`${API_URL}/admin/timetable`, { ...newSlot, userId: selectedUserId }, { headers: { 'x-auth-token': token } });
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
    <div className="bg-white border border-slate-200 rounded-3xl shadow-sm overflow-hidden mb-auto">
      <div className="p-6 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
            <Shield size={24} className="text-emerald-600" />
            System Administration
          </h2>
          <p className="text-sm text-slate-500 mt-1">Manage accounts and platform configurations</p>
        </div>
      </div>

      <div className="flex px-6 border-b border-slate-200 bg-slate-50/50">
        <button 
          onClick={() => setActiveTab('create')} 
          className={`py-3 px-4 font-bold text-sm border-b-2 transition-colors ${activeTab === 'create' ? 'border-emerald-600 text-emerald-700' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
        >
          <div className="flex items-center gap-2"><UserPlus size={16}/> Create Account</div>
        </button>
        <button 
          onClick={() => setActiveTab('manage')} 
          className={`py-3 px-4 font-bold text-sm border-b-2 transition-colors ${activeTab === 'manage' ? 'border-emerald-600 text-emerald-700' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
        >
          <div className="flex items-center gap-2"><Edit size={16}/> Manage Faculty</div>
        </button>
      </div>

      <div className="p-6 md:p-8">
        {activeTab === 'create' ? (
          <form onSubmit={handleCreateSubmit} className="flex flex-col gap-8 animate-[slideIn_0.2s_ease-out]">
            <div>
              <h3 className="text-sm font-bold uppercase tracking-widest text-slate-400 mb-4 flex items-center gap-2 border-b border-slate-100 pb-2">
                1. Account Details
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div className="flex flex-col gap-1.5">
                  <label className="text-sm font-semibold text-slate-700 pl-1">Full Name</label>
                  <input type="text" name="name" value={userDetails.name} onChange={handleUserChange} placeholder="e.g., Dr. Alan Turing" className="border border-slate-300 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-emerald-500 outline-none" required />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-sm font-semibold text-slate-700 pl-1">Email Address</label>
                  <input type="email" name="email" value={userDetails.email} onChange={handleUserChange} placeholder="alan@uni.edu" className="border border-slate-300 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-emerald-500 outline-none" required />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-sm font-semibold text-slate-700 pl-1">Password</label>
                  <input type="text" name="password" value={userDetails.password} onChange={handleUserChange} placeholder="Temporary password" className="border border-slate-300 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-emerald-500 outline-none" required />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-sm font-semibold text-slate-700 pl-1">Department</label>
                  <input type="text" name="department" value={userDetails.department} onChange={handleUserChange} placeholder="e.g., Computer Science" className="border border-slate-300 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-emerald-500 outline-none" required />
                </div>
                <div className="flex flex-col gap-1.5 md:col-span-2">
                  <label className="text-sm font-semibold text-slate-700 pl-1">Role</label>
                  <select name="role" value={userDetails.role} onChange={handleUserChange} className="border border-slate-300 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-emerald-500 outline-none bg-white">
                    <option value="Faculty">Faculty</option>
                    <option value="HOD">Head of Department (HOD)</option>
                  </select>
                </div>
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-4 border-b border-slate-100 pb-2">
                 <h3 className="text-sm font-bold uppercase tracking-widest text-slate-400 flex items-center gap-2">
                   2. Timetable Setup (Initial)
                 </h3>
                 <button type="button" onClick={addTimetableEntry} className="text-emerald-600 text-sm font-bold flex items-center gap-1 hover:text-emerald-800 transition-colors">
                   <Plus size={16} /> Add Slot
                 </button>
              </div>
              
              <div className="flex flex-col gap-3">
                {timetableEntries.map((entry, index) => (
                  <div key={index} className="grid grid-cols-1 md:grid-cols-[1fr_1fr_2fr_1fr_auto] gap-3 items-center bg-slate-50 p-3 rounded-xl border border-slate-200 shadow-sm transition-all hover:shadow-md">
                    <div className="flex flex-col gap-1">
                      <label className="text-[0.65rem] font-bold text-slate-500 uppercase ml-1">Day</label>
                      <select value={entry.day} onChange={(e) => handleTimetableChange(index, 'day', e.target.value)} className="border border-slate-300 rounded-lg px-3 py-2 text-sm bg-white outline-none focus:ring-2 focus:ring-emerald-500">
                        {days.map(d => <option key={d} value={d}>{d}</option>)}
                      </select>
                    </div>
                    <div className="flex flex-col gap-1">
                      <label className="text-[0.65rem] font-bold text-slate-500 uppercase ml-1">Slot</label>
                      <select value={entry.slot} onChange={(e) => handleTimetableChange(index, 'slot', Number(e.target.value))} className="border border-slate-300 rounded-lg px-3 py-2 text-sm bg-white outline-none focus:ring-2 focus:ring-emerald-500">
                        {slots.map(s => <option key={s} value={s}>Slot {s}</option>)}
                      </select>
                    </div>
                    <div className="flex flex-col gap-1">
                      <label className="text-[0.65rem] font-bold text-slate-500 uppercase ml-1">Subject</label>
                      <input type="text" value={entry.subject} onChange={(e) => handleTimetableChange(index, 'subject', e.target.value)} placeholder="e.g., Data Structures" className="border border-slate-300 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-emerald-500" required />
                    </div>
                    <div className="flex flex-col gap-1">
                      <label className="text-[0.65rem] font-bold text-slate-500 uppercase ml-1">Class/Section</label>
                      <input type="text" value={entry.class} onChange={(e) => handleTimetableChange(index, 'class', e.target.value)} placeholder="e.g., CS-A" className="border border-slate-300 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-emerald-500" required />
                    </div>
                    <div className="flex flex-col gap-1 md:mt-4">
                      <button type="button" onClick={() => removeTimetableEntry(index)} className="p-2 text-rose-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors" title="Remove slot">
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </div>
                ))}
                
                {timetableEntries.length === 0 && (
                  <div className="text-center py-8 bg-slate-50 rounded-xl border border-dashed border-slate-300 text-slate-500 text-sm">
                    No classes added. This faculty will have a completely free timetable.
                  </div>
                )}
              </div>
            </div>

            <div className="pt-4 border-t border-slate-100 flex justify-end">
              <button type="submit" disabled={isSubmitting} className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3 px-8 rounded-xl shadow-lg shadow-emerald-600/30 transition-all flex items-center gap-2 active:scale-95 disabled:opacity-70">
                {isSubmitting ? <Loader className="animate-spin" size={18} /> : <Save size={18} />}
                {isSubmitting ? 'Creating Profile...' : 'Save Account & Timetable'}
              </button>
            </div>
          </form>
        ) : (
          <div className="flex flex-col gap-6 animate-[slideIn_0.2s_ease-out]">
            <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="w-full sm:w-1/2">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-1.5 block ml-1">Select Faculty to Edit</label>
                <select 
                  className="w-full border border-slate-300 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-emerald-500 outline-none bg-white shadow-sm font-semibold"
                  value={selectedUserId}
                  onChange={(e) => setSelectedUserId(e.target.value)}
                >
                  <option value="">-- Choose Faculty Member --</option>
                  {facultyList.map(u => (
                    <option key={safeId(u)} value={safeId(u)}>{u.name} ({u.department})</option>
                  ))}
                </select>
              </div>

              {selectedUserId && (
                <button 
                  onClick={handleDeleteUser}
                  className="w-full sm:w-auto mt-auto bg-white border-2 border-rose-200 text-rose-600 hover:bg-rose-50 hover:border-rose-300 font-bold py-2.5 px-5 rounded-xl transition-all flex items-center justify-center gap-2"
                >
                  <AlertOctagon size={18} /> Delete Account Permanently
                </button>
              )}
            </div>

            {selectedUserId && (
              <div className="flex flex-col gap-6 mt-4">
                <div>
                   <h3 className="text-sm font-bold uppercase tracking-widest text-slate-400 mb-4 border-b border-slate-100 pb-2">
                    Current Timetable ({selectedUserTimetable.length} Slots)
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                    {selectedUserTimetable.map(slot => (
                      <div key={slot._id} className="bg-white border border-slate-200 p-4 rounded-xl shadow-sm flex flex-col justify-between hover:border-emerald-200 transition-colors">
                         <div className="flex justify-between items-start mb-2">
                           <span className="bg-slate-100 text-slate-700 text-[0.65rem] font-bold px-2 py-0.5 rounded uppercase tracking-wider">{slot.day} • S{slot.slot}</span>
                           <button onClick={() => handleDeleteSlot(slot._id)} className="text-slate-300 hover:text-rose-500 transition-colors"><Trash2 size={16}/></button>
                         </div>
                         <div>
                            <div className="font-bold text-sm text-slate-800 leading-tight">{slot.subject}</div>
                            <div className="text-xs font-semibold text-emerald-600 mt-1">{slot.class}</div>
                         </div>
                      </div>
                    ))}
                    {selectedUserTimetable.length === 0 && (
                      <p className="text-slate-400 text-sm italic col-span-full">No active timetable slots for this user.</p>
                    )}
                  </div>
                </div>

                <div className="bg-emerald-50 border border-emerald-100 p-5 rounded-2xl mt-2">
                  <h3 className="text-sm font-bold text-emerald-800 mb-3 flex items-center gap-2">
                    <Plus size={16} /> Append New Class Slot
                  </h3>
                  <form onSubmit={handleAddSingleSlot} className="flex flex-wrap items-end gap-3">
                    <div className="flex flex-col gap-1 flex-1 min-w-[100px]">
                      <label className="text-[0.65rem] font-bold text-emerald-700 uppercase">Day</label>
                      <select value={newSlot.day} onChange={(e)=>setNewSlot({...newSlot, day: e.target.value})} className="border border-emerald-200 rounded-lg px-3 py-2 text-sm bg-white outline-none focus:ring-2 focus:ring-emerald-500">
                        {days.map(d => <option key={d} value={d}>{d}</option>)}
                      </select>
                    </div>
                    <div className="flex flex-col gap-1 flex-1 min-w-[90px]">
                      <label className="text-[0.65rem] font-bold text-emerald-700 uppercase">Slot</label>
                      <select value={newSlot.slot} onChange={(e)=>setNewSlot({...newSlot, slot: Number(e.target.value)})} className="border border-emerald-200 rounded-lg px-3 py-2 text-sm bg-white outline-none focus:ring-2 focus:ring-emerald-500">
                        {slots.map(s => <option key={s} value={s}>Slot {s}</option>)}
                      </select>
                    </div>
                    <div className="flex flex-col gap-1 flex-[2] min-w-[150px]">
                      <label className="text-[0.65rem] font-bold text-emerald-700 uppercase">Subject</label>
                      <input type="text" value={newSlot.subject} onChange={(e)=>setNewSlot({...newSlot, subject: e.target.value})} placeholder="Subject" className="border border-emerald-200 rounded-lg px-3 py-2 text-sm bg-white outline-none focus:ring-2 focus:ring-emerald-500" required />
                    </div>
                    <div className="flex flex-col gap-1 flex-[1.5] min-w-[100px]">
                      <label className="text-[0.65rem] font-bold text-emerald-700 uppercase">Class</label>
                      <input type="text" value={newSlot.class} onChange={(e)=>setNewSlot({...newSlot, class: e.target.value})} placeholder="Class" className="border border-emerald-200 rounded-lg px-3 py-2 text-sm bg-white outline-none focus:ring-2 focus:ring-emerald-500" required />
                    </div>
                    <button type="submit" disabled={isSubmitting} className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2 px-5 rounded-lg shadow-md transition-all h-[38px] disabled:opacity-50">
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
  );
};

const LeaveApplicationForm = ({ user, allUsers, onClose, onSubmit, addToast, timetable, leaves }) => {
  const [step, setStep] = useState(1);
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

      if ((formData.type === 'Partial' || formData.type === 'Casual') && classesReqSubstitution.length === 0) {
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
        <div className="bg-blue-600 px-6 py-5 flex justify-between items-center text-white shrink-0">
          <div>
             <h3 className="text-xl font-bold">Apply for Leave</h3>
             <p className="text-blue-200 text-xs font-medium mt-1">Step {step} of {((formData.type === 'Partial' || formData.type === 'Casual') && classesReqSubstitution.length === 0) ? '1' : '2'}</p>
          </div>
          <button onClick={onClose} className="p-2 bg-white/10 hover:bg-white/20 rounded-full transition-colors"><X size={20} /></button>
        </div>
        <div className="p-6 overflow-y-auto flex-1 bg-slate-50/50">
          {step === 1 ? (
            <div className="flex flex-col gap-5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div className="flex flex-col gap-1.5">
                  <label className="text-sm font-semibold text-slate-700 pl-1">Leave Type</label>
                  <select className="border border-slate-300 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white" value={formData.type} onChange={e => setFormData({ ...formData, type: e.target.value })}>
                    <option>Casual</option><option>Medical</option><option>Partial</option>
                  </select>
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-sm font-semibold text-slate-700 pl-1">Start Date</label>
                  <input type="date" className="border border-slate-300 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white" value={formData.date} onChange={e => setFormData({ ...formData, date: e.target.value })} />
                </div>
              </div>
              {formData.type === 'Medical' && (
                <div className="flex flex-col gap-1.5">
                  <label className="text-sm font-semibold text-slate-700 pl-1">End Date</label>
                  <input type="date" className="border border-slate-300 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white" value={formData.endDate} onChange={e => setFormData({ ...formData, endDate: e.target.value })} />
                </div>
              )}
              {formData.type === 'Partial' && (
                 <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                   <TimePicker label="Start Time" value={formData.startTime} period={formData.startTimePeriod} onChange={(key, val) => handleTimeChange('startTime', key, val)} />
                   <TimePicker label="End Time" value={formData.endTime} period={formData.endTimePeriod} onChange={(key, val) => handleTimeChange('endTime', key, val)} />
                 </div>
              )}
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-semibold text-slate-700 pl-1">Reason</label>
                <textarea className="border border-slate-300 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white min-h-[100px]" value={formData.reason} onChange={e => setFormData({ ...formData, reason: e.target.value })} />
              </div>
            </div>
          ) : (
            <div className="flex flex-col gap-5">
              <div className="bg-blue-50 border border-blue-200 p-5 rounded-xl flex flex-col gap-2">
                <h4 className="font-bold text-blue-900 flex items-center gap-2"><Shield size={18} /> Substitution Engine</h4>
              </div>
              {classesReqSubstitution.length > 0 && (
                <div className="flex flex-col gap-3">
                  {groupedSubs.map((group, idx) => (
                    <div key={idx} className="border border-slate-200 rounded-xl bg-white shadow-sm overflow-hidden">
                      <div className="flex justify-between items-center p-4 bg-slate-50 border-b border-slate-100">
                          <div>
                            <div className="font-bold text-sm text-slate-800">{group.date} • Slot {group.slot}</div>
                            <div className="text-xs text-slate-500 font-medium mt-0.5">{group.subject} ({group.class})</div>
                          </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
        <div className="bg-slate-50 p-5 border-t border-slate-200 flex justify-between shrink-0">
          {step === 2 && <button onClick={() => setStep(1)} className="px-5 py-2.5 bg-white border border-slate-300 rounded-xl font-semibold">Back</button>}
          <button onClick={handleNext} className="ml-auto px-6 py-2.5 bg-blue-600 text-white rounded-xl font-bold flex items-center gap-2">
            {step === 1 && !((formData.type === 'Partial' || formData.type === 'Casual') && classesReqSubstitution.length === 0) ? <>Next Step <ChevronRight size={18} /></> : <>Submit Application <Check size={18} /></>}
          </button>
        </div>
      </div>
    </div>
  );
};

export const Dashboard = ({ user, allUsers, leaves, timetable, onLogout, onRequestLeave, onApproveLeave, onAcceptSubRequest, onForceAssign, addToast, refreshData }) => {
  const isAdmin = user.role?.toLowerCase() === 'admin';
  const isHod = user.role?.toLowerCase() === 'hod';
  const isAdminOrHod = isAdmin || isHod;

  const [showLeaveForm, setShowLeaveForm] = useState(false);
  const [currentView, setCurrentView] = useState(isAdmin ? 'admin_portal' : 'dashboard');

  const myLeaves = leaves.filter(l => l.userId === getUserId(user));
  const userId = getUserId(user);
  
  const pendingApprovals = isAdminOrHod ? leaves.filter(l => l.status === 'Pending') : [];

  const incomingSubRequests = leaves.flatMap(l => {
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
    <div className="flex h-screen w-screen bg-slate-50 overflow-hidden font-sans text-slate-800">
      <div className="w-72 bg-slate-900 flex flex-col shrink-0 h-full shadow-2xl relative z-20">
        <div className="p-6 border-b border-slate-800 flex items-center gap-3 text-white">
          <div className="bg-blue-600 p-2 rounded-xl shadow-inner shadow-blue-500/50"><Shield size={24} strokeWidth={2.5} /></div>
          <h1 className="font-extrabold text-xl tracking-tight">UniAdmin</h1>
        </div>
        
        <div className="flex-1 overflow-y-auto py-6 flex flex-col gap-6">
          <div className="px-6">
            <div className="bg-slate-800/80 border border-slate-700/50 p-4 rounded-2xl flex items-center gap-4">
              <div className="bg-slate-700 p-2.5 rounded-full text-slate-300 shrink-0"><User size={20} /></div>
              <div className="overflow-hidden">
                <div className="font-bold text-white text-sm truncate">{user.name}</div>
                <div className="text-xs text-blue-400 font-semibold mt-0.5 uppercase tracking-wide">{user.role}</div>
              </div>
            </div>
          </div>

          <nav className="flex flex-col gap-1.5 px-3">
            <div className="text-[0.65rem] font-bold text-slate-500 uppercase tracking-widest px-4 mb-2">Navigation</div>
            
            {!isAdmin && (
              <>
                <button onClick={() => setCurrentView('dashboard')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all font-medium text-sm ${currentView === 'dashboard' ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20' : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'}`}><BookOpen size={18} /> Dashboard</button>
                <button onClick={() => setCurrentView('timetable')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all font-medium text-sm ${currentView === 'timetable' ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20' : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'}`}><Calendar size={18} /> Master Timetable</button>
              </>
            )}

            {isAdminOrHod && (
              <button onClick={() => setCurrentView('faculty_overview')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all font-medium text-sm ${currentView === 'faculty_overview' ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20' : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'}`}><Users size={18} /> Faculty Status</button>
            )}
            
            {isAdmin && (
              <button onClick={() => setCurrentView('admin_portal')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all font-medium text-sm ${currentView === 'admin_portal' ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-600/20' : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'}`}><Shield size={18} /> Admin Settings</button>
            )}
          </nav>
        </div>

        <div className="p-4 border-t border-slate-800 shrink-0">
          <button onClick={onLogout} className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-rose-400 hover:bg-rose-500/10 hover:text-rose-300 transition-colors text-sm font-bold"><LogOut size={18} /> Sign Out</button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-6 md:p-10 relative">
        <div className="max-w-7xl mx-auto w-full flex flex-col gap-8 h-full">

          {currentView === 'admin_portal' && isAdmin ? (
            <AdminPortal addToast={addToast} allUsers={allUsers} timetable={timetable} refreshData={refreshData} />
          ) : currentView === 'timetable' ? (
            <TimetableView user={user} timetable={timetable} />
          ) : currentView === 'faculty_overview' ? (
            <FacultyOverview users={allUsers} leaves={leaves} />
          ) : (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
                <div className="bg-white border border-slate-200 p-6 rounded-3xl shadow-sm flex flex-col justify-center relative overflow-hidden">
                  <div className="absolute -right-4 -bottom-4 text-slate-100"><Calendar size={100} /></div>
                  <div className="relative z-10"><div className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">Casual Leave</div><div className="text-3xl font-extrabold text-slate-800">{user.leaveBalance?.casual || 0} <span className="text-base font-semibold text-slate-400">/ 12</span></div></div>
                </div>
                <div className="bg-white border border-slate-200 p-6 rounded-3xl shadow-sm flex flex-col justify-center relative overflow-hidden">
                  <div className="absolute -right-4 -bottom-4 text-rose-50"><CheckCircle size={100} /></div>
                  <div className="relative z-10"><div className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">Medical Leave</div><div className="text-3xl font-extrabold text-slate-800">{user.leaveBalance?.sick || 0} <span className="text-base font-semibold text-slate-400">/ 10</span></div></div>
                </div>
                <div className="bg-white border border-slate-200 p-6 rounded-3xl shadow-sm flex flex-col justify-center relative overflow-hidden">
                  <div className="absolute -right-4 -bottom-4 text-blue-50"><Shield size={100} /></div>
                  <div className="relative z-10"><div className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">Department</div><div className="text-lg font-bold text-blue-600 leading-tight pr-8">{user.department}</div></div>
                </div>
                <button onClick={() => setShowLeaveForm(true)} className="bg-blue-600 hover:bg-blue-700 text-white border border-blue-700 p-6 rounded-3xl shadow-md shadow-blue-600/20 flex flex-col items-center justify-center gap-3 transition-all active:scale-95 group">
                  <div className="bg-white/20 p-3 rounded-full group-hover:bg-white/30 transition-colors"><Calendar size={24} /></div>
                  <span className="text-lg font-bold">Apply Leave</span>
                </button>
              </div>

              {incomingSubRequests.length > 0 && (
                <div className="bg-white border border-amber-200 rounded-3xl shadow-sm overflow-hidden">
                  <div className="p-5 bg-amber-50 border-b border-amber-100 flex justify-between items-center">
                    <h3 className="m-0 text-amber-800 flex items-center font-bold gap-2"><AlertCircle size={20} /> Substitution Requests</h3>
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
                          <button onClick={() => onAcceptSubRequest(req.leaveId, req.slot, false)} className="px-4 py-2 border border-slate-300 text-slate-600 rounded-xl text-sm font-semibold hover:bg-slate-100 transition-colors">Decline</button>
                          <button onClick={() => onAcceptSubRequest(req.leaveId, req.slot, true)} className="px-4 py-2 bg-blue-600 text-white rounded-xl text-sm font-bold shadow-md shadow-blue-600/20 hover:bg-blue-700 transition-colors">Accept Class</button>
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
                            <td className="p-4 align-top"><div className="font-bold text-slate-800 text-sm">{l.userName}</div></td>
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
                                            {group.accepted ? <span className="font-bold text-sm text-emerald-700">{group.accepted.subName}</span> : <span className="text-xs font-semibold text-amber-600 bg-amber-100 px-2 py-0.5 rounded">Pending ({group.candidates.length} Notified)</span>}
                                         </div>
                                         {group.accepted && <StatusBadge status="Accepted" />}
                                      </div>
                                      {!group.accepted && (
                                        <div className="mt-2 border-t border-slate-200 pt-2">
                                           <ForceAssignSelector slot={group.slot} allUsers={findAvailableSubstitutes(group.date || l.date, group.slot, l.userId, allUsers, timetable, leaves)} onForceAssign={(slot, subId, subName) => onForceAssign(l._id, slot, subId, subName)} />
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
                        {pendingApprovals.length === 0 && <tr><td colSpan="4" className="text-center p-8 text-slate-400 font-medium italic">All caught up! No pending approvals.</td></tr>}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              <div className="bg-white border border-slate-200 rounded-3xl shadow-sm overflow-hidden mb-auto">
                <div className="p-6 border-b border-slate-100 bg-slate-50/50"><h3 className="m-0 font-bold text-slate-800 text-lg">My Leave History</h3></div>
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
                           if (!uniqueSlots[key]) uniqueSlots[key] = { date: s.date || l.date, slot: s.slot, accepted: null, pendingCount: 0, rejectedCount: 0 };
                           if (s.status === 'Accepted') uniqueSlots[key].accepted = s.subName;
                           else if (s.status === 'Pending') uniqueSlots[key].pendingCount++;
                           else if (s.status === 'Rejected') uniqueSlots[key].rejectedCount++;
                        });
                        const slotList = Object.values(uniqueSlots).sort((a,b) => a.date.localeCompare(b.date) || a.slot - b.slot);

                        return (
                          <tr key={l._id} className="hover:bg-slate-50/50 transition-colors">
                            <td className="p-4 align-top">
                              <div className="font-bold text-slate-800 text-sm mb-1">{l.date}</div>
                              <span className="inline-block px-2.5 py-0.5 bg-slate-100 border border-slate-200 text-slate-600 text-[0.65rem] font-bold uppercase rounded-full tracking-wide">{l.type}</span>
                            </td>
                            <td className="p-4 align-top"><p className="text-xs text-slate-600 max-w-xs">{l.reason}</p></td>
                            <td className="p-4 align-top">
                              {slotList.length === 0 ? (
                                <span className="px-3 py-1 bg-slate-100 text-slate-500 rounded-full text-xs font-semibold inline-flex items-center gap-1.5 border border-slate-200"><Check size={12} /> {['Casual', 'Partial'].includes(l.type) ? 'Not Required' : '-'}</span>
                              ) : (
                                <div className="flex flex-col gap-2">
                                   {slotList.map((slotInfo, idx) => (
                                      <div key={idx} className="flex items-center gap-2">
                                        <span className="bg-slate-100 text-slate-600 text-[0.65rem] font-bold px-1.5 py-0.5 rounded shadow-sm border border-slate-200">S{slotInfo.slot}</span>
                                        {slotInfo.accepted ? <span className="text-emerald-700 text-xs font-bold flex items-center gap-1"><CheckCircle size={12} className="shrink-0" /> {l.type === 'Medical' ? `${slotInfo.date} - ` : ''} {slotInfo.accepted}</span> : slotInfo.pendingCount > 0 ? <span className="text-amber-600 text-xs font-semibold flex items-center gap-1"><Clock size={12} className="shrink-0" /> {l.type === 'Medical' ? `${slotInfo.date} - ` : ''} Waiting ({slotInfo.pendingCount})</span> : <span className="text-rose-600 text-xs font-semibold flex items-center gap-1"><XCircle size={12} className="shrink-0" /> Cancelled/Rejected</span>}
                                      </div>
                                   ))}
                                </div>
                              )}
                            </td>
                            <td className="p-4 align-top text-right"><div className="flex justify-end"><StatusBadge status={l.status} /></div></td>
                          </tr>
                        );
                      })}
                      {myLeaves.length === 0 && <tr><td colSpan="4" className="text-center p-8 text-slate-400 font-medium italic">No leave history found.</td></tr>}
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