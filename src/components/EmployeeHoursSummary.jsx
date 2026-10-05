import { Clock } from 'lucide-react';
import Avatar from '@/components/Avatar';

const toMinutes = (t) => {
  if (!t) return 0;
  const [h, m] = t.split(':').map(Number);
  return h * 60 + m;
};

export default function EmployeeHoursSummary({ shifts, employees }) {
  const totals = {};
  Object.values(shifts).flat().forEach((s) => {
    const mins = toMinutes(s.end_time) - toMinutes(s.start_time);
    if (mins <= 0) return;
    totals[s.employee_id] = (totals[s.employee_id] || 0) + mins;
  });

  const rows = employees
    .map((emp) => ({ name: emp.name, hours: (totals[emp.id] || 0) / 60 }))
    .filter((r) => r.hours > 0)
    .sort((a, b) => b.hours - a.hours);

  if (rows.length === 0) return null;

  const totalHours = rows.reduce((sum, r) => sum + r.hours, 0);

  return (
    <div className="mt-5 rounded-2xl border border-border bg-card overflow-hidden">
      <div className="flex items-center gap-2 px-4 py-2.5 border-b border-border bg-muted/30">
        <Clock className="w-4 h-4 text-muted-foreground" />
        <span className="text-sm font-medium">Employee Hours</span>
        <span className="ml-auto text-xs text-muted-foreground">Total: {totalHours.toFixed(1)}h</span>
      </div>
      <div className="divide-y divide-border">
        {rows.map((r) => (
          <div key={r.name} className="flex items-center gap-3 px-4 py-2.5">
            <Avatar name={r.name} size={32} />
            <span className="flex-1 text-sm font-medium">{r.name}</span>
            <span className="text-sm text-muted-foreground">{r.hours.toFixed(1)} hrs</span>
          </div>
        ))}
      </div>
    </div>
  );
}