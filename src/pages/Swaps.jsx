import { useEffect, useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useAuth } from '@/lib/AuthContext';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Check, X, Repeat2 } from 'lucide-react';
import PageHeader from '@/components/PageHeader';
import EmptyState from '@/components/EmptyState';
import { useToast } from '@/components/ui/use-toast';
import { fmtDayNum, formatTime } from '@/lib/schedule';

const STATUS_STYLE = {
  pending: 'bg-amber-100 text-amber-800',
  accepted: 'bg-emerald-100 text-emerald-800',
  declined: 'bg-red-100 text-red-800',
};

export default function Swaps() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [requests, setRequests] = useState(null);
  const [busy, setBusy] = useState('');
  const isAdmin = user?.role === 'admin';

  const load = async () => {
    const { items } = await base44.entities.SwapRequest.filter({}, { sort: '-created_date', limit: 100 });
    setRequests(items);
  };
  useEffect(() => { load(); }, []);

  const respond = async (id, action) => {
    setBusy(id);
    try {
      await base44.functions.invoke('processSwap', { swap_id: id, action });
      toast({ title: action === 'accept' ? 'Swap accepted' : 'Swap declined' });
      load();
    } catch (e) {
      toast({ title: 'Error', description: e.message, variant: 'destructive' });
    } finally {
      setBusy('');
    }
  };

  const fmt = (d) => { try { return fmtDayNum(new Date(d)); } catch { return d; } };

  return (
    <div>
      <PageHeader title="Swap Requests" subtitle={isAdmin ? 'All shift swap activity' : 'Manage your swaps'} />

      {!requests ? (
        <div className="text-center text-sm text-muted-foreground py-8">Loading…</div>
      ) : requests.length === 0 ? (
        <EmptyState icon={Repeat2} title="No swap requests" description="When someone requests a shift swap, it will appear here." />
      ) : (
        <div className="space-y-3">
          {requests.map((r) => {
            const incoming = !isAdmin && r.to_employee_email === user.email && r.status === 'pending';
            return (
              <div key={r.id} className="rounded-xl border border-border bg-card p-4">
                <div className="flex items-center justify-between gap-2 mb-2">
                  <div className="text-sm font-semibold">
                    {fmt(r.shift_date)} · {formatTime(r.start_time)} – {formatTime(r.end_time)}
                  </div>
                  <Badge className={STATUS_STYLE[r.status]} variant="secondary">{r.status}</Badge>
                </div>
                <div className="text-sm text-muted-foreground">
                  <span className="text-foreground font-medium">{r.from_employee_name}</span> wants to swap with{' '}
                  <span className="text-foreground font-medium">{r.to_employee_name}</span>
                </div>
                {r.store_name && <div className="text-xs text-muted-foreground mt-0.5">{r.store_name}</div>}
                {isAdmin && r.status === 'accepted' && (
                  <div className="text-xs text-emerald-700 mt-2">Employee approved — shift reassigned.</div>
                )}
                {incoming && (
                  <div className="flex gap-2 mt-3">
                    <Button size="sm" onClick={() => respond(r.id, 'accept')} disabled={busy === r.id}>
                      <Check className="w-4 h-4 mr-1" />Accept
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => respond(r.id, 'decline')} disabled={busy === r.id}>
                      <X className="w-4 h-4 mr-1" />Decline
                    </Button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}