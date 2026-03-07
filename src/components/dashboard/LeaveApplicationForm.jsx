import React, { useState, useMemo } from 'react';
import { X, AlertCircle, CheckCircle, BookOpen, Shield, ChevronRight, Check } from 'lucide-react';
import { TimePicker } from '../common/TimePicker';
import { getDayName, getDatesInRange } from '../../utils/dateUtils';
import { timeStrToMinutes, SLOT_TIMES } from '../../utils/timeUtils';
import { findAvailableSubstitutes, getUserId } from '../../utils/substitutionEngine';

export const LeaveApplicationForm = ({ user, allUsers, onClose, onSubmit, addToast, timetable, leaves }) => {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    type: 'Casual',
    date: '',
    endDate: '', 
    reason: '',
    substitutions: [],
    startTime: '08:00',
    startTimePeriod: 'AM',
    endTime: '10:00',
    endTimePeriod: 'AM'
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

        if (includeClass) {
          classes.push({ ...cls, date: dateStr, displayDate: dateStr });
        }
      });
    });
    return classes;
  }, [formData.date, formData.endDate, formData.type, formData.startTime, formData.startTimePeriod, formData.endTime, formData.endTimePeriod, user, timetable]);

  const handleNext = () => {
    if (step === 1) {
      if (!formData.date || !formData.reason) {
        addToast("Please fill all fields to proceed", "error");
        return;
      }

      if (formData.type === 'Medical') {
        if (!formData.endDate) {
          addToast("End Date is required for Medical Leave", "error");
          return;
        }
        const start = new Date(formData.date);
        const end = new Date(formData.endDate);
        const diffDays = Math.ceil(Math.abs(end - start) / (1000 * 60 * 60 * 24)) + 1;

        if (diffDays < 10) {
          addToast("Medical leave must be at least 10 days.", "error");
          return;
        }
      }

      if (formData.type === 'Partial') {
         if (!formData.startTime || !formData.endTime) {
           addToast("Start and End time required for Partial Leave", "error");
           return;
         }
      }

      if ((formData.type === 'Partial' || formData.type === 'Casual') && classesReqSubstitution.length === 0) {
          const finalData = {
              ...formData,
              startTime: formData.type === 'Partial' ? `${formData.startTime} ${formData.startTimePeriod}` : undefined,
              endTime: formData.type === 'Partial' ? `${formData.endTime} ${formData.endTimePeriod}` : undefined,
              substitutions: [] 
          };
          onSubmit(finalData);
          return; 
      }

      const generatedSubs = [];
      classesReqSubstitution.forEach(cls => {
        const available = findAvailableSubstitutes(cls.date, cls.slot, getUserId(user), allUsers, timetable, leaves);
        
        if (available.length > 0) {
          available.forEach(u => {
            generatedSubs.push({
              date: cls.date,
              slot: cls.slot,
              subject: cls.subject,
              class: cls.class,
              subId: getUserId(u),
              subName: u.name
            });
          });
        } else {
          generatedSubs.push({
             date: cls.date,
             slot: cls.slot,
             subject: cls.subject,
             class: cls.class,
             subId: null,
             subName: 'No Faculty Available'
          });
        }
      });
      
      setFormData(prev => ({ ...prev, substitutions: generatedSubs }));
      setStep(2);
    } else {
      const hasMissingSubs = formData.substitutions.some(s => !s.subId);
      const isExempt = formData.type === 'Medical' || (formData.type === 'Partial' && classesReqSubstitution.length === 0);

      if (!isExempt && hasMissingSubs) {
        addToast("Cannot submit: No substitutes available for some classes.", "error");
        return;
      }

      const finalData = {
        ...formData,
        startTime: formData.type === 'Partial' ? `${formData.startTime} ${formData.startTimePeriod}` : undefined,
        endTime: formData.type === 'Partial' ? `${formData.endTime} ${formData.endTimePeriod}` : undefined,
        substitutions: formData.substitutions.map(s => ({
          ...s,
          subId: s.subId || null,
          subName: s.subName || 'Unassigned'
        }))
      };

      onSubmit(finalData);
    }
  };

  const groupedSubs = useMemo(() => {
    const groups = {};
    formData.substitutions.forEach(sub => {
      const key = `${sub.date}-${sub.slot}`; 
      if (!groups[key]) {
        groups[key] = {
           date: sub.date,
           slot: sub.slot,
           subject: sub.subject,
           class: sub.class,
           candidates: []
        };
      }
      groups[key].candidates.push(sub);
    });
    return Object.values(groups).sort((a, b) => a.date.localeCompare(b.date) || a.slot - b.slot);
  }, [formData.substitutions]);
  
  const handleTimeChange = (field, key, value) => {
    setFormData(prev => ({
      ...prev,
      [key === 'time' ? field : field + 'Period']: value
    }));
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm font-sans">
      <div className="bg-white rounded-[2rem] shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden animate-[slideIn_0.2s_ease-out]">
        
        <div className="bg-blue-600 px-6 py-5 flex justify-between items-center text-white shrink-0">
          <div>
             <h3 className="text-xl font-bold">Apply for Leave</h3>
             <p className="text-blue-200 text-xs font-medium mt-1">Step {step} of {((formData.type === 'Partial' || formData.type === 'Casual') && classesReqSubstitution.length === 0) ? '1' : '2'}</p>
          </div>
          <button onClick={onClose} className="p-2 bg-white/10 hover:bg-white/20 rounded-full transition-colors">
            <X size={20} />
          </button>
        </div>

        <div className="p-6 overflow-y-auto flex-1 bg-slate-50/50">
          {step === 1 ? (
            <div className="flex flex-col gap-5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div className="flex flex-col gap-1.5">
                  <label className="text-sm font-semibold text-slate-700 pl-1">Leave Type</label>
                  <select
                    className="border border-slate-300 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white shadow-sm"
                    value={formData.type}
                    onChange={e => setFormData({ ...formData, type: e.target.value })}
                  >
                    <option>Casual</option>
                    <option>Medical</option>
                    <option>Partial</option>
                  </select>
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-sm font-semibold text-slate-700 pl-1">Start Date</label>
                  <input
                    type="date"
                    className="border border-slate-300 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white shadow-sm"
                    value={formData.date}
                    onChange={e => setFormData({ ...formData, date: e.target.value })}
                  />
                </div>
              </div>

              {formData.type === 'Medical' && (
                <div className="flex flex-col gap-1.5 animate-[slideIn_0.2s_ease-out]">
                  <label className="text-sm font-semibold text-slate-700 pl-1">End Date <span className="text-slate-400 font-normal">(Min 10 days)</span></label>
                  <input
                    type="date"
                    className="border border-slate-300 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white shadow-sm"
                    value={formData.endDate}
                    onChange={e => setFormData({ ...formData, endDate: e.target.value })}
                  />
                </div>
              )}

              {formData.type === 'Partial' && (
                 <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 animate-[slideIn_0.2s_ease-out]">
                   <TimePicker 
                     label="Start Time" 
                     value={formData.startTime} 
                     period={formData.startTimePeriod} 
                     onChange={(key, val) => handleTimeChange('startTime', key, val)} 
                   />
                   <TimePicker 
                     label="End Time" 
                     value={formData.endTime} 
                     period={formData.endTimePeriod} 
                     onChange={(key, val) => handleTimeChange('endTime', key, val)} 
                   />
                 </div>
              )}

              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-semibold text-slate-700 pl-1">Reason</label>
                <textarea
                  className="border border-slate-300 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white shadow-sm min-h-[100px] resize-y"
                  placeholder="Please provide a brief reason..."
                  value={formData.reason}
                  onChange={e => setFormData({ ...formData, reason: e.target.value })}
                />
              </div>

              {formData.type === 'Partial' && formData.date && formData.startTime && formData.endTime && (
                 <div className={`p-4 rounded-xl border ${classesReqSubstitution.length > 0 ? 'bg-amber-50 border-amber-200 text-amber-800' : 'bg-emerald-50 border-emerald-200 text-emerald-800'} flex items-start gap-3`}>
                    {classesReqSubstitution.length > 0 ? <AlertCircle size={20} className="shrink-0 mt-0.5" /> : <CheckCircle size={20} className="shrink-0 mt-0.5" />}
                    <span className="text-sm font-medium">
                      {classesReqSubstitution.length > 0 
                        ? `${classesReqSubstitution.length} classes overlap with this time frame.`
                        : "No classes clash with this time. You can proceed without substitutions."
                      }
                    </span>
                 </div>
              )}

              {classesReqSubstitution.length > 0 && formData.type !== 'Partial' && (
                <div className="bg-white border border-slate-200 p-5 rounded-xl shadow-sm">
                  <h4 className="text-sm font-bold text-slate-800 mb-2">Impacted Classes:</h4>
                  <p className="text-sm text-slate-600 flex items-center gap-2">
                    <BookOpen size={16} className="text-blue-500" />
                    <strong>{classesReqSubstitution.length}</strong> slots require substitution.
                  </p>
                </div>
              )}
            </div>
          ) : (
            <div className="flex flex-col gap-5">
              <div className="bg-blue-50 border border-blue-200 p-5 rounded-xl flex flex-col gap-2">
                <h4 className="font-bold text-blue-900 flex items-center gap-2">
                   <Shield size={18} /> Smart Substitution Engine
                </h4>
                {classesReqSubstitution.length === 0 ? (
                    <p className="text-emerald-700 text-sm font-medium">
                      No classes overlap with your leave. No substitutes required.
                    </p>
                ) : (
                    <p className="text-blue-800 text-sm">
                      Requests will be automatically broadcast to <b>all available faculty</b> for each slot. First to accept will be assigned.
                    </p>
                )}
                {formData.type === 'Medical' && (
                  <p className="text-amber-700 text-xs font-bold bg-amber-100/50 p-2 rounded mt-1 border border-amber-200">
                    * Medical Leave: You may submit even if no faculty is currently available.
                  </p>
                )}
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
                          <span className="bg-blue-100 text-blue-800 text-xs font-bold px-2.5 py-1 rounded-full border border-blue-200">
                            {group.candidates.length} Candidate(s)
                          </span>
                      </div>
                      
                      <div className="p-4 bg-white">
                        <strong className="text-xs text-slate-500 uppercase tracking-wider mb-2 block">Auto-selected Broadcastees:</strong>
                        <div className="flex flex-wrap gap-2">
                          {group.candidates.map((sub, i) => (
                            <span key={i} className="bg-slate-100 text-slate-700 text-xs font-semibold px-3 py-1.5 rounded-lg border border-slate-200">
                               {sub.subName}
                            </span>
                          ))}
                        </div>
                        {group.candidates[0].subId === null && (
                           <span className="text-rose-600 text-sm font-medium flex items-center gap-1.5 bg-rose-50 p-2 rounded-lg border border-rose-100 mt-2">
                              <AlertCircle size={14} /> No faculty available for this slot.
                           </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        <div className="bg-slate-50 p-5 border-t border-slate-200 flex justify-between shrink-0">
          {step === 2 && (
            <button onClick={() => setStep(1)} className="px-5 py-2.5 bg-white border border-slate-300 text-slate-700 rounded-xl font-semibold hover:bg-slate-50 transition-colors shadow-sm">
              Back
            </button>
          )}
          <button 
            onClick={handleNext} 
            className="ml-auto px-6 py-2.5 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 transition-colors shadow-md shadow-blue-600/20 flex items-center gap-2"
          >
            {step === 1 && !((formData.type === 'Partial' || formData.type === 'Casual') && classesReqSubstitution.length === 0) ? (
              <>Next Step <ChevronRight size={18} /></>
            ) : (
              <>Submit Application <Check size={18} /></>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};