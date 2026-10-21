import Link from 'next/link';
import { ArrowLeftIcon } from 'lucide-react';
import { apiPage } from '@/lib/api';
import { count, percent } from '@/lib/format';
import { PageHeader } from '@/components/page-header';
import { Stat } from '@/components/stat';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { LeadSources, type Acquisition } from './lead-sources';

export const metadata = { title: 'Lead sources — Konaar Console' };

const PERIODS = [
  { days: '30', label: '30 days' },
  { days: '90', label: '90 days' },
  { days: '365', label: '12 months' },
  { days: '0', label: 'All time' },
] as const;

export default async function LeadSourcesPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const raw = Array.isArray(params.days) ? params.days[0] : params.days;
  const days = PERIODS.some((p) => p.days === raw) ? raw! : '30';
  const data = await apiPage<Acquisition>(`/admin/users/acquisition?days=${days}`);
  const top = data.sources.find((s) => s.source !== 'unanswered');
  const paid = data.sources.reduce((n, s) => n + s.paid, 0);

  return (
    <>
      <Button variant="ghost" size="sm" asChild className="mb-4 -ml-2">
        <Link href="/users">
          <ArrowLeftIcon />
          Users
        </Link>
      </Button>
      <PageHeader
        title="Lead sources"
        description="Where people say they heard of Konaar, from the onboarding question — and how far each source's sign-ups get."
      >
        <div className="flex gap-1">
          {PERIODS.map((p) => (
            <Button key={p.days} variant={p.days === days ? 'secondary' : 'ghost'} size="sm" asChild>
              <Link href={{ pathname: '/users/sources', query: { days: p.days } }}>{p.label}</Link>
            </Button>
          ))}
        </div>
      </PageHeader>

      <div className="mb-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Stat label="Sign-ups" value={count(data.total)} />
        <Stat
          label="Answered the question"
          value={count(data.answered)}
          hint={data.total ? percent(data.answered / data.total, 0) : undefined}
        />
        <Stat label="Top source" value={top?.label ?? '—'} hint={top ? `${count(top.signups)} sign-ups` : undefined} />
        <Stat label="On a paid plan now" value={count(paid)} hint={data.total ? percent(paid / data.total, 0) : undefined} />
      </div>

      <div className="grid gap-4 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
        <Card>
          <CardHeader>
            <CardTitle>Sign-ups by source</CardTitle>
          </CardHeader>
          <CardContent>
            <LeadSources data={data} />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>“Other”, in their words</CardTitle>
          </CardHeader>
          <CardContent>
            {data.otherNotes.length === 0 ? (
              <p className="text-muted-foreground text-sm">Nobody wrote one in this period.</p>
            ) : (
              <ul className="divide-y text-sm">
                {data.otherNotes.map((n) => (
                  <li key={n.note} className="flex items-center justify-between gap-3 py-2">
                    <span className="min-w-0 [overflow-wrap:anywhere]">{n.note}</span>
                    <span className="text-muted-foreground shrink-0 tabular">{count(n.count)}</span>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>
    </>
  );
}
