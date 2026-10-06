import { useEffect, useState } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { useAuth } from '@/lib/AuthContext';
import { Button } from '@/components/ui/button';
import { Plus, ChevronLeft, ChevronRight, CalendarDays } from 'lucide-react';
import PageHeader from '@/components/PageHeader';
import EmptyState from '@/components/EmptyState';
import DayCard from '@/components/DayCard';
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

  const addShift = async (date, employee_id, start_time, end_time) => {
    try {
      const emp = employees.find((e) => e.id === employee_id);
      const store = stores.find((s) => s.id === storeId);
      const created = await base44.entities.Shift.create({
        store_id: storeId,
        store_name: store?.name,
        date,
        employee_id,
        employee_name: emp?.name,
        employee_email: emp?.email,
        start_time,
        end_time,
      });
      setShifts((m) => ({ ...m, [date]: [...(m[date] || []), created] }));
    } catch (e) {
      toast({ title: 'Error', description: e.message, variant: 'destructive' });
    }
  };

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

  return (
    <div>
      <PageHeader title="Schedule" subtitle="Build the weekly schedule" />

      <div className="flex items-center gap-2 mb-4">
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

      <div className="space-y-3">
        {dates.map((d) => (
          <DayCard
            key={fmtDate(d)}
            date={d}
            shifts={shifts[fmtDate(d)] || []}
            employees={employees}
            onAdd={(p) => addShift(fmtDate(d), p.employee_id, p.start_time, p.end_time)}
            onRemove={(id) => removeShift(id, fmtDate(d))}
            onEdit={(id, patch) => editShift(id, fmtDate(d), patch)}
          />
        ))}
      </div>

      <EmployeeHoursSummary shifts={shifts} employees={employees} />
    </div>
  );
}