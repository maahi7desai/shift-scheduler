import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { base44 } from '@/api/base44Client';
import { useToast } from '@/components/ui/use-toast';
import { formatTime, fmtDayNum } from '@/lib/schedule';

export default function SwapDialog({ shift, employees, open, onDone }) {
  const [targetId, setTargetId] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const { toast } = useToast();

  useEffect(() => { setTargetId(''); }, [open]);

  if (!shift) return null;
  const target = employees.find((e) => e.id === targetId);

  const submit = async () => {
    if (!target) return;
    setSubmitting(true);
    try {
      await base44.entities.SwapRequest.create({
        shift_id: shift.id,
        shift_date: shift.date,
        store_id: shift.store_id,
        store_name: shift.store_name,
        from_employee_id: shift.employee_id,
        from_employee_name: employees.find((e) => e.id === shift.employee_id)?.name || shift.employee_name,
        from_employee_email: shift.employee_email,
        to_employee_id: target.id,
        to_employee_name: target.name,
        to_employee_email: target.email,
        start_time: shift.start_time,
        end_time: shift.end_time,
        status: 'pending',
      });
      toast({ title: 'Swap request sent' });
      onDone();
    } catch (e) {
      toast({ title: 'Error', description: e.message, variant: 'destructive' });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onDone()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Request shift swap</DialogTitle>
        </DialogHeader>
        <div className="space-y-3 py-2">
          <div className="text-sm text-muted-foreground">
            {fmtDayNum(new Date(shift.date))} · {formatTime(shift.start_time)} – {formatTime(shift.end_time)}
          </div>
          <div>
            <label className="text-sm font-medium">Swap with</label>
            <select
              value={targetId}
              onChange={(e) => setTargetId(e.target.value)}
              className="mt-1.5 w-full h-10 rounded-md border border-input bg-background px-3 text-sm"
            >
              <option value="">Select an employee…</option>
              {employees
                .filter((e) => e.id !== shift.employee_id)
                .map((e) => (
                  <option key={e.id} value={e.id}>{e.name}</option>
                ))}
            </select>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onDone}>Cancel</Button>
          <Button onClick={submit} disabled={!targetId || submitting}>
            {submitting ? 'Sending…' : 'Send request'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}