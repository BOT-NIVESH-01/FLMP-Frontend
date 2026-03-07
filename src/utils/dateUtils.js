export const getDayName = (dateStr) => {
  if (!dateStr) return '';
  const date = new Date(dateStr + 'T12:00:00');
  return date.toLocaleDateString('en-US', { weekday: 'long' });
};

export const getDatesInRange = (startDate, endDate) => {
  const dates = [];
  const currDate = new Date(startDate + 'T12:00:00');
  const lastDate = new Date(endDate + 'T12:00:00');
  
  while (currDate <= lastDate) {
    dates.push(currDate.toISOString().split('T')[0]);
    currDate.setDate(currDate.getDate() + 1);
  }
  return dates;
};