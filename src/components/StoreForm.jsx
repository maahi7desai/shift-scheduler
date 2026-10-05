import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export default function StoreForm({ initial = {}, onSubmit, submitting }) {
  const [name, setName] = useState(initial.name || '');
  const [address, setAddress] = useState(initial.address || '');
  const [phone, setPhone] = useState(initial.phone || '');

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        onSubmit({ name, address, phone });
      }}
      className="space-y-4"
    >
      <div className="space-y-1.5">
        <Label htmlFor="store-name">Store name</Label>
        <Input id="store-name" value={name} onChange={(e) => setName(e.target.value)} required placeholder="Main Street Cafe" />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="store-address">Address</Label>
        <Input id="store-address" value={address} onChange={(e) => setAddress(e.target.value)} placeholder="123 Main St" />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="store-phone">Phone</Label>
        <Input id="store-phone" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="(555) 123-4567" />
      </div>
      <Button type="submit" disabled={submitting} className="w-full">
        {initial.id ? 'Save changes' : 'Create store'}
      </Button>
    </form>
  );
}