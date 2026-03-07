export const SLOT_TIMES = {
  1: { start: 8 * 60, end: 8 * 60 + 50 },       // 08:00 - 08:50
  2: { start: 9 * 60 + 10, end: 10 * 60 },      // 09:10 - 10:00
  3: { start: 10 * 60, end: 10 * 60 + 50 },     // 10:00 - 10:50
  4: { start: 11 * 60 + 10, end: 12 * 60 },     // 11:10 - 12:00
  5: { start: 12 * 60, end: 12 * 60 + 50 },     // 12:00 - 12:50
  6: { start: 13 * 60 + 40, end: 14 * 60 + 30 }, // 13:40 - 14:30
  7: { start: 14 * 60 + 30, end: 15 * 60 + 20 }, // 14:30 - 15:20
  8: { start: 15 * 60 + 20, end: 16 * 60 + 10 }, // 15:20 - 16:10
};

export const timeStrToMinutes = (timeStr, period) => {
  if (!timeStr) return 0;
  let [h, m] = timeStr.split(':').map(Number);
  
  if (period === 'PM' && h !== 12) h += 12;
  if (period === 'AM' && h === 12) h = 0;
  
  return h * 60 + m;
};