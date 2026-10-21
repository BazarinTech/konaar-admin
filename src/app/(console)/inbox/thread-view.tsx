'use client';

import * as React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import {
  ArchiveIcon,
  ArrowLeftIcon,
  InboxIcon,
  MailIcon,
  PaperclipIcon,
  SendIcon,
} from 'lucide-react';
import type { UrlObject } from 'url';
import { dateTime } from '@/lib/format';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { RichEditor } from '@/components/email/rich-editor';
import { HtmlFrame } from '@/components/email/html-frame';
import {
  attachmentLink,
  markThreadUnread,
  replyToThread,
  setThreadStatus,
} from '../email/actions';
import { statusVariant, type MyMailbox, type Thread, type ThreadMessage } from '../email/types';
import { parseAddresses } from './addresses';

/** One conversation: every message in order, and the reply box under them. */
export function ThreadView({
  thread,
  mailbox,
  backHref,
}: {
  thread: Thread;
  mailbox: MyMailbox;
  backHref: UrlObject;
}) {
  const router = useRouter();
  const [pending, start] = React.useTransition();
  const [reply, setReply] = React.useState('');
  const [cc, setCc] = React.useState('');
  const [showCc, setShowCc] = React.useState(false);
  const bottom = React.useRef<HTMLDivElement>(null);

  // Opening a conversation shows the newest message, like every mail client.
  React.useEffect(() => {
    bottom.current?.scrollIntoView({ block: 'end' });
  }, []);

  const run = (fn: () => Promise<{ error?: string; message?: string }>, after?: () => void) =>
    start(async () => {
      const r = await fn();
      if (r.error) toast.error(r.error);
      else {
        if (r.message) toast.success(r.message);
        after?.();
        router.refresh();
      }
    });

  const send = () => {
    if (!reply || pending) return;
    const ccList = parseAddresses(cc);
    if (ccList.invalid.length) {
      toast.error(`Not an email address: ${ccList.invalid.join(', ')}`);
      return;
    }
    run(() => replyToThread(thread.id, reply, ccList.valid), () => {
      setReply('');
      setCc('');
    });
  };

  const disabled = mailbox.status !== 'active';

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="flex items-start gap-2 border-b px-4 py-3">
        <Button variant="ghost" size="icon" asChild className="-ml-2 md:hidden">
          <Link href={backHref} aria-label="Back to conversations">
            <ArrowLeftIcon />
          </Link>
        </Button>
        <div className="min-w-0 flex-1">
          <h2 className="text-base font-semibold tracking-tight [overflow-wrap:anywhere]">
            {thread.subject}
          </h2>
          <p className="text-muted-foreground mt-0.5 truncate text-xs">
            With {thread.counterpartName ? `${thread.counterpartName} · ` : ''}
            {thread.counterpart}
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-0.5">
          <Button
            variant="ghost"
            size="icon"
            title="Mark unread"
            aria-label="Mark unread"
            disabled={pending}
            onClick={() => run(() => markThreadUnread(thread.id), () => router.push(`/inbox?m=${mailbox.id}`))}
          >
            <MailIcon />
          </Button>
          {thread.status === 'open' ? (
            <Button
              variant="ghost"
              size="icon"
              title="Archive"
              aria-label="Archive"
              disabled={pending}
              onClick={() => run(() => setThreadStatus(thread.id, 'archived'), () => router.push(`/inbox?m=${mailbox.id}`))}
            >
              <ArchiveIcon />
            </Button>
          ) : (
            <Button
              variant="ghost"
              size="icon"
              title="Move to inbox"
              aria-label="Move to inbox"
              disabled={pending}
              onClick={() => run(() => setThreadStatus(thread.id, 'open'))}
            >
              <InboxIcon />
            </Button>
          )}
        </div>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto px-4 py-4">
        <ol className="flex flex-col gap-4">
          {thread.messages.map((m) => (
            <li key={m.id}>
              <Message message={m} />
            </li>
          ))}
        </ol>
        <div ref={bottom} />
      </div>

      <div className="border-t p-3">
        {disabled ? (
          <p className="text-muted-foreground text-center text-xs">
            This mailbox is disabled, so it cannot send. An administrator can turn it back on.
          </p>
        ) : (
          <div className="flex flex-col gap-2">
            <div className="text-muted-foreground flex items-center gap-2 text-xs">
              <span className="truncate">
                Reply to <span className="text-foreground">{thread.counterpart}</span> as{' '}
                <span className="text-foreground">{mailbox.address}</span>
              </span>
              {!showCc ? (
                <button type="button" className="hover:text-foreground ml-auto shrink-0 underline-offset-2 hover:underline" onClick={() => setShowCc(true)}>
                  Add Cc
                </button>
              ) : null}
            </div>
            {showCc ? (
              <Input
                value={cc}
                onChange={(e) => setCc(e.target.value)}
                placeholder="Cc — addresses separated by commas"
                className="h-8 text-sm"
              />
            ) : null}
            <RichEditor value={reply} onChange={setReply} placeholder="Write a reply…" minHeight={96} onSubmitShortcut={send} />
            <div className="flex items-center justify-between gap-2">
              <span className="text-muted-foreground hidden text-[11px] sm:inline">
                The mailbox signature and the message you are answering are added below your reply.
              </span>
              <Button size="sm" onClick={send} disabled={pending || !reply} className="ml-auto">
                <SendIcon />
                {pending ? 'Sending…' : 'Send reply'}
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function Message({ message: m }: { message: ThreadMessage }) {
  const ours = m.direction === 'out';
  const name = m.fromName ?? m.from;
  return (
    <article className={cn('rounded-lg border', ours ? 'bg-muted/40' : 'bg-background')}>
      <header className="flex flex-wrap items-start gap-x-3 gap-y-1 border-b px-3 py-2.5">
        <span
          className={cn(
            'flex size-8 shrink-0 items-center justify-center rounded-full text-xs font-semibold',
            ours ? 'bg-primary text-primary-foreground' : 'bg-accent text-accent-foreground',
          )}
          aria-hidden
        >
          {name.slice(0, 1).toUpperCase()}
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-x-2 text-sm">
            <span className="font-medium">{name}</span>
            {m.fromName ? <span className="text-muted-foreground truncate text-xs">{m.from}</span> : null}
            {ours && m.sentBy ? <span className="text-muted-foreground text-xs">· sent by {m.sentBy}</span> : null}
          </div>
          <div className="text-muted-foreground truncate text-xs">
            To {m.to.join(', ')}
            {m.cc.length ? ` · Cc ${m.cc.join(', ')}` : ''}
          </div>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          {ours ? <Badge variant={statusVariant(m.status)}>{m.status}</Badge> : null}
          <time className="text-muted-foreground text-xs" dateTime={m.createdAt}>
            {dateTime(m.createdAt)}
          </time>
        </div>
      </header>
      <div className="px-3 py-3">
        {m.html ? (
          <HtmlFrame html={m.html} />
        ) : (
          <p className="text-sm whitespace-pre-wrap [overflow-wrap:anywhere]">{m.text}</p>
        )}
        {m.error ? <p className="text-destructive mt-2 text-xs">{m.error}</p> : null}
        {m.attachments.length ? (
          <div className="mt-3 flex flex-wrap gap-2">
            {m.attachments.map((a) => (
              <AttachmentChip key={a.id} messageId={m.id} attachment={a} />
            ))}
          </div>
        ) : null}
      </div>
    </article>
  );
}

function AttachmentChip({
  messageId,
  attachment,
}: {
  messageId: string;
  attachment: ThreadMessage['attachments'][number];
}) {
  const [pending, start] = React.useTransition();
  return (
    <button
      type="button"
      disabled={pending}
      onClick={() =>
        start(async () => {
          const r = await attachmentLink(messageId, attachment.id);
          if (r.error || !r.data) toast.error(r.error ?? 'Could not open the attachment.');
          else window.open(r.data.url, '_blank', 'noopener,noreferrer');
        })
      }
      className="hover:bg-accent flex max-w-full items-center gap-2 rounded-md border px-2.5 py-1.5 text-xs transition-colors disabled:opacity-60"
    >
      <PaperclipIcon className="size-3.5 shrink-0" />
      <span className="truncate">{attachment.filename}</span>
      {attachment.size ? (
        <span className="text-muted-foreground shrink-0">{Math.max(1, Math.round(attachment.size / 1024))} KB</span>
      ) : null}
    </button>
  );
}
