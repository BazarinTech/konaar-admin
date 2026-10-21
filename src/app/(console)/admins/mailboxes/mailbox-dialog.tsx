'use client';

import * as React from 'react';
import { toast } from 'sonner';
import { PencilIcon, PlusIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { saveMailbox } from '../../email/actions';
import type { ManagedMailbox } from '../../email/types';

interface Person {
  id: string;
  name: string;
  email: string;
}

/** Create a mailbox, or change its name, signature, members and state. */
export function MailboxDialog({
  domains,
  people,
  me,
  mailbox,
}: {
  domains: string[];
  people: Person[];
  me: string;
  mailbox?: ManagedMailbox;
}) {
  const [open, setOpen] = React.useState(false);
  const [local, setLocal] = React.useState(mailbox ? '' : 'support');
  const [domain, setDomain] = React.useState(domains[0] ?? '');
  const [displayName, setDisplayName] = React.useState(mailbox?.displayName ?? 'Konaar Support');
  const [signature, setSignature] = React.useState(mailbox?.signature ?? '');
  // A new mailbox starts with its creator in it: the usual reason to make one
  // is to read it.
  const [members, setMembers] = React.useState<string[]>(
    mailbox ? mailbox.members.map((m) => m.id) : [me],
  );
  const [active, setActive] = React.useState(mailbox ? mailbox.status === 'active' : true);
  const [pending, start] = React.useTransition();

  const toggle = (id: string) =>
    setMembers((list) => (list.includes(id) ? list.filter((x) => x !== id) : [...list, id]));

  const submit = () =>
    start(async () => {
      const r = await saveMailbox(
        mailbox?.id ?? null,
        mailbox
          ? {
              displayName: displayName.trim(),
              signature: signature.trim() || null,
              memberIds: members,
              status: active ? 'active' : 'disabled',
            }
          : {
              address: `${local.trim().toLowerCase()}@${domain}`,
              displayName: displayName.trim(),
              signature: signature.trim() || null,
              memberIds: members,
            },
      );
      if (r.error) toast.error(r.error);
      else {
        toast.success(r.message ?? 'Saved.');
        setOpen(false);
      }
    });

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {mailbox ? (
          <Button variant="ghost" size="icon" aria-label={`Edit ${mailbox.address}`}>
            <PencilIcon />
          </Button>
        ) : (
          <Button size="sm">
            <PlusIcon />
            New mailbox
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-h-[90svh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{mailbox ? mailbox.address : 'New mailbox'}</DialogTitle>
          <DialogDescription>
            Mail sent to this address lands in the Inbox of every member. Replies go out from it.
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-4">
          {mailbox ? null : (
            <Field label="Address">
              <div className="flex items-center gap-1.5">
                <Input
                  value={local}
                  onChange={(e) => setLocal(e.target.value.replace(/[^a-zA-Z0-9._+-]/g, ''))}
                  placeholder="support"
                  className="font-mono"
                />
                <span className="text-muted-foreground">@</span>
                {domains.length > 1 ? (
                  <Select value={domain} onValueChange={setDomain}>
                    <SelectTrigger className="w-44">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {domains.map((d) => (
                        <SelectItem key={d} value={d}>
                          {d}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                ) : (
                  <span className="font-mono text-sm">{domain}</span>
                )}
              </div>
            </Field>
          )}

          <Field label="Name people see" hint="Shown as the sender, e.g. “Konaar Support”.">
            <Input value={displayName} onChange={(e) => setDisplayName(e.target.value)} maxLength={80} />
          </Field>

          <Field label="Signature" hint="Added under every reply. Plain text.">
            <Textarea
              value={signature}
              onChange={(e) => setSignature(e.target.value)}
              rows={3}
              placeholder={'The Konaar team\nkonaar.com'}
              maxLength={1000}
            />
          </Field>

          <Field
            label="Who can read it"
            hint={members.length === 0 ? 'Nobody will be able to open it.' : `${members.length} member(s).`}
          >
            <div className="flex flex-wrap gap-1.5">
              {people.map((p) => {
                const on = members.includes(p.id);
                return (
                  <button
                    key={p.id}
                    type="button"
                    aria-pressed={on}
                    title={p.email}
                    onClick={() => toggle(p.id)}
                    className={cn(
                      'rounded-md border px-2 py-1 text-xs transition-colors',
                      on ? 'border-primary bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground',
                    )}
                  >
                    {p.name}
                    {p.id === me ? ' (you)' : ''}
                  </button>
                );
              })}
            </div>
          </Field>

          {mailbox ? (
            <label className="flex items-center justify-between gap-3 rounded-md border px-3 py-2.5">
              <span className="text-sm">
                Active
                <span className="text-muted-foreground block text-xs">
                  A disabled mailbox stops sending and receiving; its history stays.
                </span>
              </span>
              <Switch checked={active} onCheckedChange={setActive} />
            </label>
          ) : null}
        </div>

        <DialogFooter>
          <Button
            onClick={submit}
            disabled={pending || displayName.trim().length < 1 || (!mailbox && local.trim().length < 1)}
          >
            {pending ? 'Saving…' : mailbox ? 'Save changes' : 'Create mailbox'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div className="flex min-w-0 flex-col gap-1.5">
      <span className="text-muted-foreground text-xs">{label}</span>
      {children}
      {hint ? <span className="text-muted-foreground text-[11px]">{hint}</span> : null}
    </div>
  );
}
