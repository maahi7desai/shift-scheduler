import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Pencil, Trash2 } from 'lucide-react';
import TimeInput from '@/components/TimeInput';
import { fmtDayLabel, fmtDayNum, formatTime } from '@/lib/schedule';

export default function DayColumn({ date, shifts, employees, selected, onToggleSelect, onRemove, onEdit }) {
  const [editingId, setEditingId] = useState(null);
  const [editStart, setEditStart] = useState('');
  const [editEnd, setEditEnd] = useState('');

  const startEdit = (s) => {
    setEditingId(s.id);
    setEditStart(s.start_time);
    setEditEnd(s.end_time);
  };

  const saveEdit = () => {
    onEdit(editingId, { start_time: editStart, end_time: editEnd });
    setEditingId(null);
  };

  return (
    <div className={`min-w-[130px] flex-1 rounded-xl border bg-card overflow-hidden ${selected ? 'border-foreground ring-1 ring-foreground/30' : 'border-border'}`}>
      <button
        type="button"
        onClick={onToggleSelect}
        className={`w-full text-left px-3 py-2 border-b border-border ${selected ? 'bg-foreground text-background' : 'bg-muted/30'}`}
      >
        <div className={`text-xs font-medium ${selected ? 'text-background/80' : 'text-muted-foreground'}`}>{fmtDayLabel(date)}</div>
        <div className="text-base font-semibold leading-tight">{fmtDayNum(date)}</div>
      </button>
      <div className="p-1.5 space-y-1.5">
        {shifts.map((s) =>
          editingId === s.id ? (
            <div key={s.id} className="space-y-1.5 p-2 rounded-md bg-muted/30">
              <div className="flex items-center gap-1">
                <TimeInput value={editStart} onChange={setEditStart} className="flex-1 text-xs h-8" />
                <span className="text-muted-foreground text-xs">–</span>
                <TimeInput value={editEnd} onChange={setEditEnd} className="flex-1 text-xs h-8" />
              </div>
              <div className="flex gap-1">
                <Button size="sm" className="h-7 text-xs flex-1" onClick={saveEdit}>Save</Button>
                <Button size="sm" variant="ghost" className="h-7 text-xs" onClick={() => setEditingId(null)}>Cancel</Button>
              </div>
            </div>
          ) : (
            <div key={s.id} className="rounded-md bg-muted/40 p-2">
              <div className="text-xs font-semibold leading-tight">{formatTime(s.start_time)}</div>
              <div className="text-[11px] text-muted-foreground leading-tight">{formatTime(s.end_time)}</div>
              <div className="text-xs font-medium truncate mt-0.5">
                {employees.find((e) => e.id === s.employee_id)?.name || s.employee_name || 'Open'}
              </div>
              <div className="flex gap-0.5 mt-1">
                <Button size="sm" variant="ghost" className="h-6 w-6 p-0" onClick={() => startEdit(s)}>
                  <Pencil className="w-3 h-3" />
                </Button>
                <Button size="sm" variant="ghost" className="h-6 w-6 p-0" onClick={() => onRemove(s.id)}>
                  <Trash2 className="w-3 h-3 text-destructive" />
                </Button>
              </div>
            </div>
          )
        )}
        {shifts.length === 0 && <div className="text-[11px] text-muted-foreground text-center py-2">No shifts</div>}
      </div>
    </div>
  );
}