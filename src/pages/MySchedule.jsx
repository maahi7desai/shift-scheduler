import { useEffect, useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useAuth } from '@/lib/AuthContext';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight, CalendarDays, Repeat2 } from 'lucide-react';
import PageHeader from '@/components/PageHeader';
import EmptyState from '@/components/EmptyState';
import SwapDialog from '@/components/SwapDialog';
import { getWeekStart, weekDates, fmtDate, fmtDayLabel, fmtDayNum, formatTime } from '@/lib/schedule';

export default function MySchedule() {
  const { user } = useAuth();
  const [weekStart, setWeekStart] = useState(getWeekStart());
  const [shifts, setShifts] = useState(null);
  const [employees, setEmployees] = useState([]);
  const [swapShift, setSwapShift] = useState(null);

  const dates = weekDates(weekStart);

  const load = async () => {
    if (!user) return;
    const { items } = await base44.entities.Shift.filter(
      { employee_email: user.email, date: { $gte: fmtDate(dates[0]), $lte: fmtDate(dates[6]) } },
      { sort: 'date', limit: 100 }
    );
    setShifts(items);
  };

  useEffect(() => { load(); }, [user, weekStart]);

  useEffect(() => {
    (async () => {
      const storeIds = [...new Set((shifts || []).map((s) => s.store_id))];
      if (!storeIds.length) { setEmployees([]); return; }
      const { items } = await base44.entities.Employee.filter({ store_ids: { $in: storeIds } }, { limit: 100 });
      setEmployees(items);
    })();
  }, [shifts]);

  const byDate = {};
  (shifts || []).forEach((s) => { (byDate[s.date] ||= []).push(s); });

  return (
    <div>
      <PageHeader title="My Schedule" subtitle="Your upcoming shifts" />

      <div className="flex items-center justify-between mb-4">
        <Button variant="outline" size="sm" onClick={() => setWeekStart((ws) => new Date(ws.getTime() - 7 * 864e5))}>
          <ChevronLeft className="w-4 h-4" />
        </Button>
        <div className="text-sm font-medium">{fmtDayNum(weekStart)} – {fmtDayNum(dates[6])}</div>
        <Button variant="outline" size="sm" onClick={() => setWeekStart((ws) => new Date(ws.getTime() + 7 * 864e5))}>
          <ChevronRight className="w-4 h-4" />
        </Button>
      </div>

      {shifts === null ? (
        <div className="text-center text-sm text-muted-foreground py-8">Loading…</div>
      ) : shifts.length === 0 ? (
        <EmptyState icon={CalendarDays} title="No shifts" description="You have no shifts scheduled this week." />
      ) : (
        <div className="space-y-4">
          {dates.map((d) => {
            const ds = fmtDate(d);
            const list = byDate[ds] || [];
            if (!list.length) return null;
            return (
              <div key={ds}>
                <div className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1.5">
                  {fmtDayLabel(d)}, {fmtDayNum(d)}
                </div>
                {list.map((s) => (
                  <div key={s.id} className="rounded-xl border border-border bg-card p-3 mb-2 flex items-center gap-3">
                    <div className="w-1.5 h-10 rounded-full bg-foreground/80" />
                    <div className="flex-1">
                      <div className="font-semibold text-sm">{formatTime(s.start_time)} – {formatTime(s.end_time)}</div>
                      <div className="text-xs text-muted-foreground">{s.store_name}</div>
                    </div>
                    <Button variant="outline" size="sm" onClick={() => setSwapShift(s)}>
                      <Repeat2 className="w-4 h-4 mr-1" />Swap
                    </Button>
                  </div>
                ))}
              </div>
            );
          })}
        </div>
      )}

      <SwapDialog shift={swapShift} employees={employees} open={!!swapShift} onDone={() => setSwapShift(null)} />
    </div>
  );
}