import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { useAuth } from '@/lib/AuthContext';
import { Button } from '@/components/ui/button';
import { Plus, ChevronLeft, ChevronRight, CalendarDays, Trash2, LayoutTemplate, Send } from 'lucide-react';
import PageHeader from '@/components/PageHeader';
import EmptyState from '@/components/EmptyState';
import ShiftRow from '@/components/ShiftRow';
import EmployeeHoursSummary from '@/components/EmployeeHoursSummary';
import SaveTemplateDialog from '@/components/SaveTemplateDialog';
import ApplyTemplateDialog from '@/components/ApplyTemplateDialog';
import PublishScheduleDialog from '@/components/PublishScheduleDialog';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem } from
'@/components/ui/dropdown-menu';
import { useToast } from '@/components/ui/use-toast';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger } from
'@/components/ui/alert-dialog';
import { getWeekStart, weekDates, fmtDate, fmtDayNum, fmtDayLabel } from '@/lib/schedule';

export default function ScheduleBuilder() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [searchParams] = useSearchParams();
  const [stores, setStores] = useState(null);
  const [storeId, setStoreId] = useState('');
  const [weekStart, setWeekStart] = useState(
    searchParams.get('week') ? new Date(searchParams.get('week')) : getWeekStart()
  );
  const [employees, setEmployees] = useState([]);
  const [shifts, setShifts] = useState({});
  const [employeeId, setEmployeeId] = useState('');
  const [saveTemplateOpen, setSaveTemplateOpen] = useState(false);
  const [applyTemplateOpen, setApplyTemplateOpen] = useState(false);
  const [publishOpen, setPublishOpen] = useState(false);

  const dates = weekDates(weekStart);
  const store = stores?.find((s) => s.id === storeId);

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
        { sort: 'start_time', limit: 200 }
      )]
      );
      setEmployees(empRes.items);
      setEmployeeId('');
      const map = {};
      shiftRes.items.forEach((s) => {(map[s.date] ||= []).push(s);});
      Object.values(map).forEach((list) => list.sort((a, b) => (a.start_time || '').localeCompare(b.start_time || '')));
      setShifts(map);
    })();
  }, [storeId, weekStart]);

  const isAdmin = user?.role === 'admin';

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
        [date]: (m[date] || []).map((s) => s.id === id ? { ...s, ...updated } : s)
      }));
    } catch (e) {
      toast({ title: 'Error', description: e.message, variant: 'destructive' });
    }
  };

  const clearWeek = async () => {
    const allIds = Object.values(shifts).flat().map((s) => s.id);
    if (!allIds.length) return;
    try {
      await base44.entities.Shift.deleteMany({ _id: { $in: allIds } });
      setShifts({});
      toast({ title: 'All shifts cleared for this week' });
    } catch (e) {
      toast({ title: 'Error', description: e.message, variant: 'destructive' });
    }
  };

  const assignShift = async (id, date, emp) => {
    try {
      const patch = emp ?
      { employee_id: emp.id, employee_name: emp.name, employee_email: emp.email } :
      { employee_id: null, employee_name: null, employee_email: null };
      const updated = await base44.entities.Shift.update(id, patch);
      setShifts((m) => ({
        ...m,
        [date]: (m[date] || []).map((s) => s.id === id ? { ...s, ...updated } : s)
      }));
      toast({ title: emp ? `Assigned to ${emp.name}` : 'Shift is now open' });
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
        action={<Button asChild><Link to="/stores">Go to stores</Link></Button>} />);


  }

  const createUrl = `/schedule/new?store=${storeId}&week=${weekStart.toISOString()}`;

  return (
    <div>
      <PageHeader
        title="Shifts"
        subtitle="Build the weekly schedule"
        action={isAdmin ?
        <div className="flex items-center gap-2">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button size="sm" variant="outline">
                  <LayoutTemplate className="w-4 h-4 mr-1" />Template
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => setSaveTemplateOpen(true)}>
                  Save this week as template
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setApplyTemplateOpen(true)}>
                  Create week from template
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button size="sm" variant="outline">
                  <Trash2 className="w-4 h-4 mr-1" />Clear
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Clear all shifts this week?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This will permanently delete every shift in the current week for this store. This action cannot be undone.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={clearWeek}>Clear all</AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
            <Button size="sm" asChild>
              <Link to={createUrl}><Plus className="w-4 h-4 mr-1" />Shift</Link>
            </Button>
          </div> :
        null} />
      

      <div className="grid grid-cols-3 gap-2 mb-3">
        <select
          value={storeId}
          onChange={(e) => setStoreId(e.target.value)}
          className="h-9 rounded-md border border-input bg-background px-2 text-sm">
          <option value="" disabled>Store</option>
          {stores?.map((s) =>
          <option key={s.id} value={s.id}>{s.name}</option>
          )}
        </select>
        <select
          value={employeeId}
          onChange={(e) => setEmployeeId(e.target.value)}
          className="h-9 rounded-md border border-input bg-background px-2 text-sm">
          <option value="">All employees</option>
          <option value="open">Open shift</option>
          {employees.map((emp) =>
          <option key={emp.id} value={emp.id}>{emp.name}</option>
          )}
        </select>
        <div className="flex items-center justify-between rounded-md border border-input bg-background px-1 h-9">
          <button
            type="button"
            onClick={() => setWeekStart((ws) => new Date(ws.getTime() - 7 * 864e5))}
            className="flex h-7 w-7 items-center justify-center text-muted-foreground hover:text-accent-foreground">
            <ChevronLeft className="w-4 h-4" />
          </button>
          <span className="text-sm font-medium whitespace-nowrap">{fmtDayNum(weekStart)} – {fmtDayNum(dates[6])}</span>
          <button
            type="button"
            onClick={() => setWeekStart((ws) => new Date(ws.getTime() + 7 * 864e5))}
            className="flex h-7 w-7 items-center justify-center text-muted-foreground hover:text-accent-foreground">
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {isAdmin &&
      <Button className="w-full mb-4" onClick={() => setPublishOpen(true)}>
          <Send className="w-4 h-4 mr-1" />Publish schedule to team
        </Button>
      }

      <div className="space-y-4">
        {dates.map((d) => {
          const ds = fmtDate(d);
          const dayShifts = (shifts[ds] || []).filter((s) => (employeeId !== 'open' || !s.employee_id) && (!employeeId || employeeId === 'open' || s.employee_id === employeeId));
          return (
            <div key={ds}>
              <div className="flex items-center gap-2 mb-1">
                <div className="text-sm font-semibold">{fmtDayLabel(d)}</div>
                <div className="text-sm text-muted-foreground">{fmtDayNum(d)}</div>
                <div className="text-xs text-muted-foreground ml-auto">{dayShifts.length} shift{dayShifts.length === 1 ? '' : 's'}</div>
              </div>
              <div className="rounded-xl border border-border bg-card px-3">
                {dayShifts.map((s) =>
                <ShiftRow
                  key={s.id}
                  shift={s}
                  employees={employees}
                  readOnly={!isAdmin}
                  onRemove={(id) => removeShift(id, ds)}
                  onEdit={(id, patch) => editShift(id, ds, patch)}
                  onAssign={(id, emp) => assignShift(id, ds, emp)} />

                )}
                {dayShifts.length === 0 && <div className="text-xs text-muted-foreground py-3 text-center">No shifts</div>}
              </div>
            </div>);

        })}
      </div>

      <EmployeeHoursSummary shifts={shifts} employees={employees} />

      <SaveTemplateDialog
        open={saveTemplateOpen}
        onOpenChange={setSaveTemplateOpen}
        store={store}
        weekStart={weekStart}
        shifts={shifts} />
      <ApplyTemplateDialog
        open={applyTemplateOpen}
        onOpenChange={setApplyTemplateOpen}
        store={store}
        onApplied={(ws) => setWeekStart(ws)} />
      <PublishScheduleDialog
        open={publishOpen}
        onOpenChange={setPublishOpen}
        store={store}
        weekStart={weekStart}
        shifts={shifts} />
    </div>);

}