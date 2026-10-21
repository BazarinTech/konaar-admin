'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { EyeIcon, SendIcon, UsersIcon } from 'lucide-react';
import { count } from '@/lib/format';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { RichEditor } from '@/components/email/rich-editor';
import { HtmlFrame } from '@/components/email/html-frame';
import { countAudience, previewBroadcast, sendCampaign } from '../actions';
import { AUDIENCE_LABEL, type Audience, type AudienceStatus, type MyMailbox } from '../types';

const PLATFORM = '__platform__';
const ANY_PLAN = '__any__';

export function CampaignComposer({
  mailboxes,
  plans,
}: {
  mailboxes: MyMailbox[];
  plans: { code: string; name: string }[];
}) {
  const router = useRouter();
  const [subject, setSubject] = React.useState('');
  const [body, setBody] = React.useState('');
  const [from, setFrom] = React.useState<string>(mailboxes[0]?.id ?? PLATFORM);
  const [audience, setAudience] = React.useState<Audience>({
    status: 'all',
    plan: null,
    includeOptedOut: false,
  });
  // Each answer remembers which audience it was for, so a stale count is
  // never shown against a newer choice.
  const [counted, setCounted] = React.useState<{
    key: string;
    recipients: number;
    optedOut: number;
  } | null>(null);
  const audienceKey = JSON.stringify(audience);
  const reach = counted?.key === audienceKey ? counted : null;
  const [rendered, setRendered] = React.useState<string | null>(null);
  const preview = body ? rendered : null;
  const [confirming, setConfirming] = React.useState(false);
  const [pending, start] = React.useTransition();

  // The recipient count follows the audience as it is chosen, so the number
  // in the confirm step is never a surprise.
  React.useEffect(() => {
    let live = true;
    void countAudience(audience).then((r) => {
      if (live && r.data) setCounted({ key: JSON.stringify(audience), ...r.data });
    });
    return () => {
      live = false;
    };
  }, [audience]);

  // The preview is rendered by the API with the real email frame, debounced
  // so typing does not send a request per keystroke.
  React.useEffect(() => {
    if (!body) return;
    const id = window.setTimeout(() => {
      void previewBroadcast(body, audience.includeOptedOut).then((r) => {
        if (r.data) setRendered(r.data.html);
      });
    }, 500);
    return () => window.clearTimeout(id);
  }, [body, audience.includeOptedOut]);

  const ready = subject.trim().length > 0 && body.length > 0 && (reach?.recipients ?? 0) > 0;
  const sender = mailboxes.find((m) => m.id === from);

  const send = () =>
    start(async () => {
      const r = await sendCampaign({
        subject: subject.trim(),
        html: body,
        audience,
        mailboxId: from === PLATFORM ? null : from,
      });
      if (r.error) {
        toast.error(r.error);
        return;
      }
      toast.success(r.message ?? 'Sending.');
      setConfirming(false);
      router.push('/email');
    });

  return (
    <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
      <div className="flex min-w-0 flex-col gap-4">
        <Card>
          <CardHeader>
            <CardTitle>Message</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
            <Field label="From">
              <Select value={from} onValueChange={setFrom}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {mailboxes.map((m) => (
                    <SelectItem key={m.id} value={m.id}>
                      {m.displayName} &lt;{m.address}&gt;
                    </SelectItem>
                  ))}
                  <SelectItem value={PLATFORM}>The platform address (replies go to the reply-to)</SelectItem>
                </SelectContent>
              </Select>
              <Hint>
                {sender
                  ? `Replies land in ${sender.address} in the Inbox.`
                  : 'Only mailboxes you are a member of can be chosen.'}
              </Hint>
            </Field>
            <Field label="Subject">
              <Input value={subject} onChange={(e) => setSubject(e.target.value)} maxLength={300} placeholder="What's new in Konaar" />
            </Field>
            <Field label="Body">
              <RichEditor value={body} onChange={setBody} minHeight={260} placeholder="Hi there, …" />
            </Field>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Audience</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
            <div className="grid gap-3 sm:grid-cols-2">
              <Field label="Who">
                <Select
                  value={audience.status}
                  onValueChange={(v) => setAudience((a) => ({ ...a, status: v as AudienceStatus }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {(Object.keys(AUDIENCE_LABEL) as AudienceStatus[]).map((s) => (
                      <SelectItem key={s} value={s}>
                        {AUDIENCE_LABEL[s]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>
              <Field label="Plan">
                <Select
                  value={audience.plan ?? ANY_PLAN}
                  onValueChange={(v) => setAudience((a) => ({ ...a, plan: v === ANY_PLAN ? null : v }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={ANY_PLAN}>Any plan</SelectItem>
                    {plans.map((p) => (
                      <SelectItem key={p.code} value={p.code}>
                        {p.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>
            </div>
            <label className="flex items-start justify-between gap-3 rounded-md border px-3 py-2.5">
              <span className="text-sm">
                Include people who turned product updates off
                <span className="text-muted-foreground block text-xs">
                  Only for notices everyone must get — a terms change, an outage. The unsubscribe line is left
                  off, because it would not apply.
                </span>
              </span>
              <Switch
                checked={audience.includeOptedOut}
                onCheckedChange={(v) => setAudience((a) => ({ ...a, includeOptedOut: v }))}
              />
            </label>
            <div className="bg-muted/40 flex items-center gap-2 rounded-md px-3 py-2.5 text-sm">
              <UsersIcon className="text-muted-foreground size-4" />
              {reach ? (
                <span>
                  <span className="font-semibold tabular">{count(reach.recipients)}</span> recipient
                  {reach.recipients === 1 ? '' : 's'}
                  {reach.optedOut && !audience.includeOptedOut ? (
                    <span className="text-muted-foreground"> · {count(reach.optedOut)} opted out, skipped</span>
                  ) : null}
                </span>
              ) : (
                <span className="text-muted-foreground">Counting…</span>
              )}
            </div>
            {audience.status !== 'banned' ? (
              <Hint>Suspended accounts are left out unless you choose them.</Hint>
            ) : null}
          </CardContent>
        </Card>

        <div className="flex justify-end">
          <Button disabled={!ready || pending} onClick={() => setConfirming(true)}>
            <SendIcon />
            Review and send
          </Button>
        </div>
      </div>

      <Card className="min-w-0 lg:sticky lg:top-20 lg:self-start">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <EyeIcon className="size-4" />
            Preview
          </CardTitle>
          <p className="text-muted-foreground text-xs">
            {subject ? <span className="text-foreground font-medium">{subject}</span> : 'No subject yet'} · as it
            arrives in an inbox
          </p>
        </CardHeader>
        <CardContent>
          {preview ? (
            <HtmlFrame html={preview} className="border" minHeight={360} />
          ) : (
            <div className="text-muted-foreground flex h-80 items-center justify-center rounded-md border border-dashed text-sm">
              Start writing to see the email.
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={confirming} onOpenChange={setConfirming}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Send to {count(reach?.recipients ?? 0)} people?</DialogTitle>
            <DialogDescription>
              “{subject}” goes to {AUDIENCE_LABEL[audience.status].toLowerCase()}
              {audience.plan ? ` on the ${plans.find((p) => p.code === audience.plan)?.name ?? audience.plan} plan` : ''}
              , from {sender ? sender.address : 'the platform address'}. This cannot be recalled.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirming(false)} disabled={pending}>
              Keep editing
            </Button>
            <Button onClick={send} disabled={pending}>
              {pending ? 'Starting…' : `Send to ${count(reach?.recipients ?? 0)}`}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex min-w-0 flex-col gap-1.5">
      <span className="text-muted-foreground text-xs">{label}</span>
      {children}
    </div>
  );
}

function Hint({ children }: { children: React.ReactNode }) {
  return <span className="text-muted-foreground text-[11px]">{children}</span>;
}
