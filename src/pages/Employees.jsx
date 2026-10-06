import { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { useAuth } from '@/lib/AuthContext';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Plus, Trash2, Users as UsersIcon, Mail, Pencil } from 'lucide-react';
import PageHeader from '@/components/PageHeader';
import EmptyState from '@/components/EmptyState';
import EmployeeForm from '@/components/EmployeeForm';
import Avatar from '@/components/Avatar';
import { useToast } from '@/components/ui/use-toast';

export default function Employees() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [employees, setEmployees] = useState(null);
  const [stores, setStores] = useState([]);
  const [open, setOpen] = useState(false);
  const [editTarget, setEditTarget] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const defaultStore = stores.find((s) => s.is_default);

  const load = async () => {
    const [empRes, storeRes] = await Promise.all([
      base44.entities.Employee.filter({}, { sort: 'name', limit: 100 }),
      base44.entities.Store.filter({}, { limit: 50 }),
    ]);
    setEmployees(empRes.items);
    setStores(storeRes.items);
  };
  useEffect(() => { load(); }, []);

  if (user && user.role !== 'admin') return <Navigate to="/my-schedule" replace />;

  const storeName = (sid) => stores.find((s) => s.id === sid)?.name;

  const add = async (data) => {
    setSubmitting(true);
    try {
      const store_ids = data.store_ids.length ? data.store_ids : defaultStore ? [defaultStore.id] : [];
      await base44.entities.Employee.create({ ...data, store_ids });
      if (data.email) {
        try {
          await base44.users.inviteUser(data.email, 'user');
          toast({ title: 'Employee added', description: `Invite sent to ${data.email}` });
        } catch {
          toast({ title: 'Employee added', description: 'Could not send invite email.' });
        }
      } else {
        toast({ title: 'Employee added' });
      }
      setOpen(false);
      load();
    } catch (e) {
      toast({ title: 'Error', description: e.message, variant: 'destructive' });
    } finally {
      setSubmitting(false);
    }
  };

  const saveEdit = async (data) => {
    setSubmitting(true);
    try {
      await base44.entities.Employee.update(editTarget.id, data);
      toast({ title: 'Employee updated' });
      setEditTarget(null);
      load();
    } catch (e) {
      toast({ title: 'Error', description: e.message, variant: 'destructive' });
    } finally {
      setSubmitting(false);
    }
  };

  const invite = async (emp) => {
    if (!emp.email) {
      toast({ title: 'No email on file', description: 'Add an email to this employee first.', variant: 'destructive' });
      return;
    }
    try {
      await base44.users.inviteUser(emp.email, 'user');
      toast({ title: 'Invite sent', description: emp.email });
    } catch (e) {
      toast({ title: 'Error', description: e.message, variant: 'destructive' });
    }
  };

  const remove = async (emp) => {
    if (!confirm(`Remove ${emp.name}?`)) return;
    try {
      await base44.entities.Employee.delete(emp.id);
      load();
    } catch (e) {
      toast({ title: 'Error', description: e.message, variant: 'destructive' });
    }
  };

  return (
    <div>
      <PageHeader
        title="Employees"
        subtitle={`${employees?.length || 0} on the team`}
        action={
          <Button size="sm" onClick={() => setOpen(true)}>
            <Plus className="w-4 h-4 mr-1" />Add
          </Button>
        }
      />

      {!employees ? (
        <div className="text-center text-sm text-muted-foreground py-8">Loading…</div>
      ) : employees.length === 0 ? (
        <EmptyState
          icon={UsersIcon}
          title="No employees yet"
          description="Add your first team member. They'll be invited by email and added to your default store."
          action={
            <Button onClick={() => setOpen(true)}>
              <Plus className="w-4 h-4 mr-1" />Add employee
            </Button>
          }
        />
      ) : (
        <div>
          <div className="flex items-center justify-between text-xs text-muted-foreground mb-2 px-1">
            <span>Showing {employees.length} of {employees.length} employees</span>
          </div>
          <div className="rounded-xl border border-border overflow-hidden bg-card">
            {employees.map((emp, i) => (
              <div
                key={emp.id}
                className={`flex items-center gap-3 px-3 py-3 ${i % 2 === 1 ? 'bg-muted/40' : ''} ${i > 0 ? 'border-t border-border' : ''}`}
              >
                <Avatar name={emp.name} />
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-sm truncate">{emp.name}</div>
                  <div className="text-xs text-muted-foreground truncate">
                    {emp.title || emp.store_ids?.map(storeName).filter(Boolean).join(', ')}
                  </div>
                </div>
                <Button variant="ghost" size="sm" onClick={() => invite(emp)}>
                  <Mail className="w-4 h-4" />
                </Button>
                <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={() => setEditTarget(emp)}>
                  <Pencil className="w-4 h-4" />
                </Button>
                <Button variant="ghost" size="sm" onClick={() => remove(emp)}>
                  <Trash2 className="w-4 h-4 text-destructive" />
                </Button>
              </div>
            ))}
          </div>
        </div>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add employee</DialogTitle>
          </DialogHeader>
          <EmployeeForm stores={stores} onSubmit={add} submitting={submitting} />
        </DialogContent>
      </Dialog>

      <Dialog open={!!editTarget} onOpenChange={(o) => !o && setEditTarget(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit employee</DialogTitle>
          </DialogHeader>
          {editTarget && (
            <EmployeeForm initial={editTarget} stores={stores} onSubmit={saveEdit} submitting={submitting} />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}