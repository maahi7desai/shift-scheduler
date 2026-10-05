import { startOfWeek, addDays, format } from 'date-fns';

// day_of_week is stored as 0=Monday .. 6=Sunday (week starts Monday)
export const DAY_NAMES = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

export function getWeekStart(date = new Date()) {
  return startOfWeek(date, { weekStartsOn: 1 });
}

export function weekDates(weekStart) {
  return Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));
}

export function fmtDate(d) {
  return format(d, 'yyyy-MM-dd');
}

export function fmtDayLabel(d) {
  return format(d, 'EEE');
}

export function fmtDayNum(d) {
  return format(d, 'MMM d');
}

export function formatTime(hhmm) {
  if (!hhmm) return '';
  const [h, m] = hhmm.split(':').map(Number);
  const period = h >= 12 ? 'PM' : 'AM';
  const hr = h % 12 === 0 ? 12 : h % 12;
  return `${hr}:${String(m).padStart(2, '0')} ${period}`;
}