import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Pencil, Trash2, UserX } from 'lucide-react';
import TimeInput from '@/components/TimeInput';
import { formatTime } from '@/lib/schedule';

export default function ShiftRow({ shift, employees, onRemove, onEdit, onClearAssignment, readOnly }) {
  const [editing, setEditing] = useState(false);
  const [editStart, setEditStart] = useState(shift.start_time);
  const [editEnd, setEditEnd] = useState(shift.end_time);

  const empName = employees.find((e) => e.id === shift.employee_id)?.name || shift.employee_name || 'Open';
  const isAssigned = !!shift.employee_id;

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
          {isAssigned && onClearAssignment && (
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button size="sm" variant="ghost" className="h-8 w-8 p-0">
                  <UserX className="w-4 h-4 text-muted-foreground" />
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Make shift open?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This will unassign {empName} from this shift and make it available for anyone to pick up.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={() => onClearAssignment(shift.id)}>
                    Make open
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          )}
          <Button size="sm" variant="ghost" className="h-8 w-8 p-0" onClick={() => onRemove(shift.id)}>
            <Trash2 className="w-4 h-4 text-destructive" />
          </Button>
        </>
      )}
    </div>
  );
}