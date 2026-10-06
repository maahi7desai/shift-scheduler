import { useState } from 'react';
import { Button } from '@/components/ui/button';
import TimeInput from '@/components/TimeInput';

export default function ShiftAddForm({ employees, selectedCount, onAdd }) {
  const [employeeId, setEmployeeId] = useState('');
  const [start, setStart] = useState('11:30');
  const [end, setEnd] = useState('17:30');

  const submit = () => {
    onAdd({ employee_id: employeeId || null, start_time: start, end_time: end });
    setEmployeeId('');
    setStart('11:30');
    setEnd('17:30');
  };

  return (
    <div className="rounded-xl border border-border bg-card p-3 mt-4 space-y-2">
      <div className="text-sm font-semibold">
        Add shift{selectedCount > 0 && ` to ${selectedCount} day${selectedCount > 1 ? 's' : ''}`}
      </div>
      <select
        value={employeeId}
        onChange={(e) => setEmployeeId(e.target.value)}
        className="w-full h-9 rounded-md border border-input bg-background px-2 text-sm"
      >
        <option value="">Open shift (unassigned)</option>
        {employees.map((e) => (
          <option key={e.id} value={e.id}>{e.name}</option>
        ))}
      </select>
      <div className="flex items-center gap-2">
        <TimeInput value={start} onChange={setStart} className="flex-1" />
        <span className="text-muted-foreground">–</span>
        <TimeInput value={end} onChange={setEnd} className="flex-1" />
      </div>
      <Button className="w-full" onClick={submit} disabled={!selectedCount}>
        {!selectedCount ? 'Select days above' : `Add to ${selectedCount} day${selectedCount > 1 ? 's' : ''}`}
      </Button>
    </div>
  );
}