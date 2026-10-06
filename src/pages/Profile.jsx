import { useEffect, useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useAuth } from '@/lib/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import PageHeader from '@/components/PageHeader';
import Avatar from '@/components/Avatar';
import { useToast } from '@/components/ui/use-toast';

export default function Profile() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [employee, setEmployee] = useState(undefined);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [title, setTitle] = useState('');
  const [saving, setSaving] = useState(false);

  const load = async () => {
    if (!user) return;
    const { items } = await base44.entities.Employee.filter({ email: user.email }, { limit: 1 });
    const emp = items[0];
    setEmployee(emp || null);
    setName(emp?.name || '');
    setPhone(emp?.phone || '');
    setTitle(emp?.title || '');
  };
  useEffect(() => { load(); }, [user]);

  const save = async () => {
    if (!employee) return;
    setSaving(true);
    try {
      await base44.entities.Employee.update(employee.id, { name, phone, title });
      toast({ title: 'Profile updated' });
      load();
    } catch (e) {
      toast({ title: 'Error', description: e.message, variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  if (employee === undefined) {
    return <div className="text-center text-sm text-muted-foreground py-8">Loading…</div>;
  }
  if (!employee) {
    return (
      <div>
        <PageHeader title="Profile" subtitle="Your account details" />
        <p className="text-sm text-muted-foreground">No employee profile is linked to your account. Contact your manager.</p>
      </div>
    );
  }

  return (
    <div>
      <PageHeader title="Profile" subtitle="Update your details" />
      <div className="flex flex-col items-center mb-6">
        <Avatar name={name} size={64} />
      </div>
      <div className="space-y-4">
        <div>
          <Label htmlFor="name">Name</Label>
          <Input id="name" value={name} onChange={(e) => setName(e.target.value)} className="mt-1.5" />
        </div>
        <div>
          <Label htmlFor="email">Email</Label>
          <Input id="email" value={employee.email || user.email} disabled className="mt-1.5" />
          <p className="text-xs text-muted-foreground mt-1">Email cannot be changed.</p>
        </div>
        <div>
          <Label htmlFor="phone">Phone</Label>
          <Input id="phone" value={phone} onChange={(e) => setPhone(e.target.value)} className="mt-1.5" />
        </div>
        <div>
          <Label htmlFor="title">Title</Label>
          <Input id="title" value={title} onChange={(e) => setTitle(e.target.value)} className="mt-1.5" />
        </div>
        <Button onClick={save} disabled={saving}>
          {saving ? 'Saving…' : 'Save changes'}
        </Button>
      </div>
    </div>
  );
}