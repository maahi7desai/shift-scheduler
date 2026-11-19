import { useEffect, useState } from 'react';
import { formatDistanceToNow } from 'date-fns';
import { base44 } from '@/api/base44Client';
import { useAuth } from '@/lib/AuthContext';
import PageHeader from '@/components/PageHeader';
import EmptyState from '@/components/EmptyState';
import { Bell } from 'lucide-react';

export default function Notifications() {
  const { user } = useAuth();
  const [items, setItems] = useState(null);

  useEffect(() => {
    if (!user) return;
    (async () => {
      const { items } = await base44.entities.Notification.filter(
        { user_email: user.email },
        { sort: '-created_date', limit: 50 }
      );
      setItems(items);
      if (items.some((i) => !i.read)) {
        await base44.entities.Notification.updateMany(
          { user_email: user.email, read: false },
          { $set: { read: true } }
        );
      }
    })();
  }, [user]);

  return (
    <div>
      <PageHeader title="Notifications" subtitle="Schedule updates from your owner" />

      {items === null ? (
        <div className="text-center text-sm text-muted-foreground py-8">Loading…</div>
      ) : items.length === 0 ? (
        <EmptyState icon={Bell} title="No notifications" description="You are all caught up." />
      ) : (
        <div className="space-y-2">
          {items.map((n) => (
            <div key={n.id} className="rounded-xl border border-border bg-card p-3">
              <div className="flex items-start gap-3">
                <div className="w-1.5 h-8 rounded-full bg-foreground/80 mt-1" />
                <div className="flex-1">
                  <div className="font-semibold text-sm">{n.title}</div>
                  <div className="text-xs text-muted-foreground mt-0.5">{n.body}</div>
                  <div className="text-[11px] text-muted-foreground mt-1.5">
                    {formatDistanceToNow(new Date(n.created_date), { addSuffix: true })}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}