import { useEffect, useState } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Store as StoreIcon, User } from 'lucide-react';
import TimeInput from '@/components/TimeInput';
import { useToast } from '@/components/ui/use-toast';
import { startOfWeek, addDays, format } from 'date-fns';

export default function CreateShift() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [stores, setStores] = useState(null);
  const [storeId, setStoreId] = useState(params.get('store') || '');
  const [weekStart, setWeekStart] = useState(
    params.get('week') ? new Date(params.get('week')) : startOfWeek(new Date(), { weekStartsOn: 1 })
  );
  const [employees, setEmployees] = useState([]);
  const [selectedDays, setSelectedDays] = useState([]);
  const [employeeId, setEmployeeId] = useState('');
  const [start, setStart] = useState('09:00');
  const [end, setEnd] = useState('17:00');
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);

  const dates = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));

  useEffect(() => {
    (async () => {
      const { items } = await base44.entities.Store.filter({}, { sort: '-is_default', limit: 50 });
      setStores(items);
      if (!storeId && items.length) setStoreId(items[0].id);
    })();
  }, []);

  useEffect(() => {
    if (!storeId) return;
    (async () => {
      const { items } = await base44.entities.Employee.filter({ store_ids: storeId }, { sort: 'name', limit: 100 });
      setEmployees(items);
    })();
  }, [storeId]);

  const toggleDay = (ds) => {
    setSelectedDays((prev) => (prev.includes(ds) ? prev.filter((d) => d !== ds) : [...prev, ds]));
  };

  const duration = (() => {
    const [sh, sm] = start.split(':').map(Number);
    const [eh, em] = end.split(':').map(Number);
    const mins = eh * 60 + em - (sh * 60 + sm);
    if (mins <= 0) return 0;
    return mins % 60 === 0 ? mins / 60 : (mins / 60).toFixed(1);
  })();

  const store = stores?.find((s) => s.id === storeId);

  const create = async () => {
    if (!selectedDays.length) {
      toast({ title: 'Select at least one day', variant: 'destructive' });
      return;
    }
    setSaving(true);
    try {
      const emp = employeeId ? employees.find((e) => e.id === employeeId) : null;
      const records = selectedDays.map((d) => ({
        store_id: storeId,
        store_name: store?.name,
        date: d,
        ...(emp ? { employee_id: emp.id, employee_name: emp.name, employee_email: emp.email } : {}),
        start_time: start,
        end_time: end,
        ...(notes ? { notes } : {}),
      }));
      await base44.entities.Shift.bulkCreate(records);
      toast({ title: `Shift created for ${records.length} day${records.length > 1 ? 's' : ''}` });
      navigate('/schedule');
    } catch (e) {
      toast({ title: 'Error', description: e.message, variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col max-w-md mx-auto bg-background">
      <div className="flex items-center justify-between px-4 py-3 border-b border-border">
        <Link to="/schedule"><ArrowLeft className="w-5 h-5" /></Link>
        <div className="text-center">
          <div className="font-semibold">Create a shift</div>
          {store && <div className="text-xs text-muted-foreground">{store.name}</div>}
        </div>
        <div className="w-5" />
      </div>

      <div className="flex-1 px-4 py-4 space-y-5">
        <span className="inline-block text-xs rounded-full bg-amber-100 text-amber-800 px-2.5 py-1">Unpublished</span>

        <div>
          <div className="flex items-center justify-between mb-2">
            <div className="text-xs text-muted-foreground">Repeat on</div>
            <button
              type="button"
              onClick={() => {
                const all = dates.map((d) => format(d, 'yyyy-MM-dd'));
                const allSelected = all.length === selectedDays.length && all.every((d) => selectedDays.includes(d));
                setSelectedDays(allSelected ? [] : all);
              }}
              className="text-xs font-medium text-primary"
            >
              {dates.length === selectedDays.length && dates.every((d) => selectedDays.includes(format(d, 'yyyy-MM-dd')))
                ? 'Clear all'
                : 'Select all'}
            </button>
          </div>
          <div className="flex justify-between gap-1.5">
            {dates.map((d) => {
              const ds = format(d, 'yyyy-MM-dd');
              const isSel = selectedDays.includes(ds);
              return (
                <button
                  key={ds}
                  type="button"
                  onClick={() => toggleDay(ds)}
                  className={`flex-1 aspect-square rounded-lg flex flex-col items-center justify-center gap-0.5 transition-colors ${isSel ? 'bg-primary text-primary-foreground' : 'bg-muted text-foreground'}`}
                >
                  <span className="text-[10px] font-medium opacity-80">{format(d, 'EEE')}</span>
                  <span className="text-base font-semibold">{format(d, 'd')}</span>
                </button>
              );
            })}
          </div>
        </div>

        <div className="flex items-end gap-2">
          <div className="flex-1">
            <label className="text-xs text-muted-foreground">Start time</label>
            <TimeInput value={start} onChange={setStart} className="w-full mt-1" />
          </div>
          <span className="text-muted-foreground pb-2">–</span>
          <div className="flex-1">
            <label className="text-xs text-muted-foreground">End time</label>
            <TimeInput value={end} onChange={setEnd} className="w-full mt-1" />
          </div>
          <span className="text-sm text-muted-foreground pb-2 whitespace-nowrap">({duration}hr)</span>
        </div>

        <div>
          <label className="text-xs text-muted-foreground">Store</label>
          <div className="flex items-center gap-2 mt-1 pb-2 border-b border-border">
            <StoreIcon className="w-4 h-4 text-green-500" />
            <select
              value={storeId}
              onChange={(e) => setStoreId(e.target.value)}
              className="flex-1 bg-transparent text-sm outline-none"
            >
              {stores?.map((s) => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </select>
          </div>
        </div>

        <div>
          <label className="text-xs text-muted-foreground">Assign employee</label>
          <div className="flex items-center gap-2 mt-1 pb-2 border-b border-border">
            <User className="w-4 h-4 text-muted-foreground" />
            <select
              value={employeeId}
              onChange={(e) => setEmployeeId(e.target.value)}
              className="flex-1 bg-transparent text-sm outline-none"
            >
              <option value="">Open shift (unassigned)</option>
              {employees.map((e) => (
                <option key={e.id} value={e.id}>{e.name}</option>
              ))}
            </select>
          </div>
        </div>

        <div>
          <label className="text-xs text-muted-foreground">Shift notes</label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Let the employee know any important details about the shift."
            className="w-full mt-1 rounded-md border border-border bg-background px-3 py-2 text-sm min-h-[80px] resize-none outline-none"
          />
        </div>
      </div>

      <div className="px-4 pb-6 pt-2">
        <Button className="w-full rounded-full py-3 text-base" onClick={create} disabled={saving}>
          {saving ? 'Creating…' : 'Create shift'}
        </Button>
      </div>
    </div>
  );
}