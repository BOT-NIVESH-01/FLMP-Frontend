import React from 'react';
import { Grid } from 'lucide-react';
import { getUserId } from '../../utils/substitutionEngine';

export const TimetableView = ({ user, timetable }) => {
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
                  schedule.subject.startsWith('Sub:') 
                    ? 'bg-emerald-200 text-emerald-900' 
                    : 'bg-blue-200 text-blue-900'
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
                
                <th className="w-28 min-w-[7rem] p-1.5 border-r border-slate-200 text-center">
                  <div className="text-[0.65rem] font-extrabold text-slate-700">Slot 1</div>
                  <div className="text-[0.55rem] font-medium text-slate-500 mt-0.5">08:00-08:50</div>
                </th>
                
                <th className="w-8 min-w-[2rem] bg-slate-50 border-r border-slate-200 p-1 align-middle text-center"><div className="mx-auto text-[0.5rem] text-slate-400 font-bold uppercase tracking-widest" style={{ writingMode: 'vertical-rl', transform: 'rotate(180deg)' }}>Break</div></th>
                
                <th className="w-28 min-w-[7rem] p-1.5 border-r border-slate-200 text-center">
                  <div className="text-[0.65rem] font-extrabold text-slate-700">Slot 2</div>
                  <div className="text-[0.55rem] font-medium text-slate-500 mt-0.5">09:10-10:00</div>
                </th>
                
                <th className="w-28 min-w-[7rem] p-1.5 border-r border-slate-200 text-center">
                  <div className="text-[0.65rem] font-extrabold text-slate-700">Slot 3</div>
                  <div className="text-[0.55rem] font-medium text-slate-500 mt-0.5">10:00-10:50</div>
                </th>
                
                <th className="w-8 min-w-[2rem] bg-slate-50 border-r border-slate-200 p-1 align-middle text-center"><div className="mx-auto text-[0.5rem] text-slate-400 font-bold uppercase tracking-widest" style={{ writingMode: 'vertical-rl', transform: 'rotate(180deg)' }}>Break</div></th>
                
                <th className="w-28 min-w-[7rem] p-1.5 border-r border-slate-200 text-center">
                  <div className="text-[0.65rem] font-extrabold text-slate-700">Slot 4</div>
                  <div className="text-[0.55rem] font-medium text-slate-500 mt-0.5">11:10-12:00</div>
                </th>
                
                <th className="w-28 min-w-[7rem] p-1.5 border-r border-slate-200 text-center">
                  <div className="text-[0.65rem] font-extrabold text-slate-700">Slot 5</div>
                  <div className="text-[0.55rem] font-medium text-slate-500 mt-0.5">12:00-12:50</div>
                </th>
                
                <th className="w-8 min-w-[2rem] bg-slate-50 border-r border-slate-200 p-1 align-middle text-center"><div className="mx-auto text-[0.5rem] text-slate-400 font-bold uppercase tracking-widest" style={{ writingMode: 'vertical-rl', transform: 'rotate(180deg)' }}>Lunch</div></th>
                
                <th className="w-28 min-w-[7rem] p-1.5 border-r border-slate-200 text-center">
                  <div className="text-[0.65rem] font-extrabold text-slate-700">Slot 6</div>
                  <div className="text-[0.55rem] font-medium text-slate-500 mt-0.5">01:40-02:30</div>
                </th>
                
                <th className="w-28 min-w-[7rem] p-1.5 border-r border-slate-200 text-center">
                  <div className="text-[0.65rem] font-extrabold text-slate-700">Slot 7</div>
                  <div className="text-[0.55rem] font-medium text-slate-500 mt-0.5">02:30-03:20</div>
                </th>
                
                <th className="w-28 min-w-[7rem] p-1.5 border-r border-slate-200 text-center">
                  <div className="text-[0.65rem] font-extrabold text-slate-700">Slot 8</div>
                  <div className="text-[0.55rem] font-medium text-slate-500 mt-0.5">03:20-04:10</div>
                </th>
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