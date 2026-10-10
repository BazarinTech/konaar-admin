'use client';

import * as React from 'react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { subscribeToStatus } from './actions';

/**
 * "Subscribe to updates".
 *
 * Collapsed to a button until somebody asks, because the page's job is to
 * answer one question and a form competing with the banner gets in the way
 * of it.
 *
 * It says plainly that nothing is sent yet. There is no mail provider on
 * this platform, and letting somebody believe they will be told about the
 * next outage — then not telling them — is worse than not offering it.
 */
export function SubscribeForm() {
  const [open, setOpen] = React.useState(false);
  const [email, setEmail] = React.useState('');
  const [pending, start] = React.useTransition();
  const [done, setDone] = React.useState(false);

  function submit(event: React.FormEvent) {
    event.preventDefault();
    start(async () => {
      const result = await subscribeToStatus(email.trim());
      if (result.error) {
        toast.error(result.error);
        return;
      }
      setDone(true);
      setEmail('');
    });
  }

  if (done) {
    return (
      <p className="text-muted-foreground max-w-56 text-right text-xs">
        You are on the list. Notices are not going out yet — this page is the
        place to check until they are.
      </p>
    );
  }

  if (!open) {
    return (
      <Button variant="outline" size="sm" onClick={() => setOpen(true)}>
        Subscribe to updates
      </Button>
    );
  }

  return (
    <form onSubmit={submit} className="flex flex-col items-end gap-1.5">
      <div className="flex gap-2">
        <Input
          type="email"
          required
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          placeholder="you@company.com"
          aria-label="Email address"
          className="h-8 w-56 text-xs"
        />
        <Button type="submit" size="sm" disabled={pending}>
          {pending ? 'Saving…' : 'Subscribe'}
        </Button>
      </div>
      <p className="text-muted-foreground max-w-64 text-right text-[11px]">
        We will record your address. Email notices are not switched on yet.
      </p>
    </form>
  );
}
