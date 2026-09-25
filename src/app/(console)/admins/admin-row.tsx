'use client';

import { useState, useTransition } from 'react';
import { toast } from 'sonner';
import {
  KeyRoundIcon,
  MoreHorizontalIcon,
  PauseIcon,
  PlayIcon,
  ShieldIcon,
  Trash2Icon,
} from 'lucide-react';
import {
  removeAdmin,
  resetPassword,
  setRoles,
  setStatus,
  type ActionResult,
} from './actions';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import type { AdminRecord } from './page';

export function AdminRow({
  admin,
  allRoles,
  areas,
  isSelf,
}: {
  admin: AdminRecord;
  allRoles: string[];
  areas: Record<string, string>;
  isSelf: boolean;
}) {
  const [pending, start] = useTransition();
  const [rolesOpen, setRolesOpen] = useState(false);
  const [granted, setGranted] = useState(admin.roles);
  const [passwordOpen, setPasswordOpen] = useState(false);
  const [password, setPassword] = useState('');

  const report = (result: ActionResult, onOk?: () => void) => {
    if (result.error) toast.error(result.error);
    else {
      toast.success(result.message ?? 'Done.');
      onOk?.();
    }
  };

  const toggle = (role: string) =>
    setGranted((current) =>
      current.includes(role)
        ? current.filter((value) => value !== role)
        : [...current, role],
    );

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon" disabled={pending}>
            <MoreHorizontalIcon className="size-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onSelect={() => setRolesOpen(true)}>
            <ShieldIcon />
            Change areas
          </DropdownMenuItem>
          <DropdownMenuItem onSelect={() => setPasswordOpen(true)}>
            <KeyRoundIcon />
            Set a new password
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          {admin.status === 'active' ? (
            <DropdownMenuItem
              disabled={isSelf}
              onSelect={() =>
                start(async () => report(await setStatus(admin.id, 'suspended')))
              }
            >
              <PauseIcon />
              Suspend
            </DropdownMenuItem>
          ) : (
            <DropdownMenuItem
              onSelect={() =>
                start(async () => report(await setStatus(admin.id, 'active')))
              }
            >
              <PlayIcon />
              Restore
            </DropdownMenuItem>
          )}
          <DropdownMenuItem
            variant="destructive"
            disabled={isSelf}
            onSelect={() =>
              start(async () => report(await removeAdmin(admin.id)))
            }
          >
            <Trash2Icon />
            Remove
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <Dialog open={rolesOpen} onOpenChange={setRolesOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Areas for {admin.name}</DialogTitle>
            <DialogDescription>
              Takes effect the next time they sign in — a token already issued
              carries the areas it was signed with.
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col gap-2 text-left">
            {allRoles.map((role) => (
              <Label key={role} className="text-sm font-normal">
                <Switch
                  checked={granted.includes(role)}
                  onCheckedChange={() => toggle(role)}
                />
                {areas[role] ?? role}
              </Label>
            ))}
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setRolesOpen(false)}>
              Cancel
            </Button>
            <Button
              disabled={pending}
              onClick={() =>
                start(async () =>
                  report(await setRoles(admin.id, granted), () =>
                    setRolesOpen(false),
                  ),
                )
              }
            >
              Save areas
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={passwordOpen} onOpenChange={setPasswordOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>New password for {admin.name}</DialogTitle>
            <DialogDescription>
              Their existing sessions keep working until the token expires. Send
              this over something other than email.
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor={`password-${admin.id}`}>Password</Label>
            <Input
              id={`password-${admin.id}`}
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              autoFocus
            />
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setPasswordOpen(false)}>
              Cancel
            </Button>
            <Button
              disabled={pending}
              onClick={() =>
                start(async () =>
                  report(await resetPassword(admin.id, password), () => {
                    setPasswordOpen(false);
                    setPassword('');
                  }),
                )
              }
            >
              Set password
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
