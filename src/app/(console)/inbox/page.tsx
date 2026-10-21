import Link from 'next/link';
import { ArchiveIcon, InboxIcon, SearchIcon, Settings2Icon } from 'lucide-react';
import { apiPage } from '@/lib/api';
import { currentAdmin } from '@/lib/session';
import { ago } from '@/lib/format';
import { cn } from '@/lib/utils';
import { PageHeader } from '@/components/page-header';
import { Empty } from '@/components/empty';
import { AutoRefresh } from '@/components/auto-refresh';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { MailboxSwitcher } from './mailbox-switcher';
import { ComposeDialog } from './compose-dialog';
import { ThreadView } from './thread-view';
import type { MyMailbox, Thread, ThreadSummary } from '../email/types';

export const metadata = { title: 'Inbox — Konaar Console' };

export default async function InboxPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const one = (key: string) => {
    const v = params[key];
    return Array.isArray(v) ? v[0] : v;
  };
  const [admin, mine] = await Promise.all([
    currentAdmin(),
    apiPage<{ data: MyMailbox[] }>('/admin/email/inbox'),
  ]);
  const manages = admin.roles.includes('admins');

  if (mine.data.length === 0) {
    return (
      <>
        <PageHeader
          title="Inbox"
          description="Shared mailboxes like support@ — read and answered here."
        >
          {manages ? (
            <Button variant="outline" size="sm" asChild>
              <Link href="/admins/mailboxes">
                <Settings2Icon />
                Manage mailboxes
              </Link>
            </Button>
          ) : null}
        </PageHeader>
        <Empty>
          {manages
            ? 'You are not a member of any mailbox. Create one, or add yourself to one, under Manage mailboxes.'
            : 'You have not been given access to a mailbox. An administrator who manages mailboxes can add you.'}
        </Empty>
      </>
    );
  }

  const mailbox = mine.data.find((m) => m.id === one('m')) ?? mine.data[0];
  const status = one('status') === 'archived' ? 'archived' : 'open';
  const query = one('q') ?? '';
  const threadId = one('t');

  const search = new URLSearchParams({ status });
  if (query) search.set('query', query);
  const [threads, thread] = await Promise.all([
    apiPage<{ items: ThreadSummary[]; nextCursor: string | null }>(
      `/admin/email/inbox/${mailbox.id}/threads?${search}`,
    ),
    threadId ? apiPage<Thread>(`/admin/email/threads/${threadId}`) : Promise.resolve(null),
  ]);

  const link = (patch: Record<string, string | undefined>) => ({
    pathname: '/inbox' as const,
    query: Object.fromEntries(
      Object.entries({ m: mailbox.id, status, q: query || undefined, ...patch }).filter(
        ([, v]) => v !== undefined && v !== '',
      ),
    ) as Record<string, string>,
  });

  return (
    <>
      <AutoRefresh seconds={30} />
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <MailboxSwitcher mailboxes={mine.data} current={mailbox.id} />
        <div className="ml-auto flex items-center gap-2">
          {manages ? (
            <Button variant="ghost" size="sm" asChild>
              <Link href="/admins/mailboxes">
                <Settings2Icon />
                <span className="hidden sm:inline">Mailboxes</span>
              </Link>
            </Button>
          ) : null}
          <ComposeDialog mailbox={mailbox} />
        </div>
      </div>

      <div className="bg-card grid overflow-hidden rounded-xl border md:h-[calc(100svh-11rem)] md:grid-cols-[minmax(260px,340px)_1fr]">
        {/* The list. On a phone it gives way to the open conversation. */}
        <aside className={cn('flex min-h-0 flex-col border-r', thread && 'hidden md:flex')}>
          <div className="flex flex-col gap-2 border-b p-3">
            <div className="flex gap-1">
              <Button variant={status === 'open' ? 'secondary' : 'ghost'} size="sm" asChild className="flex-1">
                <Link href={link({ status: 'open', t: undefined })}>
                  <InboxIcon />
                  Inbox
                </Link>
              </Button>
              <Button variant={status === 'archived' ? 'secondary' : 'ghost'} size="sm" asChild className="flex-1">
                <Link href={link({ status: 'archived', t: undefined })}>
                  <ArchiveIcon />
                  Archived
                </Link>
              </Button>
            </div>
            <form action="/inbox" className="relative">
              <input type="hidden" name="m" value={mailbox.id} />
              <input type="hidden" name="status" value={status} />
              <SearchIcon className="text-muted-foreground pointer-events-none absolute top-1/2 left-2.5 size-3.5 -translate-y-1/2" />
              <Input name="q" defaultValue={query} placeholder="Search sender or subject" className="h-8 pl-8 text-sm" />
            </form>
          </div>

          <div className="min-h-0 flex-1 overflow-y-auto">
            {threads.items.length === 0 ? (
              <p className="text-muted-foreground px-4 py-10 text-center text-sm">
                {query ? 'Nothing matches that search.' : status === 'archived' ? 'Nothing archived.' : 'No conversations yet.'}
              </p>
            ) : (
              <ul className="divide-y">
                {threads.items.map((t) => {
                  const active = t.id === thread?.id;
                  return (
                    <li key={t.id}>
                      <Link
                        href={link({ t: t.id })}
                        aria-current={active ? 'true' : undefined}
                        className={cn(
                          'hover:bg-accent/50 flex flex-col gap-0.5 px-4 py-3 transition-colors',
                          active && 'bg-accent',
                        )}
                      >
                        <span className="flex items-center gap-2">
                          {t.unread > 0 ? <span className="bg-primary size-2 shrink-0 rounded-full" aria-label="Unread" /> : null}
                          <span className={cn('min-w-0 flex-1 truncate text-sm', t.unread > 0 ? 'font-semibold' : 'font-medium')}>
                            {t.counterpartName ?? t.counterpart}
                          </span>
                          <span className="text-muted-foreground shrink-0 text-[11px]">{ago(t.lastMessageAt)}</span>
                        </span>
                        <span className={cn('truncate text-xs', t.unread > 0 ? 'text-foreground' : 'text-foreground/80')}>
                          {t.subject}
                          {t.messageCount > 1 ? <span className="text-muted-foreground"> · {t.messageCount}</span> : null}
                        </span>
                        <span className="text-muted-foreground line-clamp-1 text-xs">{t.snippet}</span>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </aside>

        <section className={cn('min-h-0 min-w-0', !thread && 'hidden md:block')}>
          {thread ? (
            <ThreadView
              key={thread.id}
              thread={thread}
              mailbox={mailbox}
              backHref={link({ t: undefined })}
            />
          ) : (
            <div className="text-muted-foreground flex h-full items-center justify-center p-10 text-sm">
              Pick a conversation to read it.
            </div>
          )}
        </section>
      </div>
    </>
  );
}
