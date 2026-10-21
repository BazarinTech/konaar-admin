'use client';

import * as React from 'react';
import { toast } from 'sonner';
import { LockIcon, SendIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { replyToCase } from '../actions';
import { STATUS_LABEL, type CaseStatus } from '../types';

/**
 * The reply box. A public reply is emailed to the customer and, unless told
 * otherwise, hands the case to them; a note stays inside the team.
 */
export function CaseReply({ id, status, customer }: { id: string; status: CaseStatus; customer: string }) {
  const [mode, setMode] = React.useState<'reply' | 'note'>('reply');
  const [body, setBody] = React.useState('');
  const [then, setThen] = React.useState<CaseStatus>('pending');
  const [pending, start] = React.useTransition();
  const note = mode === 'note';

  const send = () => {
    if (!body.trim() || pending) return;
    start(async () => {
      const r = await replyToCase(id, {
        body,
        internal: note,
        ...(note ? {} : { status: then }),
      });
      if (r.error) toast.error(r.error);
      else {
        toast.success(r.message ?? 'Sent.');
        setBody('');
      }
    });
  };

  return (
    <section className={cn('rounded-lg border p-3', note && 'border-amber-500/40 bg-amber-500/5')}>
      <div className="mb-2 flex gap-1">
        <Button variant={!note ? 'secondary' : 'ghost'} size="sm" onClick={() => setMode('reply')}>
          <SendIcon />
          Reply to {customer.split(' ')[0]}
        </Button>
        <Button variant={note ? 'secondary' : 'ghost'} size="sm" onClick={() => setMode('note')}>
          <LockIcon />
          Internal note
        </Button>
      </div>
      <Textarea
        value={body}
        onChange={(e) => setBody(e.target.value)}
        onKeyDown={(e) => {
          if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') send();
        }}
        rows={6}
        placeholder={note ? 'Only the team sees this.' : 'Write your reply. It is emailed to the customer with a link back to the case.'}
      />
      <div className="mt-2 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-end">
        {!note ? (
          <div className="flex items-center gap-2 text-xs">
            <span className="text-muted-foreground">Then</span>
            <Select value={then} onValueChange={(v) => setThen(v as CaseStatus)}>
              <SelectTrigger className="h-8 w-52">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {(['pending', 'open', 'resolved'] as const).map((s) => (
                  <SelectItem key={s} value={s}>
                    {s === 'pending' ? 'Wait for the customer' : s === 'open' ? `Keep: ${STATUS_LABEL.open}` : 'Mark resolved'}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        ) : null}
        <Button size="sm" onClick={send} disabled={pending || !body.trim()}>
          {pending ? 'Sending…' : note ? 'Add note' : 'Send reply'}
        </Button>
      </div>
      {status === 'closed' ? (
        <p className="text-muted-foreground mt-2 text-xs">This case is closed; the customer cannot reply to it.</p>
      ) : null}
    </section>
  );
}
