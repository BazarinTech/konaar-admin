import Link from 'next/link';
import { SearchIcon } from 'lucide-react';
import { apiPage } from '@/lib/api';
import { ago, count } from '@/lib/format';
import { PageHeader } from '@/components/page-header';
import { Empty } from '@/components/empty';
import { Stat } from '@/components/stat';
import { AutoRefresh } from '@/components/auto-refresh';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { STATUS_LABEL, severityVariant, type CaseList } from './types';

export const metadata = { title: 'Support — Konaar Console' };

const VIEWS = [
  { value: 'open', label: 'Waiting on us' },
  { value: 'pending', label: 'Waiting on customer' },
  { value: 'resolved', label: 'Resolved' },
  { value: 'closed', label: 'Closed' },
  { value: '', label: 'All' },
] as const;

const ASSIGNED = [
  { value: '', label: 'Everyone' },
  { value: 'me', label: 'Mine' },
  { value: 'unassigned', label: 'Unassigned' },
] as const;

export default async function SupportQueuePage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const one = (key: string) => {
    const v = params[key];
    return Array.isArray(v) ? v[0] : v;
  };
  const status = one('status') ?? 'open';
  const assigned = one('assigned') ?? '';
  const severity = one('severity') ?? '';
  const query = one('query') ?? '';

  const search = new URLSearchParams();
  if (status) search.set('status', status);
  if (assigned) search.set('assigned', assigned);
  if (severity) search.set('severity', severity);
  if (query) search.set('query', query);
  const list = await apiPage<CaseList>(`/admin/support/cases?${search}`);

  const link = (patch: Record<string, string>) => ({
    pathname: '/support' as const,
    query: Object.fromEntries(
      Object.entries({ status, assigned, severity, query, ...patch }).filter(([k, v]) => v !== '' || k === 'status'),
    ),
  });

  return (
    <>
      <AutoRefresh seconds={30} />
      <PageHeader
        title="Support"
        description="Cases customers opened, most urgent and longest waiting first. Every public reply is emailed to them."
      />

      <div className="mb-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Stat label="Waiting on us" value={count(list.counts.open ?? 0)} tone={(list.counts.open ?? 0) > 0 ? 'warning' : 'default'} />
        <Stat
          label="Urgent (severity 1–2)"
          value={count(list.urgent)}
          tone={list.urgent > 0 ? 'negative' : 'default'}
          hint="Waiting on us"
        />
        <Stat label="Waiting on customer" value={count(list.counts.pending ?? 0)} />
        <Stat label="Resolved" value={count(list.counts.resolved ?? 0)} />
      </div>

      <div className="mb-4 flex flex-col gap-3">
        <div className="flex flex-wrap gap-1.5">
          {VIEWS.map((v) => (
            <Button key={v.label} variant={status === v.value ? 'secondary' : 'ghost'} size="sm" asChild>
              <Link href={link({ status: v.value })}>
                {v.label}
                {v.value && list.counts[v.value as keyof typeof list.counts] ? (
                  <span className="text-muted-foreground tabular">{list.counts[v.value as keyof typeof list.counts]}</span>
                ) : null}
              </Link>
            </Button>
          ))}
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <form action="/support" className="relative w-full max-w-sm">
            <input type="hidden" name="status" value={status} />
            {assigned ? <input type="hidden" name="assigned" value={assigned} /> : null}
            {severity ? <input type="hidden" name="severity" value={severity} /> : null}
            <SearchIcon className="text-muted-foreground pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2" />
            <Input name="query" defaultValue={query} placeholder="Search subject, customer or #number" className="pl-8" />
          </form>
          <div className="flex flex-wrap gap-1">
            {ASSIGNED.map((a) => (
              <Button key={a.label} variant={assigned === a.value ? 'secondary' : 'ghost'} size="sm" asChild>
                <Link href={link({ assigned: a.value })}>{a.label}</Link>
              </Button>
            ))}
          </div>
          <div className="flex flex-wrap gap-1">
            {['', '1', '2', '3', '4'].map((s) => (
              <Button key={s || 'any'} variant={severity === s ? 'secondary' : 'ghost'} size="sm" asChild>
                <Link href={link({ severity: s })}>{s ? `Sev ${s}` : 'Any severity'}</Link>
              </Button>
            ))}
          </div>
        </div>
      </div>

      {list.items.length === 0 ? (
        <Empty>{status === 'open' && !query ? 'Nothing is waiting on you.' : 'No cases match.'}</Empty>
      ) : (
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Case</TableHead>
                  <TableHead className="hidden md:table-cell">Customer</TableHead>
                  <TableHead>Severity</TableHead>
                  <TableHead className="hidden lg:table-cell">Assigned</TableHead>
                  <TableHead className="hidden sm:table-cell">Last activity</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {list.items.map((c) => (
                  <TableRow key={c.id} className="relative">
                    <TableCell className="max-w-0 whitespace-normal">
                      <Link href={`/support/${c.id}`} className="after:absolute after:inset-0">
                        <span className="font-medium">{c.subject}</span>
                      </Link>
                      <div className="text-muted-foreground mt-0.5 flex flex-wrap items-center gap-x-2 text-xs">
                        <span className="font-mono">{c.number}</span>
                        <span>{c.area}</span>
                        {status === '' ? <span>· {STATUS_LABEL[c.status]}</span> : null}
                      </div>
                    </TableCell>
                    <TableCell className="hidden text-xs md:table-cell">
                      <div>{c.customer}</div>
                      <div className="text-muted-foreground">{c.email}</div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={severityVariant(c.severity)}>Sev {c.severity}</Badge>
                    </TableCell>
                    <TableCell className="text-muted-foreground hidden text-xs lg:table-cell">
                      {c.assignee ?? 'Unassigned'}
                    </TableCell>
                    <TableCell className="text-muted-foreground hidden text-xs sm:table-cell">{ago(c.lastActivityAt)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </>
  );
}
