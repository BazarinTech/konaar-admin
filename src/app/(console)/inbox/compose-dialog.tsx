'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { PenSquareIcon, SendIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { RichEditor } from '@/components/email/rich-editor';
import { composeEmail } from '../email/actions';
import type { MyMailbox } from '../email/types';
import { parseAddresses } from './addresses';

/** A new conversation, started from a shared mailbox. */
export function ComposeDialog({ mailbox }: { mailbox: MyMailbox }) {
  const router = useRouter();
  const [open, setOpen] = React.useState(false);
  const [to, setTo] = React.useState('');
  const [cc, setCc] = React.useState('');
  const [subject, setSubject] = React.useState('');
  const [body, setBody] = React.useState('');
  const [pending, start] = React.useTransition();

  const send = () => {
    const toList = parseAddresses(to);
    const ccList = parseAddresses(cc);
    const invalid = [...toList.invalid, ...ccList.invalid];
    if (invalid.length) {
      toast.error(`Not an email address: ${invalid.join(', ')}`);
      return;
    }
    if (!toList.valid.length || !subject.trim() || !body) return;
    start(async () => {
      const r = await composeEmail(mailbox.id, {
        to: toList.valid,
        cc: ccList.valid,
        subject: subject.trim(),
        html: body,
      });
      if (r.error) {
        toast.error(r.error);
        return;
      }
      toast.success(r.message ?? 'Sent.');
      setOpen(false);
      setTo('');
      setCc('');
      setSubject('');
      setBody('');
      if (r.data) router.push(`/inbox?m=${mailbox.id}&t=${r.data.threadId}`);
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" disabled={mailbox.status !== 'active'}>
          <PenSquareIcon />
          Compose
        </Button>
      </DialogTrigger>
      <DialogContent className="max-h-[92svh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>New email</DialogTitle>
          <DialogDescription>
            From {mailbox.displayName} &lt;{mailbox.address}&gt;. Replies come back to this mailbox.
          </DialogDescription>
        </DialogHeader>
        <div className="flex flex-col gap-2">
          <Input value={to} onChange={(e) => setTo(e.target.value)} placeholder="To — addresses separated by commas" autoFocus />
          <Input value={cc} onChange={(e) => setCc(e.target.value)} placeholder="Cc (optional)" />
          <Input value={subject} onChange={(e) => setSubject(e.target.value)} placeholder="Subject" maxLength={300} />
          <RichEditor value={body} onChange={setBody} minHeight={220} onSubmitShortcut={send} />
        </div>
        <DialogFooter>
          <span className="text-muted-foreground mr-auto hidden self-center text-[11px] sm:inline">⌘/Ctrl + Enter sends</span>
          <Button onClick={send} disabled={pending || !to.trim() || !subject.trim() || !body}>
            <SendIcon />
            {pending ? 'Sending…' : 'Send'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
