import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';

export default function EmployeeForm({ initial = {}, stores = [], onSubmit, submitting }) {
  const [name, setName] = useState(initial.name || '');
  const [email, setEmail] = useState(initial.email || '');
  const [phone, setPhone] = useState(initial.phone || '');
  const [title, setTitle] = useState(initial.title || '');
  const [storeIds, setStoreIds] = useState(initial.store_ids || []);

  const toggle = (id) =>
    setStoreIds((s) => (s.includes(id) ? s.filter((x) => x !== id) : [...s, id]));

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        onSubmit({ name, email, phone, title, store_ids: storeIds });
      }}
      className="space-y-4"
    >
      <div className="space-y-1.5">
        <Label>Name</Label>
        <Input value={name} onChange={(e) => setName(e.target.value)} required placeholder="Jane Doe" />
      </div>
      <div className="space-y-1.5">
        <Label>Email</Label>
        <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="jane@example.com" />
        <p className="text-xs text-muted-foreground">Used to send the registration invite.</p>
      </div>
      <div className="space-y-1.5">
        <Label>Phone</Label>
        <Input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="(555) 123-4567" />
      </div>
      <div className="space-y-1.5">
        <Label>Title</Label>
        <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Team Member" />
      </div>
      <div className="space-y-2">
        <Label>Stores</Label>
        <div className="space-y-2">
          {stores.map((s) => (
            <label key={s.id} className="flex items-center gap-2.5 text-sm cursor-pointer">
              <Checkbox checked={storeIds.includes(s.id)} onCheckedChange={() => toggle(s.id)} />
              {s.name}
              {s.is_default && <span className="text-xs text-muted-foreground">(default)</span>}
            </label>
          ))}
          {stores.length === 0 && <p className="text-xs text-muted-foreground">Create a store first.</p>}
        </div>
      </div>
      <Button type="submit" disabled={submitting} className="w-full">
        {initial.id ? 'Save' : 'Add employee'}
      </Button>
    </form>
  );
}