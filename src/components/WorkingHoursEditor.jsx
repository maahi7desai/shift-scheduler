import { useEffect, useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/components/ui/use-toast';
import { DAY_NAMES } from '@/lib/schedule';
import TimeInput from '@/components/TimeInput';

export default function WorkingHoursEditor({ storeId }) {
  const [rows, setRows] = useState(null);
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    (async () => {
      const { items } = await base44.entities.WorkingHours.filter({ store_id: storeId }, { limit: 7 });
      const map = {};
      items.forEach((i) => { map[i.day_of_week] = i; });
      setRows(
        DAY_NAMES.map((name, idx) => ({
          name,
          dow: idx,
          id: map[idx]?.id,
          open_time: map[idx]?.open_time || '09:00',
          close_time: map[idx]?.close_time || '17:00',
          is_closed: map[idx]?.is_closed ?? false,
        }))
      );
    })();
  }, [storeId]);

  const update = (dow, patch) =>
    setRows((r) => r.map((row) => (row.dow === dow ? { ...row, ...patch } : row)));

  const save = async () => {
    setSaving(true);
    try {
      for (const row of rows) {
        if (row.id) {
          await base44.entities.WorkingHours.update(row.id, {
            open_time: row.open_time,
            close_time: row.close_time,
            is_closed: row.is_closed,
          });
        } else {
          await base44.entities.WorkingHours.create({
            store_id: storeId,
            day_of_week: row.dow,
            open_time: row.open_time,
            close_time: row.close_time,
            is_closed: row.is_closed,
          });
        }
      }
      toast({ title: 'Working hours saved' });
    } catch (e) {
      toast({ title: 'Error', description: e.message, variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  if (!rows) return <div className="py-8 text-center text-sm text-muted-foreground">Loading…</div>;

  return (
    <div className="space-y-3">
      {rows.map((row) => (
        <div key={row.dow} className="flex items-center gap-3">
          <div className="w-24 text-sm font-medium">{row.name}</div>
          <Switch checked={!row.is_closed} onCheckedChange={(v) => update(row.dow, { is_closed: !v })} />
          <div className="flex-1 flex items-center gap-2">
            <TimeInput value={row.open_time} onChange={(v) => update(row.dow, { open_time: v })} disabled={row.is_closed} className="flex-1" />
            <span className="text-muted-foreground">–</span>
            <TimeInput value={row.close_time} onChange={(v) => update(row.dow, { close_time: v })} disabled={row.is_closed} className="flex-1" />
          </div>
        </div>
      ))}
      <Button onClick={save} disabled={saving} className="w-full">
        {saving ? 'Saving…' : 'Save working hours'}
      </Button>
    </div>
  );
}