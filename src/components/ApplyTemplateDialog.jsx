import { useEffect, useState } from 'react';
import { addDays } from 'date-fns';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { useToast } from '@/components/ui/use-toast';
import { getWeekStart, weekDates, fmtDate, fmtDayNum } from '@/lib/schedule';

export default function ApplyTemplateDialog({ open, onOpenChange, store, onApplied }) {
  const { toast } = useToast();
  const [templates, setTemplates] = useState(null);
  const [templateId, setTemplateId] = useState('');
  const [weekStart, setWeekStart] = useState(getWeekStart(addDays(new Date(), 7)));
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open || !store?.id) return;
    setTemplates(null);
    setWeekStart(getWeekStart(addDays(new Date(), 7)));
    (async () => {
      const { items } = await base44.entities.ShiftTemplate.filter(
        { store_id: store.id },
        { sort: '-updated_date', limit: 50 }
      );
      setTemplates(items);
      setTemplateId(items[0]?.id || '');
    })();
  }, [open, store?.id]);

  const template = (templates || []).find((t) => t.id === templateId);
  const dates = weekDates(weekStart);

  const apply = async () => {
    if (!template) return;
    setSaving(true);
    try {
      const records = (template.shifts || []).map((s) => ({
        store_id: store.id,
        store_name: store.name,
        date: fmtDate(addDays(weekStart, s.day_of_week)),
        start_time: s.start_time,
        end_time: s.end_time,
        ...(s.employee_id
          ? { employee_id: s.employee_id, employee_name: s.employee_name, employee_email: s.employee_email }
          : {}),
        ...(s.notes ? { notes: s.notes } : {}),
      }));
      if (!records.length) {
        toast({ title: 'Template is empty', variant: 'destructive' });
        return;
      }
      await base44.entities.Shift.bulkCreate(records);
      toast({ title: 'Schedule created', description: `${records.length} shift${records.length === 1 ? '' : 's'} added.` });
      onApplied(weekStart);
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
          <DialogTitle>Use a template</DialogTitle>
          <DialogDescription>Create a week of shifts from a saved template.</DialogDescription>
        </DialogHeader>

        {templates === null ? (
          <div className="text-sm text-muted-foreground py-4 text-center">Loading…</div>
        ) : templates.length === 0 ? (
          <div className="text-sm text-muted-foreground py-4 text-center">
            No templates yet for this store. Save this week as a template first.
          </div>
        ) : (
          <>
            <div>
              <label className="text-xs text-muted-foreground">Template</label>
              <select
                value={templateId}
                onChange={(e) => setTemplateId(e.target.value)}
                className="mt-1 w-full h-9 rounded-md border border-input bg-background px-2 text-sm"
              >
                {templates.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name} ({(t.shifts || []).length} shifts)
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-xs text-muted-foreground">Apply to week</label>
              <div className="mt-1 flex items-center justify-between rounded-md border border-input bg-background px-1 h-9">
                <button
                  type="button"
                  onClick={() => setWeekStart((ws) => addDays(ws, -7))}
                  className="flex h-7 w-7 items-center justify-center text-muted-foreground hover:text-accent-foreground"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <span className="text-sm font-medium whitespace-nowrap">
                  {fmtDayNum(weekStart)} – {fmtDayNum(dates[6])}
                </span>
                <button
                  type="button"
                  onClick={() => setWeekStart((ws) => addDays(ws, 7))}
                  className="flex h-7 w-7 items-center justify-center text-muted-foreground hover:text-accent-foreground"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={apply} disabled={saving || !template}>
            {saving ? 'Creating…' : 'Create shifts'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}