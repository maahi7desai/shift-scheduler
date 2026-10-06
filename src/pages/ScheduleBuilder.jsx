import { useEffect, useState } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { useAuth } from '@/lib/AuthContext';
import { Button } from '@/components/ui/button';
import { Plus, ChevronLeft, ChevronRight, CalendarDays } from 'lucide-react';
import PageHeader from '@/components/PageHeader';
import EmptyState from '@/components/EmptyState';
import DayColumn from '@/components/DayColumn';
import EmployeeHoursSummary from '@/components/EmployeeHoursSummary';
import { useToast } from '@/components/ui/use-toast';
import { getWeekStart, weekDates, fmtDate, fmtDayNum } from '@/lib/schedule';

export default function ScheduleBuilder() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [stores, setStores] = useState(null);
  const [storeId, setStoreId] = useState('');
  const [weekStart, setWeekStart] = useState(getWeekStart());
  const [employees, setEmployees] = useState([]);
  const [shifts, setShifts] = useState({});

  const dates = weekDates(weekStart);

  useEffect(() => {
    (async () => {
      const { items } = await base44.entities.Store.filter({}, { sort: '-is_default', limit: 50 });
      setStores(items);
      if (items.length && !storeId) setStoreId(items[0].id);
    })();
  }, []);

  useEffect(() => {
    if (!storeId) return;
    (async () => {
      const [empRes, shiftRes] = await Promise.all([
        base44.entities.Employee.filter({ store_ids: storeId }, { sort: 'name', limit: 100 }),
        base44.entities.Shift.filter(
          { store_id: storeId, date: { $gte: fmtDate(dates[0]), $lte: fmtDate(dates[6]) } },
          { sort: 'date', limit: 200 }
        ),
      ]);
      setEmployees(empRes.items);
      const map = {};
      shiftRes.items.forEach((s) => { (map[s.date] ||= []).push(s); });
      setShifts(map);
    })();
  }, [storeId, weekStart]);

  if (user && user.role !== 'admin') return <Navigate to="/my-schedule" replace />;

  const removeShift = async (id, date) => {
    try {
      await base44.entities.Shift.delete(id);
      setShifts((m) => ({ ...m, [date]: m[date].filter((s) => s.id !== id) }));
    } catch (e) {
      toast({ title: 'Error', description: e.message, variant: 'destructive' });
    }
  };

  const editShift = async (id, date, patch) => {
    try {
      const updated = await base44.entities.Shift.update(id, patch);
      setShifts((m) => ({
        ...m,
        [date]: (m[date] || []).map((s) => (s.id === id ? { ...s, ...updated } : s)),
      }));
    } catch (e) {
      toast({ title: 'Error', description: e.message, variant: 'destructive' });
    }
  };

  if (stores && stores.length === 0) {
    return (
      <EmptyState
        icon={CalendarDays}
        title="No store yet"
        description="Create a store before building a schedule."
        action={<Button asChild><Link to="/stores">Go to stores</Link></Button>}
      />
    );
  }

  const createUrl = `/schedule/new?store=${storeId}&week=${weekStart.toISOString()}`;

  return (
    <div>
      <PageHeader
        title="Schedule"
        subtitle="Build the weekly schedule"
        action={
          <Button size="sm" asChild>
            <Link to={createUrl}><Plus className="w-4 h-4 mr-1" />Shift</Link>
          </Button>
        }
      />

      <div className="flex items-center gap-2 mb-3">
        <select
          value={storeId}
          onChange={(e) => setStoreId(e.target.value)}
          className="h-9 rounded-md border border-input bg-background px-2 text-sm flex-1"
        >
          {stores?.map((s) => (
            <option key={s.id} value={s.id}>{s.name}</option>
          ))}
        </select>
        <Button variant="outline" size="sm" onClick={() => setWeekStart((ws) => new Date(ws.getTime() - 7 * 864e5))}>
          <ChevronLeft className="w-4 h-4" />
        </Button>
        <div className="text-sm font-medium px-1 whitespace-nowrap">{fmtDayNum(weekStart)} – {fmtDayNum(dates[6])}</div>
        <Button variant="outline" size="sm" onClick={() => setWeekStart((ws) => new Date(ws.getTime() + 7 * 864e5))}>
          <ChevronRight className="w-4 h-4" />
        </Button>
      </div>

      <div className="overflow-x-auto -mx-4 px-4 pb-2">
        <div className="flex gap-2 min-w-max">
          {dates.map((d) => {
            const ds = fmtDate(d);
            return (
              <DayColumn
                key={ds}
                date={d}
                shifts={shifts[ds] || []}
                employees={employees}
                onRemove={(id) => removeShift(id, ds)}
                onEdit={(id, patch) => editShift(id, ds, patch)}
              />
            );
          })}
        </div>
      </div>

      <EmployeeHoursSummary shifts={shifts} employees={employees} />
    </div>
  );
}