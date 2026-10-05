import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Plus, Trash2 } from 'lucide-react';
import TimeInput from '@/components/TimeInput';
import { fmtDayLabel, fmtDayNum, formatTime } from '@/lib/schedule';

export default function DayCard({ date, shifts, employees, onAdd, onRemove }) {
  const [adding, setAdding] = useState(false);
  const [employeeId, setEmployeeId] = useState('');
  const [start, setStart] = useState('11:30');
  const [end, setEnd] = useState('17:30');

  const submit = () => {
    if (!employeeId) return;
    onAdd({ employee_id: employeeId, start_time: start, end_time: end });
    setAdding(false);
    setEmployeeId('');
    setStart('11:30');
    setEnd('17:30');
  };

  return (
    <div className="rounded-xl border border-border bg-card overflow-hidden">
      <div className="flex items-center justify-between px-4 py-2.5 border-b border-border bg-muted/30">
        <div className="text-sm font-semibold">{fmtDayLabel(date)}, {fmtDayNum(date)}</div>
        <Button variant="ghost" size="sm" onClick={() => setAdding((a) => !a)}>
          <Plus className="w-4 h-4 mr-1" />Shift
        </Button>
      </div>
      <div className="divide-y divide-border">
        {shifts.map((s) => (
          <div key={s.id} className="flex items-center gap-3 px-4 py-2.5">
            <div className="w-28 font-medium text-sm truncate">{s.employee_name}</div>
            <div className="text-sm text-muted-foreground flex-1">
              {formatTime(s.start_time)} – {formatTime(s.end_time)}
            </div>
            <Button variant="ghost" size="sm" onClick={() => onRemove(s.id)}>
              <Trash2 className="w-4 h-4 text-destructive" />
            </Button>
          </div>
        ))}
        {shifts.length === 0 && !adding && (
          <div className="px-4 py-3 text-sm text-muted-foreground">No shifts</div>
        )}
        {adding && (
          <div className="px-4 py-3 space-y-2 bg-muted/20">
            <select
              value={employeeId}
              onChange={(e) => setEmployeeId(e.target.value)}
              className="w-full h-9 rounded-md border border-input bg-background px-2 text-sm"
            >
              <option value="">Select employee…</option>
              {employees.map((e) => (
                <option key={e.id} value={e.id}>{e.name}</option>
              ))}
            </select>
            <div className="flex items-center gap-2">
              <TimeInput value={start} onChange={setStart} className="flex-1" />
              <span className="text-muted-foreground">–</span>
              <TimeInput value={end} onChange={setEnd} className="flex-1" />
            </div>
            <div className="flex gap-2">
              <Button size="sm" onClick={submit} disabled={!employeeId}>Add</Button>
              <Button size="sm" variant="ghost" onClick={() => setAdding(false)}>Cancel</Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}