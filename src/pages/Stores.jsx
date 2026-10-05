import { useEffect, useState } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { useAuth } from '@/lib/AuthContext';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Plus, MapPin, Phone, Clock, Store as StoreIcon, Star } from 'lucide-react';
import PageHeader from '@/components/PageHeader';
import EmptyState from '@/components/EmptyState';
import StoreForm from '@/components/StoreForm';
import { useToast } from '@/components/ui/use-toast';

export default function Stores() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [stores, setStores] = useState(null);
  const [open, setOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const load = async () => {
    const { items } = await base44.entities.Store.filter({}, { sort: '-is_default', limit: 50 });
    setStores(items);
  };
  useEffect(() => { load(); }, []);

  if (user && user.role !== 'admin') return <Navigate to="/my-schedule" replace />;

  const create = async (data) => {
    setSubmitting(true);
    try {
      const isFirst = (stores?.length || 0) === 0;
      await base44.entities.Store.create({ ...data, is_default: isFirst });
      toast({ title: 'Store created' });
      setOpen(false);
      load();
    } catch (e) {
      toast({ title: 'Error', description: e.message, variant: 'destructive' });
    } finally {
      setSubmitting(false);
    }
  };

  const makeDefault = async (s) => {
    try {
      await base44.entities.Store.updateMany({ is_default: true }, { $set: { is_default: false } });
      await base44.entities.Store.update(s.id, { is_default: true });
      load();
    } catch (e) {
      toast({ title: 'Error', description: e.message, variant: 'destructive' });
    }
  };

  return (
    <div>
      <PageHeader
        title="Stores"
        subtitle="Manage your store locations"
        action={
          <Button size="sm" onClick={() => setOpen(true)}>
            <Plus className="w-4 h-4 mr-1" />Add
          </Button>
        }
      />

      {!stores ? (
        <div className="text-center text-sm text-muted-foreground py-8">Loading…</div>
      ) : stores.length === 0 ? (
        <EmptyState
          icon={StoreIcon}
          title="No stores yet"
          description="Create your first store to start building schedules. The first store becomes your default."
          action={
            <Button onClick={() => setOpen(true)}>
              <Plus className="w-4 h-4 mr-1" />Create store
            </Button>
          }
        />
      ) : (
        <div className="space-y-3">
          {stores.map((s) => (
            <div key={s.id} className="rounded-xl border border-border bg-card p-4">
              <div className="flex items-center gap-2">
                <h3 className="font-semibold">{s.name}</h3>
                {s.is_default && <Badge variant="secondary" className="text-xs">Default</Badge>}
              </div>
              {s.address && (
                <p className="text-sm text-muted-foreground mt-1 flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5" />{s.address}
                </p>
              )}
              {s.phone && (
                <p className="text-sm text-muted-foreground mt-0.5 flex items-center gap-1.5">
                  <Phone className="w-3.5 h-3.5" />{s.phone}
                </p>
              )}
              <div className="flex gap-2 mt-3">
                <Button variant="outline" size="sm" asChild>
                  <Link to={`/stores/${s.id}`}><Clock className="w-4 h-4 mr-1" />Working hours</Link>
                </Button>
                {!s.is_default && (
                  <Button variant="ghost" size="sm" onClick={() => makeDefault(s)}>
                    <Star className="w-4 h-4 mr-1" />Set default
                  </Button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>New store</DialogTitle>
          </DialogHeader>
          <StoreForm onSubmit={create} submitting={submitting} />
        </DialogContent>
      </Dialog>
    </div>
  );
}