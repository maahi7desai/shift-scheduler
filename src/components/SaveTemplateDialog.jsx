import { useEffect, useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { useToast } from '@/components/ui/use-toast';
import { weekDates, fmtDate } from '@/lib/schedule';

export default function SaveTemplateDialog({ open, onOpenChange, store, weekStart, shifts }) {
  const { toast } = useToast();
  const [name, setName] = useState('');
  const [saving, setSaving] = useState(false);

  const entries = Object.values(shifts || {}).flat();

  useEffect(() => {
    if (!open) return;
    setName(store?.name ? `${store.name} weekly` : 'Weekly template');
  }, [open, store]);

  const save = async () => {
    if (!name.trim()) {
      toast({ title: 'Name your template', variant: 'destructive' });
      return;
    }
    if (!entries.length) {
      toast({ title: 'No shifts to save', description: 'Add shifts to this week first.', variant: 'destructive' });
      return;
    }
    setSaving(true);
    try {
      const dates = weekDates(weekStart).map(fmtDate);
      const templateShifts = entries
        .map((s) => ({
          day_of_week: dates.indexOf(s.date),
          start_time: s.start_time,
          end_time: s.end_time,
          employee_id: s.employee_id || '',
          employee_name: s.employee_name || '',
          employee_email: s.employee_email || '',
          notes: s.notes || '',
        }))
        .filter((s) => s.day_of_week >= 0);

      await base44.entities.ShiftTemplate.create({
        name: name.trim(),
        store_id: store?.id,
        store_name: store?.name,
        shifts: templateShifts,
      });

      toast({ title: 'Template saved', description: `${templateShifts.length} shift${templateShifts.length === 1 ? '' : 's'} saved.` });
      onOpenChange(false);
    } catch (e) {
      toast({ title: 'Error', description: e.message, variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>Save week as template</DialogTitle>
          <DialogDescription>
            Saves the {entries.length} shift{entries.length === 1 ? '' : 's'} in this week so you can reuse them later.
          </DialogDescription>
        </DialogHeader>
        <div>
          <label className="text-xs text-muted-foreground">Template name</label>
          <Input value={name} onChange={(e) => setName(e.target.value)} className="mt-1" placeholder="e.g. Regular week" />
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={save} disabled={saving}>{saving ? 'Saving…' : 'Save template'}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}