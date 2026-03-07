import { getDayName } from './dateUtils';

export const getUserId = (user) => user._id || user.id;

export const findAvailableSubstitutes = (dateStr, slot, originalUserId, allUsers, timetable, leaves) => {
  const dayName = getDayName(dateStr);

  const usersOnLeave = leaves
    .filter(l => l.date === dateStr && (l.status === 'Pending' || l.status === 'Approved'))
    .map(l => l.userId);

  const candidates = allUsers.filter(u => 
    getUserId(u) !== originalUserId && 
    !usersOnLeave.includes(getUserId(u))
  );

  const available = candidates.filter(candidate => {
    const hasClass = timetable.find(t => {
       const isUser = t.userId === getUserId(candidate);
       const isSlot = t.slot === slot;
       if (!isUser || !isSlot) return false;
       if (t.date) return t.date === dateStr; 
       return t.day === dayName;
    });
    return !hasClass;
  });

  return available;
};