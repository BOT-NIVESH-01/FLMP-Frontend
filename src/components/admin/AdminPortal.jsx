import React, { useState } from 'react';
import axios from 'axios';
import { UserPlus, Edit, Plus, Trash2, Save, Loader, Shield, AlertOctagon } from 'lucide-react';
import { API_URL } from '../../config';

export const AdminPortal = ({ addToast, allUsers, timetable, refreshData }) => {
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

      // FIX: Ensure API route includes /data
      const userRes = await axios.post(`${API_URL}/data/admin/users`, userDetails, config);
      const newUserId = userRes.data._id || userRes.data.id;

      if (timetableEntries.length > 0) {
        const payload = timetableEntries.map(entry => ({ ...entry, userId: newUserId }));
        // FIX: Ensure API route includes /data
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
      // FIX: Ensure API route includes /data
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
      // FIX: Ensure API route includes /data
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
      // FIX: Ensure API route includes /data
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