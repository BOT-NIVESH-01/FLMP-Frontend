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
      <td key={slot.id} className="border-r border-[#0A4D9C]/20 p-2 align-middle h-20 w-32 min-w-[8rem] bg-white transition-all hover:bg-[#F4F7FB] hover:shadow-md">
        {schedule ? (
          <div className={`h-full w-full rounded-lg p-2 flex flex-col justify-center items-center text-center border-2 shadow-sm transition-all hover:shadow-md ${
            schedule.subject.startsWith('Sub:')
              ? 'bg-[#E8FAF1] border-[#228B22]/50'
              : 'bg-[#EBF4FF] border-[#0A4D9C]/50'
          }`}>
            <div className={`font-bold text-[0.75rem] leading-tight line-clamp-2 ${
              schedule.subject.startsWith('Sub:') ? 'text-[#1a6b1a]' : 'text-[#0A4D9C]'
            }`}>
              {schedule.subject}
            </div>
            <div className="mt-1">
                <span className={`px-2 py-0.5 rounded-md text-[0.6rem] font-bold shadow-sm ${
                  schedule.subject.startsWith('Sub:')
                    ? 'bg-[#228B22] text-white'
                    : 'bg-[#0A4D9C] text-white'
                }`}>
                  {schedule.class}
                </span>
            </div>
          </div>
        ) : (
          <div className="h-full w-full rounded-lg flex flex-col items-center justify-center text-[#999999] text-[0.7rem] uppercase tracking-wider font-bold border-2 border-dashed border-[#E0E0E0] bg-[#F8FAFC] hover:border-[#0A4D9C]/30 hover:bg-[#F4F7FB]">
            Free
          </div>
        )}
      </td>
    );
  };

  const renderBreak = (label) => (
    <td className="bg-[#F4F7FB] border-r border-[#E0E0E0] w-8 min-w-[2rem] p-0 align-middle">
      <div className="mx-auto text-[0.55rem] text-[#666666] font-bold uppercase tracking-widest flex items-center justify-center h-full" style={{ writingMode: 'vertical-rl', transform: 'rotate(180deg)' }}>
        {label}
      </div>
    </td>
  );

  return (
    <div className="bg-white border border-[#E0E0E0] rounded-3xl shadow-soft flex flex-col overflow-hidden mb-auto">
      <div className="p-4 border-b border-[#E0E0E0] flex justify-between items-center bg-gradient-to-r from-[#F4F7FB] to-white shrink-0">
        <div>
          <h2 className="text-lg font-extrabold text-[#0A4D9C]">My Weekly Timetable</h2>
          <p className="text-xs text-[#666666] font-medium mt-0.5">Academic Year 2023-2024</p>
        </div>
        <div className="bg-white border border-[#E0E0E0] text-[#0A4D9C] p-2 rounded-xl shadow-soft">
          <Grid size={20} />
        </div>
      </div>

      <div className="p-4 overflow-x-auto bg-white flex-1">
        <div className="border border-[#E0E0E0] rounded-xl shadow-soft bg-white overflow-hidden w-max mx-auto">
          <table className="w-max border-collapse text-left">
            <thead>
              <tr className="bg-gradient-to-r from-[#0A4D9C] to-[#1E73BE] border-b border-[#0A4D9C]/30">
                <th className="w-24 min-w-[6rem] p-3 font-extrabold text-white text-sm border-r border-white/20 text-center sticky left-0 z-20 bg-gradient-to-r from-[#0A4D9C] to-[#1E73BE] shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)]">Day</th>

                <th className="w-32 min-w-[8rem] p-2 border-r border-white/20 text-center">
                  <div className="text-[0.75rem] font-extrabold text-white">Slot 1</div>
                  <div className="text-[0.6rem] font-medium text-white/80 mt-0.5">08:00-08:50</div>
                </th>

                <th className="w-10 min-w-[2.5rem] bg-gradient-to-r from-[#0A4D9C]/10 to-[#1E73BE]/10 border-r border-[#E0E0E0] p-1 align-middle text-center"><div className="mx-auto text-[0.55rem] text-[#0A4D9C] font-bold uppercase tracking-widest" style={{ writingMode: 'vertical-rl', transform: 'rotate(180deg)' }}>Break</div></th>

                <th className="w-32 min-w-[8rem] p-2 border-r border-white/20 text-center">
                  <div className="text-[0.75rem] font-extrabold text-white">Slot 2</div>
                  <div className="text-[0.6rem] font-medium text-white/80 mt-0.5">09:10-10:00</div>
                </th>

                <th className="w-32 min-w-[8rem] p-2 border-r border-white/20 text-center">
                  <div className="text-[0.75rem] font-extrabold text-white">Slot 3</div>
                  <div className="text-[0.6rem] font-medium text-white/80 mt-0.5">10:00-10:50</div>
                </th>
                <th className="w-10 min-w-[2.5rem] bg-gradient-to-r from-[#0A4D9C]/10 to-[#1E73BE]/10 border-r border-[#E0E0E0] p-1 align-middle text-center"><div className="mx-auto text-[0.55rem] text-[#0A4D9C] font-bold uppercase tracking-widest" style={{ writingMode: 'vertical-rl', transform: 'rotate(180deg)' }}>Break</div></th>

                <th className="w-32 min-w-[8rem] p-2 border-r border-white/20 text-center">
                  <div className="text-[0.75rem] font-extrabold text-white">Slot 4</div>
                  <div className="text-[0.6rem] font-medium text-white/80 mt-0.5">11:10-12:00</div>
                </th>

                <th className="w-32 min-w-[8rem] p-2 border-r border-white/20 text-center">
                  <div className="text-[0.75rem] font-extrabold text-white">Slot 5</div>
                  <div className="text-[0.6rem] font-medium text-white/80 mt-0.5">12:00-12:50</div>
                </th>

                <th className="w-10 min-w-[2.5rem] bg-gradient-to-r from-[#0A4D9C]/10 to-[#1E73BE]/10 border-r border-[#E0E0E0] p-1 align-middle text-center"><div className="mx-auto text-[0.55rem] text-[#0A4D9C] font-bold uppercase tracking-widest" style={{ writingMode: 'vertical-rl', transform: 'rotate(180deg)' }}>Lunch</div></th>

                <th className="w-32 min-w-[8rem] p-2 border-r border-white/20 text-center">
                  <div className="text-[0.75rem] font-extrabold text-white">Slot 6</div>
                  <div className="text-[0.6rem] font-medium text-white/80 mt-0.5">01:40-02:30</div>
                </th>

                <th className="w-32 min-w-[8rem] p-2 border-r border-white/20 text-center">
                  <div className="text-[0.75rem] font-extrabold text-white">Slot 7</div>
                  <div className="text-[0.6rem] font-medium text-white/80 mt-0.5">02:30-03:20</div>
                </th>

                <th className="w-32 min-w-[8rem] p-2 border-r border-white/20 text-center">
                  <div className="text-[0.75rem] font-extrabold text-white">Slot 8</div>
                  <div className="text-[0.6rem] font-medium text-white/80 mt-0.5">03:20-04:10</div>
                </th>
              </tr>
            </thead>
            <tbody>
              {days.map((day, idx) => (
                <tr key={day} className="border-b border-[#E0E0E0] last:border-b-0">
                  <td className="w-20 min-w-[5rem] p-2 font-bold text-[#0A4D9C] text-xs border-r border-[#E0E0E0] text-center bg-[#F4F7FB] sticky left-0 z-10 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.05)]">{day}</td>
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