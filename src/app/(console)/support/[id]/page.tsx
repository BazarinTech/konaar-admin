import Link from 'next/link';
import { ArrowLeftIcon, ExternalLinkIcon, SparklesIcon } from 'lucide-react';
import { apiPage } from '@/lib/api';
import { date, dateTime } from '@/lib/format';
import { cn } from '@/lib/utils';
import { AutoRefresh } from '@/components/auto-refresh';
import { Markdown } from '@/components/markdown';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CaseControls } from './case-controls';
import { CaseReply } from './case-reply';
import { STATUS_LABEL, severityVariant, type Agent, type CaseDetail, type CaseMessage } from '../types';

export const metadata = { title: 'Support case — Konaar Console' };

export default async function SupportCasePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [c, agents] = await Promise.all([
    apiPage<CaseDetail>(`/admin/support/cases/${id}`),
    apiPage<{ data: Agent[] }>('/admin/support/agents'),
  ]);

  return (
    <>
      <AutoRefresh seconds={30} />
      <Button variant="ghost" size="sm" asChild className="mb-4 -ml-2">
        <Link href="/support">
          <ArrowLeftIcon />
          Support
        </Link>
      </Button>

      <div className="mb-6 flex flex-col gap-2">
        <div className="text-muted-foreground flex flex-wrap items-center gap-2 text-xs">
          <span className="font-mono">{c.number}</span>
          <Badge variant={severityVariant(c.severity)}>Severity {c.severity}</Badge>
          <Badge variant="outline">{STATUS_LABEL[c.status]}</Badge>
          <span>{c.area}</span>
        </div>
        <h1 className="text-lg font-semibold tracking-tight [overflow-wrap:anywhere] sm:text-xl">{c.subject}</h1>
      </div>

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_300px]">
        <div className="flex min-w-0 flex-col gap-3">
          <Entry who={c.customer.name} kind="customer" at={c.createdAt} label="Opened the case">
            {c.description}
          </Entry>
          {c.messages.map((m) => (
            <Message key={m.id} m={m} customer={c.customer.name} />
          ))}
          <CaseReply id={c.id} status={c.status} customer={c.customer.name} />
        </div>

        <aside className="flex min-w-0 flex-col gap-4">
          <CaseControls c={c} agents={agents.data} />

          <Card>
            <CardHeader>
              <CardTitle>Customer</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-1.5 text-sm">
              <Link href={`/users/${c.customer.id}`} className="font-medium hover:underline">
                {c.customer.name}
              </Link>
              <span className="text-muted-foreground text-xs [overflow-wrap:anywhere]">{c.customer.email}</span>
              <dl className="text-muted-foreground mt-2 grid grid-cols-[auto_1fr] gap-x-3 gap-y-1 text-xs">
                <dt>Workspace</dt>
                <dd className="text-foreground truncate">{c.customer.workspace ?? '—'}</dd>
                <dt>Plan</dt>
                <dd className="text-foreground">{c.customer.plan ?? '—'}</dd>
                <dt>Email</dt>
                <dd className="text-foreground">{c.customer.verified ? 'Confirmed' : 'Not confirmed'}</dd>
                <dt>Since</dt>
                <dd className="text-foreground">{date(c.customer.since)}</dd>
                <dt>Project</dt>
                <dd className="text-foreground truncate">{c.project?.name ?? '—'}</dd>
              </dl>
              {c.deploymentUrl ? (
                <a
                  href={c.deploymentUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary mt-1 inline-flex items-center gap-1 text-xs hover:underline"
                >
                  <span className="truncate">{c.deploymentUrl}</span>
                  <ExternalLinkIcon className="size-3 shrink-0" />
                </a>
              ) : null}
            </CardContent>
          </Card>

          {c.transcript.length ? (
            <Card>
              <CardHeader className="flex-row items-center justify-between">
                <CardTitle className="flex items-center gap-1.5">
                  <SparklesIcon className="size-4" />
                  Before the case
                </CardTitle>
                {c.chatId ? (
                  <Button variant="ghost" size="sm" asChild>
                    <Link href={`/support/chats/${c.chatId}`}>Open</Link>
                  </Button>
                ) : null}
              </CardHeader>
              <CardContent>
                <details>
                  <summary className="text-muted-foreground cursor-pointer text-xs">
                    {c.transcript.length} messages with the assistant
                  </summary>
                  <ol className="mt-3 flex flex-col gap-3">
                    {c.transcript.map((t) => (
                      <li key={t.id} className={cn('text-xs', t.role === 'user' ? 'bg-muted rounded-md px-2.5 py-2' : '')}>
                        <div className="text-muted-foreground mb-1 text-[11px]">
                          {t.role === 'user' ? c.customer.name : 'Assistant'}
                        </div>
                        {t.role === 'user' ? (
                          <p className="whitespace-pre-wrap [overflow-wrap:anywhere]">{t.content}</p>
                        ) : (
                          <Markdown className="text-xs">{t.content}</Markdown>
                        )}
                      </li>
                    ))}
                  </ol>
                </details>
              </CardContent>
            </Card>
          ) : null}
        </aside>
      </div>
    </>
  );
}

function Message({ m, customer }: { m: CaseMessage; customer: string }) {
  if (m.author === 'system') {
    return (
      <p className="text-muted-foreground py-1 text-center text-xs">
        {m.body} · {dateTime(m.createdAt)}
      </p>
    );
  }
  return (
    <Entry
      who={m.author === 'customer' ? customer : (m.authorName ?? 'Administrator')}
      kind={m.internal ? 'note' : m.author === 'customer' ? 'customer' : 'admin'}
      at={m.createdAt}
      label={m.internal ? 'Internal note' : m.via === 'email' ? 'by email' : undefined}
    >
      {m.body}
    </Entry>
  );
}

function Entry({
  who,
  kind,
  at,
  label,
  children,
}: {
  who: string;
  kind: 'customer' | 'admin' | 'note';
  at: string;
  label?: string;
  children: string;
}) {
  return (
    <article
      className={cn(
        'rounded-lg border p-4',
        kind === 'admin' && 'bg-muted/40',
        kind === 'note' && 'border-amber-500/40 bg-amber-500/10',
      )}
    >
      <header className="text-muted-foreground mb-2 flex flex-wrap items-center justify-between gap-2 text-xs">
        <span>
          <span className="text-foreground font-medium">{who}</span>
          {label ? ` · ${label}` : ''}
        </span>
        <time dateTime={at}>{dateTime(at)}</time>
      </header>
      <p className="text-sm leading-relaxed whitespace-pre-wrap [overflow-wrap:anywhere]">{children}</p>
    </article>
  );
}
