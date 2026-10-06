import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Pencil, Trash2, UserCog } from 'lucide-react';
import TimeInput from '@/components/TimeInput';
import Avatar from '@/components/Avatar';
import { formatTime } from '@/lib/schedule';

export default function ShiftRow({ shift, employees, onRemove, onEdit, onAssign, readOnly }) {
  const [editing, setEditing] = useState(false);
  const [editStart, setEditStart] = useState(shift.start_time);
  const [editEnd, setEditEnd] = useState(shift.end_time);

  const empName = employees.find((e) => e.id === shift.employee_id)?.name || shift.employee_name || 'Open';

  const save = () => {
    onEdit(shift.id, { start_time: editStart, end_time: editEnd });
    setEditing(false);
  };

  if (editing) {
    return (
      <div className="flex items-center gap-2 py-2.5 border-b border-border">
        <TimeInput value={editStart} onChange={setEditStart} className="flex-1" />
        <span className="text-muted-foreground">–</span>
        <TimeInput value={editEnd} onChange={setEditEnd} className="flex-1" />
        <Button size="sm" onClick={save}>Save</Button>
        <Button size="sm" variant="ghost" onClick={() => setEditing(false)}>Cancel</Button>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-3 py-2.5 border-b border-border">
      <div className="flex-1">
        <div className="text-sm font-medium">{formatTime(shift.start_time)} – {formatTime(shift.end_time)}</div>
        <div className="text-xs text-muted-foreground">{empName}</div>
      </div>
      {!readOnly && (
        <>
          <Button size="sm" variant="ghost" className="h-8 w-8 p-0" onClick={() => setEditing(true)}>
            <Pencil className="w-4 h-4" />
          </Button>
          {onAssign && (
            <Popover>
              <PopoverTrigger asChild>
                <Button size="sm" variant="ghost" className="h-8 w-8 p-0">
                  <UserCog className="w-4 h-4 text-muted-foreground" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-56 p-0" align="end">
                <div className="max-h-64 overflow-y-auto">
                  <button
                    type="button"
                    onClick={() => onAssign(shift.id, null)}
                    className="flex items-center gap-2 w-full px-3 py-2 text-sm hover:bg-accent text-left"
                  >
                    <div className="w-7 h-7 rounded-full bg-muted flex items-center justify-center text-xs font-medium text-muted-foreground">Open</div>
                    <span>Open shift</span>
                  </button>
                  {employees.map((emp) => (
                    <button
                      key={emp.id}
                      type="button"
                      onClick={() => onAssign(shift.id, emp)}
                      className="flex items-center gap-2 w-full px-3 py-2 text-sm hover:bg-accent text-left"
                    >
                      <Avatar name={emp.name} size={28} />
                      <span className="truncate">{emp.name}</span>
                    </button>
                  ))}
                </div>
              </PopoverContent>
            </Popover>
          )}
          <Button size="sm" variant="ghost" className="h-8 w-8 p-0" onClick={() => onRemove(shift.id)}>
            <Trash2 className="w-4 h-4 text-destructive" />
          </Button>
        </>
      )}
    </div>
  );
}