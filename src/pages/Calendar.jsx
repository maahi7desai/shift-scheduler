import { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useAuth } from '@/lib/AuthContext';
import { ChevronLeft, ChevronRight, Search, Plus, CalendarDays, Star } from 'lucide-react';
import CalendarGrid from '@/components/CalendarGrid';
import { format, parseISO } from 'date-fns';

export default function Calendar() {
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';
  const [monthDate, setMonthDate] = useState(new Date());
  const [selected, setSelected] = useState(new Date());
  const [shifts, setShifts] = useState([]);

  const load = async () => {
    const start = format(new Date(monthDate.getFullYear(), monthDate.getMonth(), 1), 'yyyy-MM-dd');
    const end = format(new Date(monthDate.getFullYear(), monthDate.getMonth() + 1, 0), 'yyyy-MM-dd');
    const query = isAdmin
      ? { date: { $gte: start, $lte: end } }
      : { employee_email: user?.email, date: { $gte: start, $lte: end } };
    const { items } = await base44.entities.Shift.filter(query, { sort: 'date', limit: 200 });
    setShifts(items);
  };

  useEffect(() => { load(); }, [monthDate, user]);

  const selectedKey = format(selected, 'yyyy-MM-dd');
  const dayShifts = shifts.filter((s) => s.date === selectedKey);

  return (
    <div className="pb-4">
      {/* Top nav */}
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-2">
          <div className="flex items-center rounded-full border border-neutral-200 overflow-hidden">
            <button
              onClick={() => setMonthDate((d) => new Date(d.getFullYear() - 1, d.getMonth(), 1))}
              className="px-2.5 py-1.5 hover:bg-neutral-50"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="px-2 text-sm font-medium">{monthDate.getFullYear()}</span>
            <button
              onClick={() => setMonthDate((d) => new Date(d.getFullYear() + 1, d.getMonth(), 1))}
              className="px-2.5 py-1.5 hover:bg-neutral-50"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-full border border-neutral-200">
          <CalendarDays className="w-4 h-4" />
          <Search className="w-4 h-4" />
          <Plus className="w-4 h-4" />
        </div>
      </div>

      {/* Month header */}
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-3xl font-bold tracking-tight">
          {format(monthDate, 'MMMM')}
        </h1>
        <div className="flex items-center rounded-full border border-neutral-200 overflow-hidden">
          <button
            onClick={() => setMonthDate((d) => new Date(d.getFullYear(), d.getMonth() - 1, 1))}
            className="px-2.5 py-1.5 hover:bg-neutral-50"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button
            onClick={() => setMonthDate((d) => new Date(d.getFullYear(), d.getMonth() + 1, 1))}
            className="px-2.5 py-1.5 hover:bg-neutral-50"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      <CalendarGrid
        monthDate={monthDate}
        selected={selected}
        shifts={shifts}
        onSelect={setSelected}
      />

      {/* Event list */}
      <div className="mt-6">
        <div className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2">
          {format(selected, 'EEEE, MMMM d')}
        </div>
        {dayShifts.length === 0 ? (
          <div className="text-sm text-muted-foreground py-4">No shifts</div>
        ) : (
          <div className="space-y-2">
            {dayShifts.map((s) => (
              <div key={s.id} className="flex items-center gap-3 py-2.5 border-b border-border">
                <div className="w-8 h-8 rounded-lg bg-emerald-100 flex items-center justify-center">
                  <Star className="w-4 h-4 text-emerald-600" />
                </div>
                <div className="flex-1">
                  <div className="text-sm font-medium">
                    {s.employee_name || 'Shift'} · {s.store_name}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {format(parseISO(s.date + 'T00:00:00'), 'MMM d')} · {s.start_time}–{s.end_time}
                  </div>
                </div>
                <div className="text-xs text-muted-foreground">{s.start_time}</div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}