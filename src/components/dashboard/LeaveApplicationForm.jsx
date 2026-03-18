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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm font-sans">
      <div className="bg-white rounded-[2rem] shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden animate-[slideIn_0.2s_ease-out]">
        
        <div className="bg-gradient-to-r from-[#0A4D9C] to-[#1E73BE] px-6 py-5 flex justify-between items-center text-white shrink-0">
          <div>
             <h3 className="text-xl font-bold">Apply for Leave</h3>
             <p className="text-white/80 text-xs font-medium mt-1">Step {step} of {((formData.type === 'Partial' || formData.type === 'Casual') && classesReqSubstitution.length === 0) ? '1' : '2'}</p>
          </div>
          <button onClick={onClose} className="p-2 bg-white/10 hover:bg-white/20 rounded-full transition-colors">
            <X size={20} />
          </button>
        </div>

        <div className="p-6 overflow-y-auto flex-1 bg-white">
          {step === 1 ? (
            <div className="flex flex-col gap-5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div className="flex flex-col gap-1.5">
                  <label className="text-sm font-semibold text-[#0A4D9C] pl-1">Leave Type</label>
                  <select
                    className="border border-[#E0E0E0] rounded-xl px-4 py-2.5 text-sm text-[#1A1A1A] focus:outline-none focus:ring-2 focus:ring-[#0A4D9C]/30 focus:border-[#0A4D9C] bg-white shadow-soft"
                    value={formData.type}
                    onChange={e => setFormData({ ...formData, type: e.target.value })}
                  >
                    <option>Casual</option>
                    <option>Medical</option>
                    <option>Partial</option>
                  </select>
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-sm font-semibold text-[#0A4D9C] pl-1">Start Date</label>
                  <input
                    type="date"
                    className="border border-[#E0E0E0] rounded-xl px-4 py-2.5 text-sm text-[#1A1A1A] focus:outline-none focus:ring-2 focus:ring-[#0A4D9C]/30 focus:border-[#0A4D9C] bg-white shadow-soft"
                    value={formData.date}
                    onChange={e => setFormData({ ...formData, date: e.target.value })}
                  />
                </div>
              </div>

              {formData.type === 'Medical' && (
                <div className="flex flex-col gap-1.5 animate-[slideIn_0.2s_ease-out]">
                  <label className="text-sm font-semibold text-[#0A4D9C] pl-1">End Date <span className="text-[#666666] font-normal">(Min 10 days)</span></label>
                  <input
                    type="date"
                    className="border border-[#E0E0E0] rounded-xl px-4 py-2.5 text-sm text-[#1A1A1A] focus:outline-none focus:ring-2 focus:ring-[#0A4D9C]/30 focus:border-[#0A4D9C] bg-white shadow-soft"
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
                <label className="text-sm font-semibold text-[#0A4D9C] pl-1">Reason</label>
                <textarea
                  className="border border-[#E0E0E0] rounded-xl px-4 py-3 text-sm text-[#1A1A1A] placeholder:text-[#999999] focus:outline-none focus:ring-2 focus:ring-[#0A4D9C]/30 focus:border-[#0A4D9C] bg-white shadow-soft min-h-[100px] resize-y"
                  placeholder="Please provide a brief reason..."
                  value={formData.reason}
                  onChange={e => setFormData({ ...formData, reason: e.target.value })}
                />
              </div>

              {formData.type === 'Partial' && formData.date && formData.startTime && formData.endTime && (
                 <div className={`p-4 rounded-xl border ${classesReqSubstitution.length > 0 ? 'bg-[#FFF1E6] border-[#F7E4D1] text-[#CC4A21]' : 'bg-[#F0FDF4] border-[#D5F4CF] text-[#228B22]'} flex items-start gap-3`}>
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
                <div className="bg-white border border-[#E0E0E0] p-5 rounded-xl shadow-soft">
                  <h4 className="text-sm font-bold text-[#0A4D9C] mb-2">Impacted Classes:</h4>
                  <p className="text-sm text-[#475569] flex items-center gap-2">
                    <BookOpen size={16} className="text-[#0A4D9C]" />
                    <strong>{classesReqSubstitution.length}</strong> slots require substitution.
                  </p>
                </div>
              )}
            </div>
          ) : (
            <div className="flex flex-col gap-5">
              <div className="bg-[#F4F7FB] border border-[#D0E2F7] p-5 rounded-xl flex flex-col gap-2">
                <h4 className="font-bold text-[#0A4D9C] flex items-center gap-2">
                   <Shield size={18} /> Smart Substitution Engine
                </h4>
                {classesReqSubstitution.length === 0 ? (
                    <p className="text-[#228B22] text-sm font-medium">
                      No classes overlap with your leave. No substitutes required.
                    </p>
                ) : (
                    <p className="text-[#1E73BE] text-sm">
                      Requests will be automatically broadcast to <b>all available faculty</b> for each slot. First to accept will be assigned.
                    </p>
                )}
                {formData.type === 'Medical' && (
                  <p className="text-[#CC4A21] text-xs font-bold bg-[#FFF4F0] p-2 rounded mt-1 border border-[#FDD7C8]">
                    * Medical Leave: You may submit even if no faculty is currently available.
                  </p>
                )}
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
                          <span className="bg-[#F4F7FB] text-[#0A4D9C] text-xs font-bold px-2.5 py-1 rounded-full border border-[#D0E2F7]">
                            {group.candidates.length} Candidate(s)
                          </span>
                      </div>
                      
                      <div className="p-4 bg-white">
                        <strong className="text-xs text-[#666666] uppercase tracking-wider mb-2 block">Auto-selected Broadcastees:</strong>
                        <div className="flex flex-wrap gap-2">
                          {group.candidates.map((sub, i) => (
                            <span key={i} className="bg-[#F4F7FB] text-[#0A4D9C] text-xs font-semibold px-3 py-1.5 rounded-lg border border-[#D0E2F7]">
                               {sub.subName}
                            </span>
                          ))}
                        </div>
                        {group.candidates[0].subId === null && (
                           <span className="text-[#CD5C5C] text-sm font-medium flex items-center gap-1.5 bg-[#FFF4F0] p-2 rounded-lg border border-[#FDD7C8] mt-2">
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

        <div className="bg-[#F4F7FB] p-5 border-t border-[#E0E0E0] flex justify-between shrink-0">
          {step === 2 && (
            <button onClick={() => setStep(1)} className="px-5 py-2.5 bg-white border border-[#E0E0E0] text-slate-700 rounded-xl font-semibold hover:bg-[#F4F7FB] transition-colors shadow-sm">
              Back
            </button>
          )}
          <button 
            onClick={handleNext} 
            className="ml-auto px-6 py-2.5 bg-gradient-to-r from-[#0A4D9C] to-[#1E73BE] text-white rounded-xl font-bold hover:from-[#0A3A7A] hover:to-[#1A5FA0] transition-colors shadow-md shadow-[#0A4D9C]/20 flex items-center gap-2"
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