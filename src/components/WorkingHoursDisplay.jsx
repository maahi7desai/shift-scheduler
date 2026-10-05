import { useEffect, useState } from 'react';
import { base44 } from '@/api/base44Client';
import { DAY_NAMES } from '@/lib/schedule';
import { Clock, ChevronDown, ChevronUp } from 'lucide-react';

const fmt12 = (t) => {
  if (!t) return '';
  const [h, m] = t.split(':').map(Number);
  const ampm = h >= 12 ? 'PM' : 'AM';
  const h12 = h % 12 || 12;
  return `${h12}:${String(m).padStart(2, '0')} ${ampm}`;
};

const todayDow = () => new Date().getDay();

export default function WorkingHoursDisplay({ storeId }) {
  const [rows, setRows] = useState(null);
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    (async () => {
      const { items } = await base44.entities.WorkingHours.filter({ store_id: storeId }, { limit: 7 });
      const map = {};
      items.forEach((i) => { map[i.day_of_week] = i; });
      setRows(
        DAY_NAMES.map((name, idx) => ({
          name,
          dow: idx,
          open_time: map[idx]?.open_time || '09:00',
          close_time: map[idx]?.close_time || '17:00',
          is_closed: map[idx]?.is_closed ?? false,
        }))
      );
    })();
  }, [storeId]);

  if (!rows) return <div className="py-2 text-xs text-muted-foreground">Loading hours…</div>;

  const todayIdx = todayDow();
  const today = rows.find((r) => r.dow === todayIdx);
  const isOpen = today && !today.is_closed;
  const statusText = isOpen ? 'Open now' : 'Closed';

  return (
    <div className="rounded-xl border border-border overflow-hidden bg-muted/20">
      <button
        type="button"
        onClick={() => setExpanded((e) => !e)}
        className="w-full flex items-center gap-2.5 px-3 py-2.5"
      >
        <Clock className="w-4 h-4 text-teal-700 shrink-0" />
        <span className="flex-1 text-left text-sm font-medium text-foreground">{statusText}</span>
        {expanded ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
      </button>

      {expanded && (
        <div className="divide-y divide-border border-t border-border">
          {rows.map((row) => {
            const isToday = row.dow === todayIdx;
            const timeText = row.is_closed ? 'Closed' : `${fmt12(row.open_time)} – ${fmt12(row.close_time)}`;
            return (
              <div key={row.dow} className="flex items-center px-3 py-2 gap-3">
                <span className={`w-20 text-sm ${isToday ? 'font-bold' : 'font-normal'} text-foreground`}>{row.name}</span>
                <span className="flex-1 text-sm text-muted-foreground">{timeText}</span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}