'use client';

import * as React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { ExternalLinkIcon, EyeOffIcon, SendIcon, Trash2Icon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Markdown } from '@/components/markdown';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
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
import { deleteEntry, publishEntry, saveEntry, unpublishEntry } from './actions';
import { KIND_LABEL, kindVariant, type ChangelogEntry, type ChangelogKind, type ChangelogMeta } from './types';

/** `2026-10-22` for a date input, from an ISO timestamp. */
const dayOf = (iso: string | null) => (iso ? iso.slice(0, 10) : '');

/**
 * Writing one entry: the facts on the left, how it will read on the right.
 * The body is Markdown — headings, lists, links, images — the same thing
 * the public page renders.
 */
export function EntryEditor({
  entry,
  meta,
  siteUrl,
}: {
  entry: ChangelogEntry | null;
  meta: ChangelogMeta;
  siteUrl: string;
}) {
  const router = useRouter();
  const [title, setTitle] = React.useState(entry?.title ?? '');
  const [kind, setKind] = React.useState<ChangelogKind>(entry?.kind ?? 'feature');
  const [areas, setAreas] = React.useState<string[]>(entry?.areas ?? []);
  const [version, setVersion] = React.useState(entry?.version ?? '');
  const [day, setDay] = React.useState(dayOf(entry?.publishedAt ?? null));
  const [summary, setSummary] = React.useState(entry?.summary ?? '');
  const [body, setBody] = React.useState(entry?.body ?? '');
  const [imageUrl, setImageUrl] = React.useState(entry?.imageUrl ?? '');
  const [tab, setTab] = React.useState<'write' | 'preview'>('write');
  const [publishing, setPublishing] = React.useState(false);
  const [announce, setAnnounce] = React.useState(false);
  const [pending, start] = React.useTransition();

  const published = entry?.status === 'published';
  const valid = title.trim().length >= 3 && summary.trim().length >= 10;

  const input = () => ({
    title: title.trim(),
    kind,
    areas,
    version: version.trim() || null,
    summary: summary.trim(),
    body,
    imageUrl: imageUrl.trim() || null,
    // Noon UTC, so the day shown is the day chosen in every time zone that matters.
    publishedAt: day ? `${day}T12:00:00.000Z` : null,
  });

  /** Save, and return the entry's id (a new entry gets one here). */
  const save = async (): Promise<string | null> => {
    const r = await saveEntry(entry?.id ?? null, input());
    if (r.error || !r.data) {
      toast.error(r.error ?? 'Could not save.');
      return null;
    }
    return r.data.id;
  };

  const onSave = () =>
    start(async () => {
      const id = await save();
      if (!id) return;
      toast.success(published ? 'Saved — the live entry is updated.' : 'Draft saved.');
      if (!entry) router.replace(`/changelog/${id}`);
      else router.refresh();
    });

  const onPublish = () =>
    start(async () => {
      const id = await save();
      if (!id) return;
      const r = await publishEntry(id, announce);
      if (r.error) {
        toast.error(r.error);
        return;
      }
      toast.success(r.message ?? 'Published.');
      setPublishing(false);
      if (!entry) router.replace(`/changelog/${id}`);
      else router.refresh();
    });

  const toggleArea = (id: string) =>
    setAreas((list) => (list.includes(id) ? list.filter((a) => a !== id) : [...list, id]));

  return (
    <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
      <div className="flex min-w-0 flex-col gap-4">
        <Card>
          <CardContent className="flex flex-col gap-4 pt-5">
            <Field label="Title">
              <Input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                maxLength={140}
                placeholder="Deploy previews for every branch"
              />
            </Field>
            <div className="grid gap-3 sm:grid-cols-3">
              <Field label="Type">
                <Select value={kind} onValueChange={(v) => setKind(v as ChangelogKind)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {meta.kinds.map((k) => (
                      <SelectItem key={k} value={k}>
                        {KIND_LABEL[k]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>
              <Field label="Version" hint="Optional">
                <Input value={version} onChange={(e) => setVersion(e.target.value)} maxLength={40} placeholder="v1.4" className="font-mono" />
              </Field>
              <Field label="Release date" hint={day ? undefined : 'Set when you publish'}>
                <Input type="date" value={day} onChange={(e) => setDay(e.target.value)} />
              </Field>
            </div>
            <Field label="Areas" hint={areas.length ? undefined : 'Which parts of Konaar it touches.'}>
              <div className="flex flex-wrap gap-1.5">
                {meta.areas.map((a) => {
                  const on = areas.includes(a.id);
                  return (
                    <button
                      key={a.id}
                      type="button"
                      aria-pressed={on}
                      onClick={() => toggleArea(a.id)}
                      className={cn(
                        'rounded-md border px-2 py-1 text-xs transition-colors',
                        on ? 'border-primary bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground',
                      )}
                    >
                      {a.label}
                    </button>
                  );
                })}
              </div>
            </Field>
            <Field label="Summary" hint={`${summary.length}/400 · shown in the list and in the announcement email`}>
              <Textarea
                value={summary}
                onChange={(e) => setSummary(e.target.value)}
                maxLength={400}
                rows={3}
                placeholder="One or two sentences: what changed, and why it matters to the reader."
              />
            </Field>
            <Field label="Cover image URL" hint="Optional · a screenshot or illustration">
              <Input value={imageUrl} onChange={(e) => setImageUrl(e.target.value)} placeholder="https://…" />
            </Field>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex-row items-center justify-between">
            <CardTitle>Details</CardTitle>
            <div className="flex gap-1">
              <Button variant={tab === 'write' ? 'secondary' : 'ghost'} size="sm" onClick={() => setTab('write')}>
                Write
              </Button>
              <Button variant={tab === 'preview' ? 'secondary' : 'ghost'} size="sm" onClick={() => setTab('preview')}>
                Preview
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {tab === 'write' ? (
              <>
                <Textarea
                  value={body}
                  onChange={(e) => setBody(e.target.value)}
                  rows={16}
                  className="font-mono text-xs"
                  placeholder={'## What changed\n\n- Point one\n- Point two\n\n## How to use it\n\nOpen **Cloud → Deploys** and …'}
                />
                <p className="text-muted-foreground mt-1.5 text-[11px]">
                  Markdown: ## headings, **bold**, - lists, [links](https://…), ![images](https://…), `code`.
                </p>
              </>
            ) : body.trim() ? (
              <Markdown>{body}</Markdown>
            ) : (
              <p className="text-muted-foreground text-sm">Nothing written yet.</p>
            )}
          </CardContent>
        </Card>

        <div className="flex flex-wrap items-center gap-2">
          {entry ? <DangerActions entry={entry} /> : null}
          <div className="ml-auto flex gap-2">
            <Button variant="outline" onClick={onSave} disabled={pending || !valid}>
              {published ? 'Save changes' : 'Save draft'}
            </Button>
            {published ? null : (
              <Button onClick={() => setPublishing(true)} disabled={pending || !valid}>
                <SendIcon />
                Publish
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* How it reads on konaar.dev/changelog. */}
      <Card className="min-w-0 xl:sticky xl:top-20 xl:self-start">
        <CardHeader className="flex-row items-center justify-between">
          <CardTitle>How it will look</CardTitle>
          {published && entry ? (
            <Button variant="ghost" size="sm" asChild>
              <a href={`${siteUrl}/changelog/${entry.slug}`} target="_blank" rel="noopener noreferrer">
                View live
                <ExternalLinkIcon />
              </a>
            </Button>
          ) : (
            <Badge variant="outline">Draft</Badge>
          )}
        </CardHeader>
        <CardContent>
          <article className="flex flex-col gap-3">
            <div className="text-muted-foreground flex flex-wrap items-center gap-2 text-xs">
              <span>{day ? new Date(`${day}T12:00:00Z`).toLocaleDateString(undefined, { dateStyle: 'long' }) : 'Release date'}</span>
              {version ? <span className="font-mono">· {version}</span> : null}
              <Badge variant={kindVariant(kind)}>{KIND_LABEL[kind]}</Badge>
            </div>
            <h2 className="text-xl font-semibold tracking-tight [overflow-wrap:anywhere]">{title || 'Title'}</h2>
            <p className="text-muted-foreground text-sm">{summary || 'The summary appears here.'}</p>
            {imageUrl ? (
              // eslint-disable-next-line @next/next/no-img-element -- any host an operator links to
              <img src={imageUrl} alt="" className="w-full rounded-lg border" />
            ) : null}
            {body.trim() ? <Markdown>{body}</Markdown> : null}
            {areas.length ? (
              <div className="flex flex-wrap gap-1 pt-1">
                {areas.map((id) => (
                  <Badge key={id} variant="secondary">
                    {meta.areas.find((a) => a.id === id)?.label ?? id}
                  </Badge>
                ))}
              </div>
            ) : null}
          </article>
        </CardContent>
      </Card>

      <Dialog open={publishing} onOpenChange={setPublishing}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Publish “{title}”?</DialogTitle>
            <DialogDescription>
              It appears on the public changelog straight away{day ? `, dated ${day}` : ', dated today'}. You can
              edit it afterwards, or move it back to drafts.
            </DialogDescription>
          </DialogHeader>
          <label className="flex items-start justify-between gap-3 rounded-md border px-3 py-2.5">
            <span className="text-sm">
              Also email it to users
              <span className="text-muted-foreground block text-xs">
                Everyone who gets product updates receives the summary and a link. Send this for the big ones.
              </span>
            </span>
            <Switch checked={announce} onCheckedChange={setAnnounce} />
          </label>
          <DialogFooter>
            <Button variant="outline" onClick={() => setPublishing(false)} disabled={pending}>
              Cancel
            </Button>
            <Button onClick={onPublish} disabled={pending}>
              {pending ? 'Publishing…' : announce ? 'Publish and email' : 'Publish'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function DangerActions({ entry }: { entry: ChangelogEntry }) {
  const router = useRouter();
  const [pending, start] = React.useTransition();
  return (
    <div className="flex gap-1">
      {entry.status === 'published' ? (
        <Button
          variant="ghost"
          size="sm"
          disabled={pending}
          onClick={() =>
            start(async () => {
              const r = await unpublishEntry(entry.id);
              if (r.error) toast.error(r.error);
              else {
                toast.success(r.message ?? 'Unpublished.');
                router.refresh();
              }
            })
          }
        >
          <EyeOffIcon />
          Unpublish
        </Button>
      ) : null}
      <Button
        variant="ghost"
        size="sm"
        disabled={pending}
        onClick={() =>
          toast(`Delete “${entry.title}”?`, {
            description: entry.status === 'published' ? 'It disappears from the public changelog.' : 'The draft is gone for good.',
            action: {
              label: 'Delete',
              onClick: () =>
                start(async () => {
                  const r = await deleteEntry(entry.id);
                  if (r.error) toast.error(r.error);
                  else {
                    toast.success('Deleted.');
                    router.push('/changelog');
                  }
                }),
            },
          })
        }
      >
        <Trash2Icon />
        Delete
      </Button>
      <Button variant="ghost" size="sm" asChild>
        <Link href="/changelog">Back</Link>
      </Button>
    </div>
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
