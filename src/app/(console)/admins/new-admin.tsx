'use client';

import { useState, useTransition } from 'react';
import { toast } from 'sonner';
import { UserPlusIcon } from 'lucide-react';
import { createAdmin } from './actions';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Switch } from '@/components/ui/switch';

export function NewAdmin({
  roles,
  areas,
}: {
  roles: string[];
  areas: Record<string, string>;
}) {
  const [open, setOpen] = useState(false);
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [granted, setGranted] = useState<string[]>([]);
  const [pending, start] = useTransition();

  const toggle = (role: string) =>
    setGranted((current) =>
      current.includes(role)
        ? current.filter((value) => value !== role)
        : [...current, role],
    );

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm">
          <UserPlusIcon />
          Add administrator
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add an administrator</DialogTitle>
          <DialogDescription>
            They sign in with this email and password. Grant only the areas they
            need — an area can be added later without creating anything.
          </DialogDescription>
        </DialogHeader>
        <div className="flex flex-col gap-3">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="admin-name">Name</Label>
            <Input
              id="admin-name"
              value={name}
              onChange={(event) => setName(event.target.value)}
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="admin-email">Email</Label>
            <Input
              id="admin-email"
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="admin-password">Password</Label>
            <Input
              id="admin-password"
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
            />
            <p className="text-muted-foreground text-xs">
              They cannot change this themselves yet; an administrator with this
              area can reset it.
            </p>
          </div>
          <div className="flex flex-col gap-2">
            <Label>Areas</Label>
            {roles.map((role) => (
              <Label key={role} className="text-sm font-normal">
                <Switch
                  checked={granted.includes(role)}
                  onCheckedChange={() => toggle(role)}
                />
                {areas[role] ?? role}
              </Label>
            ))}
          </div>
        </div>
        <DialogFooter>
          <Button
            variant="ghost"
            onClick={() => setOpen(false)}
            disabled={pending}
          >
            Cancel
          </Button>
          <Button
            disabled={pending}
            onClick={() =>
              start(async () => {
                const result = await createAdmin({
                  email,
                  name,
                  password,
                  roles: granted,
                });
                if (result.error) toast.error(result.error);
                else {
                  toast.success(result.message ?? 'Added.');
                  setOpen(false);
                  setEmail('');
                  setName('');
                  setPassword('');
                  setGranted([]);
                }
              })
            }
          >
            Add administrator
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
