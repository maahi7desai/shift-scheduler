import { useEffect, useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useAuth } from '@/lib/AuthContext';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight, CalendarDays, Repeat2, Hand } from 'lucide-react';
import PageHeader from '@/components/PageHeader';
import EmptyState from '@/components/EmptyState';
import SwapDialog from '@/components/SwapDialog';
import { useToast } from '@/components/ui/use-toast';
import { getWeekStart, weekDates, fmtDate, fmtDayLabel, fmtDayNum, formatTime } from '@/lib/schedule';

export default function MySchedule() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [weekStart, setWeekStart] = useState(getWeekStart());
  const [shifts, setShifts] = useState(null);
  const [employees, setEmployees] = useState([]);
  const [swapShift, setSwapShift] = useState(null);
  const [busy, setBusy] = useState('');

  const dates = weekDates(weekStart);

  const load = async () => {
    if (!user) return;
    const range = { $gte: fmtDate(dates[0]), $lte: fmtDate(dates[6]) };
    const empRes = await base44.entities.Employee.filter({ email: user.email }, { limit: 1 });
    const storeIds = empRes.items[0]?.store_ids || [];

    const queries = [
      base44.entities.Shift.filter({ employee_email: user.email, date: range }, { sort: 'date', limit: 100 }),
    ];
    if (storeIds.length) {
      queries.push(
        base44.entities.Shift.filter(
          { employee_id: null, store_id: { $in: storeIds }, date: range },
          { sort: 'date', limit: 100 }
        )
      );
    }
    const results = await Promise.all(queries);
    const assigned = results[0].items;
    const open = (results[1]?.items || []).map((s) => ({ ...s, _open: true }));
    setShifts([...assigned, ...open]);
  };

  useEffect(() => { load(); }, [user, weekStart]);

  useEffect(() => {
    (async () => {
      const storeIds = [...new Set((shifts || []).filter((s) => !s._open).map((s) => s.store_id))];
      if (!storeIds.length) { setEmployees([]); return; }
      const { items } = await base44.entities.Employee.filter({ store_ids: { $in: storeIds } }, { limit: 100 });
      setEmployees(items);
    })();
  }, [shifts]);

  const pickUp = async (id) => {
    setBusy(id);
    try {
      await base44.functions.invoke('pickShift', { shift_id: id });
      toast({ title: 'Shift picked up' });
      load();
    } catch (e) {
      toast({ title: 'Error', description: e.message, variant: 'destructive' });
    } finally {
      setBusy('');
    }
  };

  const releaseShift = async (id) => {
    setBusy(id);
    try {
      await base44.functions.invoke('releaseShift', { shift_id: id });
      toast({ title: 'Shift released', description: 'It is now open for others to pick up.' });
      load();
    } catch (e) {
      toast({ title: 'Error', description: e.message, variant: 'destructive' });
    } finally {
      setBusy('');
    }
  };

  const byDate = {};
  (shifts || []).forEach((s) => { (byDate[s.date] ||= []).push(s); });

  return (
    <div>
      <PageHeader title="My Shifts" subtitle="Your shifts and open shifts to pick up" />

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
        <EmptyState icon={CalendarDays} title="No shifts" description="You have no shifts this week, and no open shifts to pick up." />
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
                  <div key={s.id} className={`rounded-xl border bg-card p-3 mb-2 flex items-center gap-3 ${s._open ? 'border-dashed border-foreground/40' : 'border-border'}`}>
                    <div className={`w-1.5 h-10 rounded-full ${s._open ? 'bg-foreground/40' : 'bg-foreground/80'}`} />
                    <div className="flex-1">
                      <div className="font-semibold text-sm">{formatTime(s.start_time)} – {formatTime(s.end_time)}</div>
                      <div className="text-xs text-muted-foreground">
                        {s.store_name}{s._open && ' · Open shift'}
                      </div>
                    </div>
                    {s._open ? (
                      <Button size="sm" onClick={() => pickUp(s.id)} disabled={busy === s.id}>
                        <Hand className="w-4 h-4 mr-1" />Pick up
                      </Button>
                    ) : (
                      <Button variant="outline" size="sm" onClick={() => releaseShift(s.id)} disabled={busy === s.id}>
                        <Repeat2 className="w-4 h-4 mr-1" />Release
                      </Button>
                    )}
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