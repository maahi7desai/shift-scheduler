import { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { useToast } from '@/components/ui/use-toast';
import { weekDates, fmtDate, fmtDayNum } from '@/lib/schedule';

export default function PublishScheduleDialog({ open, onOpenChange, store, weekStart, shifts }) {
  const { toast } = useToast();
  const [saving, setSaving] = useState(false);

  const dates = weekDates(weekStart);
  const assigned = Object.values(shifts || {}).flat().filter((s) => s.employee_email);
  const employeeEmails = [...new Set(assigned.map((s) => s.employee_email))];

  const publish = async () => {
    if (!store) return;
    setSaving(true);
    try {
      const { data } = await base44.functions.invoke('publishSchedule', {
        store_id: store.id,
        week_start: fmtDate(weekStart),
      });
      toast({
        title: 'Schedule published',
        description: `${data.notified} team member${data.notified === 1 ? '' : 's'} notified in the app and by email.`,
      });
      onOpenChange(false);
    } catch (e) {
      toast({
        title: 'Could not publish',
        description: e?.response?.data?.error || e.message,
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>Publish this schedule?</DialogTitle>
          <DialogDescription>
            {assigned.length
              ? `${assigned.length} shift${assigned.length === 1 ? '' : 's'} for ${fmtDayNum(dates[0])} – ${fmtDayNum(dates[6])} will be shared with ${employeeEmails.length} team member${employeeEmails.length === 1 ? '' : 's'}. They will get an app notification and an email.`
              : 'This week has no assigned shifts yet. Add shifts before publishing.'}
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={publish} disabled={saving || !assigned.length}>
            {saving ? 'Publishing…' : 'Publish'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}