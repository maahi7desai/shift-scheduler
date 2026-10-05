import { useEffect, useState } from 'react';
import { useParams, useNavigate, Navigate } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { useAuth } from '@/lib/AuthContext';
import { useToast } from '@/components/ui/use-toast';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { ArrowLeft } from 'lucide-react';
import PageHeader from '@/components/PageHeader';
import StoreForm from '@/components/StoreForm';
import WorkingHoursEditor from '@/components/WorkingHoursEditor';

export default function StoreDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  const [store, setStore] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    base44.entities.Store.get(id).then(setStore);
  }, [id]);

  if (user && user.role !== 'admin') return <Navigate to="/my-schedule" replace />;

  const save = async (data) => {
    setSubmitting(true);
    try {
      await base44.entities.Store.update(id, data);
      toast({ title: 'Store updated' });
    } catch (e) {
      toast({ title: 'Error', description: e.message, variant: 'destructive' });
    } finally {
      setSubmitting(false);
    }
  };

  if (!store) return <div className="text-center text-sm text-muted-foreground py-8">Loading…</div>;

  return (
    <div>
      <Button variant="ghost" size="sm" onClick={() => navigate(-1)} className="mb-3 -ml-2">
        <ArrowLeft className="w-4 h-4 mr-1" />Back
      </Button>
      <PageHeader title={store.name} subtitle="Store details & hours" />

      <div className="rounded-xl border border-border bg-card p-4 mb-6">
        <h3 className="font-medium mb-3">Details</h3>
        <StoreForm initial={store} onSubmit={save} submitting={submitting} />
      </div>

      <Separator className="my-6" />
      <h3 className="font-medium mb-3">Working hours</h3>
      <WorkingHoursEditor storeId={id} />
    </div>
  );
}