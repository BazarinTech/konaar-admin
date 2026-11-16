import Link from 'next/link';
import { StarIcon } from 'lucide-react';
import { apiPage } from '@/lib/api';
import { ago, count, dateTime } from '@/lib/format';
import { PageHeader } from '@/components/page-header';
import { Empty } from '@/components/empty';
import { Stat } from '@/components/stat';
import { AutoRefresh } from '@/components/auto-refresh';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';

export const metadata = { title: 'Feedback — Konaar Console' };

type Area = 'builder' | 'cloud' | 'billing' | 'platform';

interface FeedbackList {
  summary: {
    count: number;
    average: number;
    last30: number;
    byArea: { area: Area; count: number; average: number }[];
  };
  data: {
    id: string;
    rating: number;
    area: Area;
    message: string | null;
    page: string | null;
    chatId: string | null;
    createdAt: string;
    user: { id: string; name: string; email: string };
    workspace: { id: string; name: string; planCode: string } | null;
  }[];
  nextBefore: string | null;
}

const AREAS: { value: '' | Area; label: string }[] = [
  { value: '', label: 'All' },
  { value: 'builder', label: 'Builder' },
  { value: 'cloud', label: 'Cloud' },
  { value: 'billing', label: 'Billing' },
  { value: 'platform', label: 'Platform' },
];

const AREA_LABEL: Record<Area, string> = {
  builder: 'Builder',
  cloud: 'Cloud',
  billing: 'Billing',
  platform: 'Platform',
};

function Stars({ rating }: { rating: number }) {
  return (
    <span className="inline-flex items-center gap-0.5" aria-label={`${rating} of 5`}>
      {[1, 2, 3, 4, 5].map((n) => (
        <StarIcon
          key={n}
          className={cn('size-3.5', n <= rating ? 'fill-amber-400 text-amber-400' : 'text-muted-foreground/30')}
        />
      ))}
    </span>
  );
}

function ratingTone(avg: number, n: number): 'default' | 'positive' | 'negative' | 'warning' {
  if (!n) return 'default';
  if (avg >= 4) return 'positive';
  if (avg < 3) return 'negative';
  return 'warning';
}

export default async function FeedbackPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const one = (key: string) => {
    const v = params[key];
    return Array.isArray(v) ? v[0] : v;
  };
  const area = one('area') ?? '';
  const before = one('before') ?? '';

  const search = new URLSearchParams({ limit: '50' });
  if (area) search.set('area', area);
  if (before) search.set('before', before);
  const list = await apiPage<FeedbackList>(`/admin/feedback?${search}`);
  const { summary } = list;
  const byArea = new Map(summary.byArea.map((a) => [a.area, a]));

  const link = (patch: Record<string, string>) => ({
    pathname: '/feedback' as const,
    query: Object.fromEntries(Object.entries({ area, ...patch }).filter(([, v]) => v !== '')),
  });

  return (
    <>
      <AutoRefresh seconds={60} />
      <PageHeader
        title="Feedback"
        description="Ratings and notes customers send from the app, newest first. Only the team sees these."
      />

      <div className="mb-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Stat
          label="Average rating"
          value={summary.count ? `${summary.average.toFixed(1)} / 5` : '—'}
          tone={ratingTone(summary.average, summary.count)}
          hint={`${count(summary.count)} in total`}
        />
        <Stat label="Last 30 days" value={count(summary.last30)} />
        {(['builder', 'cloud'] as const).map((a) => {
          const s = byArea.get(a);
          return (
            <Stat
              key={a}
              label={AREA_LABEL[a]}
              value={s ? `${s.average.toFixed(1)} / 5` : '—'}
              tone={ratingTone(s?.average ?? 0, s?.count ?? 0)}
              hint={s ? `${count(s.count)} ratings` : 'No ratings yet'}
            />
          );
        })}
      </div>

      <div className="mb-4 flex flex-wrap gap-1.5">
        {AREAS.map((a) => {
          const n = a.value ? byArea.get(a.value)?.count : summary.count;
          return (
            <Button key={a.label} variant={area === a.value ? 'secondary' : 'ghost'} size="sm" asChild>
              <Link href={link({ area: a.value, before: '' })}>
                {a.label}
                {n ? <span className="text-muted-foreground tabular">{n}</span> : null}
              </Link>
            </Button>
          );
        })}
      </div>

      {list.data.length === 0 ? (
        <Empty>{area || before ? 'No feedback matches.' : 'No feedback yet.'}</Empty>
      ) : (
        <Card>
          <CardContent className="divide-border divide-y p-0">
            {list.data.map((f) => (
              <article key={f.id} className="flex flex-col gap-2 px-4 py-4 sm:px-5">
                <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                  <Stars rating={f.rating} />
                  <Badge variant="outline">{AREA_LABEL[f.area] ?? f.area}</Badge>
                  <span className="text-muted-foreground ml-auto text-xs" title={dateTime(f.createdAt)}>
                    {ago(f.createdAt)}
                  </span>
                </div>
                {f.message ? (
                  <p className="max-w-prose text-sm whitespace-pre-wrap">{f.message}</p>
                ) : (
                  <p className="text-muted-foreground text-sm italic">No note</p>
                )}
                <div className="text-muted-foreground flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs">
                  <Link href={`/users/${f.user.id}`} className="text-foreground hover:underline">
                    {f.user.name || f.user.email}
                  </Link>
                  <span>{f.user.email}</span>
                  {f.workspace ? (
                    <span>
                      · {f.workspace.name} <span className="uppercase">({f.workspace.planCode})</span>
                    </span>
                  ) : null}
                  {f.page ? <span className="font-mono">· {f.page}</span> : null}
                </div>
              </article>
            ))}
          </CardContent>
        </Card>
      )}

      {before || list.nextBefore ? (
        <div className="mt-4 flex justify-between">
          {before ? (
            <Button variant="ghost" size="sm" asChild>
              <Link href={link({ before: '' })}>Newest</Link>
            </Button>
          ) : (
            <span />
          )}
          {list.nextBefore ? (
            <Button variant="ghost" size="sm" asChild>
              <Link href={link({ before: list.nextBefore })}>Older</Link>
            </Button>
          ) : null}
        </div>
      ) : null}
    </>
  );
}
