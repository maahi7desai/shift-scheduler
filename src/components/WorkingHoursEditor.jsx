import { useEffect, useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/components/ui/use-toast';
import { DAY_NAMES } from '@/lib/schedule';
import { Clock, ChevronDown, ChevronUp, Pencil } from 'lucide-react';

const fmt12 = (t) => {
  if (!t) return '';
  const [h, m] = t.split(':').map(Number);
  const ampm = h >= 12 ? 'PM' : 'AM';
  const h12 = h % 12 || 12;
  return `${h12}:${String(m).padStart(2, '0')} ${ampm}`;
};

const todayDow = () => new Date().getDay();

export default function WorkingHoursEditor({ storeId }) {
  const [rows, setRows] = useState(null);
  const [saving, setSaving] = useState(false);
  const [expanded, setExpanded] = useState(true);
  const [mode, setMode] = useState('view');
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
      setMode('view');
    } catch (e) {
      toast({ title: 'Error', description: e.message, variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  if (!rows) return <div className="py-8 text-center text-sm text-muted-foreground">Loading…</div>;

  const todayIdx = todayDow();
  const today = rows.find((r) => r.dow === todayIdx);
  const isOpen = today && !today.is_closed;
  const statusText = isOpen ? 'Open now' : 'Closed';

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-border overflow-hidden bg-card">
        <button
          type="button"
          onClick={() => setExpanded((e) => !e)}
          className="w-full flex items-center gap-3 px-4 py-3.5 bg-muted/40"
        >
          <Clock className="w-5 h-5 text-teal-700 shrink-0" />
          <span className="flex-1 text-left text-sm font-medium text-foreground">{statusText}</span>
          {expanded ? <ChevronUp className="w-5 h-5 text-muted-foreground" /> : <ChevronDown className="w-5 h-5 text-muted-foreground" />}
        </button>

        {expanded && (
          <div className="divide-y divide-border">
            {rows.map((row) => {
              const isToday = row.dow === todayIdx;
              const timeText = row.is_closed ? 'Closed' : `${fmt12(row.open_time)} – ${fmt12(row.close_time)}`;
              return (
                <div key={row.dow}>
                  <div className="flex items-center px-4 py-3 gap-3">
                    <span className={`w-24 text-sm ${isToday ? 'font-bold' : 'font-normal'} text-foreground`}>{row.name}</span>
                    <span className="flex-1 text-sm text-muted-foreground">{timeText}</span>
                    {mode === 'edit' && (
                      <Switch checked={!row.is_closed} onCheckedChange={(v) => update(row.dow, { is_closed: !v })} />
                    )}
                  </div>
                  {mode === 'edit' && !row.is_closed && (
                    <div className="flex items-center px-4 py-2.5 gap-3 bg-muted/20">
                      <input
                        type="time"
                        value={row.open_time}
                        onChange={(e) => update(row.dow, { open_time: e.target.value })}
                        className="flex-1 h-9 rounded-md border border-input bg-background px-2 text-sm"
                      />
                      <span className="text-muted-foreground text-xs">–</span>
                      <input
                        type="time"
                        value={row.close_time}
                        onChange={(e) => update(row.dow, { close_time: e.target.value })}
                        className="flex-1 h-9 rounded-md border border-input bg-background px-2 text-sm"
                      />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {mode === 'view' ? (
        <Button variant="outline" className="w-full" onClick={() => setMode('edit')}>
          <Pencil className="w-4 h-4 mr-1" />Modify
        </Button>
      ) : (
        <div className="flex gap-2">
          <Button variant="outline" className="flex-1" onClick={() => setMode('view')} disabled={saving}>
            Cancel
          </Button>
          <Button onClick={save} disabled={saving} className="flex-1">
            {saving ? 'Saving…' : 'Save'}
          </Button>
        </div>
      )}
    </div>
  );
}