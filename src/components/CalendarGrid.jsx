import { useMemo } from 'react';
import { addDays, format, startOfMonth, endOfMonth, startOfWeek, endOfWeek, isSameMonth, isSameDay, parseISO } from 'date-fns';

const DOTS = ['bg-sky-300', 'bg-violet-400', 'bg-emerald-400'];

export default function CalendarGrid({ monthDate, selected, shifts, onSelect }) {
  const start = startOfWeek(startOfMonth(monthDate), { weekStartsOn: 0 });
  const end = endOfWeek(endOfMonth(monthDate), { weekStartsOn: 0 });

  const days = useMemo(() => {
    const arr = [];
    let d = start;
    while (d <= end) { arr.push(d); d = addDays(d, 1); }
    return arr;
  }, [start, end]);

  const shiftsByDate = useMemo(() => {
    const map = {};
    shifts.forEach((s) => {
      const key = format(parseISO(s.date), 'yyyy-MM-dd');
      (map[key] ||= []).push(s);
    });
    return map;
  }, [shifts]);

  const today = new Date();
  const headers = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

  return (
    <div>
      <div className="grid grid-cols-7 mb-2">
        {headers.map((h, i) => (
          <div key={i} className="text-center text-xs font-medium text-neutral-400">{h}</div>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-y-2">
        {days.map((d) => {
          const key = format(d, 'yyyy-MM-dd');
          const inMonth = isSameMonth(d, monthDate);
          const isToday = isSameDay(d, today);
          const isSelected = selected && isSameDay(d, selected);
          const dayShifts = shiftsByDate[key] || [];
          const dotColor = dayShifts.length
            ? DOTS[dayShifts.length % DOTS.length]
            : null;
          return (
            <button
              key={key}
              onClick={() => onSelect(d)}
              className="flex flex-col items-center justify-center gap-1 py-1"
            >
              <span
                className={`flex items-center justify-center w-8 h-8 rounded-full text-sm transition-colors ${
                  isSelected
                    ? 'bg-black text-white'
                    : isToday
                    ? 'bg-red-500 text-white'
                    : inMonth
                    ? 'text-black'
                    : 'text-neutral-300'
                }`}
              >
                {format(d, 'd')}
              </span>
              {dotColor && (
                <span className={`w-1.5 h-1.5 rounded-full ${dotColor}`} />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}