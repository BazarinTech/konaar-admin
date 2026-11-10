import Link from 'next/link';
import { BookOpenIcon, SlidersHorizontalIcon } from 'lucide-react';
import { apiPage } from '@/lib/api';
import { ago } from '@/lib/format';
import { PageHeader } from '@/components/page-header';
import { Empty } from '@/components/empty';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';

export const metadata = { title: 'Design reviews — Konaar Console' };
export const dynamic = 'force-dynamic';

interface ReviewRow {
  runId: string;
  projectName: string;
  stack: string | null;
  prompt: string;
  status: string;
  quality: string;
  createdAt: string;
  seconds: number | null;
  creditsSpent: string;
  review: null | {
    status: string;
    reason: string | null;
    model: string | null;
    verdict: string | null;
    summary: string | null;
    scores: Record<string, number> | null;
    changes: { priority: number; page: string; target: string; change: string; kept: boolean | null }[];
    verification: { status: string | null; summary: string | null; regressions: string[] } | null;
    unresolved: number;
    credits: number | null;
  };
}

const STATUS_TEXT: Record<string, string> = {
  ok: 'Reviewed',
  skipped: 'Skipped',
  time: 'Skipped: out of time',
  budget: 'Skipped: budget',
  unavailable: 'Reviewer unavailable',
  invalid: 'Reviewer reply unusable',
  no_screenshots: 'No screenshots',
};

/**
 * Did the reviewer look at this build, and what did it ask for?
 *
 * Read from the record each build writes, so a skipped review says why.
 */
export default async function ReviewsPage() {
  const { data } = await apiPage<{ data: ReviewRow[] }>('/admin/ai/reviews?limit=40');
  const reviewed = data.filter((r) => r.review?.status === 'ok').length;

  return (
    <>
      <PageHeader
        title="Design reviews"
        description="Every build is meant to be reviewed by the design reviewer from screenshots: at most five changes, applied by the builder, then checked. This is what actually happened on the most recent builds."
      >
        <Button variant="outline" size="sm" asChild>
          <Link href="/ai/engine">
            <SlidersHorizontalIcon />
            Engine
          </Link>
        </Button>
        <Button variant="outline" size="sm" asChild>
          <Link href="/ai/skills">
            <BookOpenIcon />
            Skills
          </Link>
        </Button>
      </PageHeader>

      <p className="text-muted-foreground mb-4 text-sm">
        {data.length === 0
          ? 'No builds yet.'
          : `${reviewed} of the last ${data.length} builds were reviewed.`}
      </p>

      {data.length === 0 ? (
        <Empty>Builds show here as they run.</Empty>
      ) : (
        <div className="grid grid-cols-[minmax(0,1fr)] gap-3">
          {data.map((row) => (
            <ReviewCard key={row.runId} row={row} />
          ))}
        </div>
      )}
    </>
  );
}

function ReviewCard({ row }: { row: ReviewRow }) {
  const r = row.review;
  const ok = r?.status === 'ok';
  return (
    <Card>
      <CardContent className="flex flex-col gap-3">
        <div className="flex flex-wrap items-start justify-between gap-x-4 gap-y-1">
          <div className="min-w-0">
            <p className="truncate font-medium">{row.projectName}</p>
            <p className="text-muted-foreground line-clamp-2 text-xs">{row.prompt}</p>
          </div>
          <div className="flex shrink-0 flex-wrap items-center gap-1.5">
            <Badge variant="outline">{row.stack ?? 'unknown stack'}</Badge>
            <Badge variant="outline">{row.quality}</Badge>
            <Badge variant={row.status === 'ready' ? 'secondary' : 'outline'}>{row.status}</Badge>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs">
          <Badge variant={ok ? 'success' : r ? 'warning' : 'outline'}>
            {r ? (STATUS_TEXT[r.status] ?? r.status) : 'No review record'}
          </Badge>
          {r?.model ? <span className="text-muted-foreground font-mono">{r.model}</span> : null}
          {r?.verdict ? <span>Verdict: {r.verdict}</span> : null}
          {r?.credits != null ? <span className="text-muted-foreground">{r.credits} credits on review</span> : null}
          <span className="text-muted-foreground">
            {ago(row.createdAt)}
            {row.seconds != null ? ` · ${Math.round(row.seconds / 60)} min` : ''} · {row.creditsSpent} credits total
          </span>
        </div>

        {r && !ok ? (
          <p className="text-muted-foreground text-sm">
            {r.reason ??
              (row.status === 'ready'
                ? 'No reason recorded.'
                : 'The build stopped before review.')}
          </p>
        ) : null}
        {!r ? (
          <p className="text-muted-foreground text-sm">
            {row.status === 'ready'
              ? 'This build finished without a review record (built before reviews were recorded).'
              : 'The build stopped before it reached review.'}
          </p>
        ) : null}

        {ok && r.summary ? <p className="text-sm">{r.summary}</p> : null}

        {ok && r.scores ? (
          <div className="flex flex-wrap gap-1.5">
            {Object.entries(r.scores).map(([k, v]) => (
              <span key={k} className="bg-muted rounded px-1.5 py-0.5 font-mono text-[11px]">
                {k} {v}/5
              </span>
            ))}
          </div>
        ) : null}

        {ok && r.changes.length ? (
          <ol className="flex flex-col gap-1.5 text-sm">
            {r.changes.map((c, i) => (
              <li key={i} className="flex gap-2">
                <span className="text-muted-foreground w-5 shrink-0 font-mono text-xs">{c.priority}</span>
                <span className="min-w-0">
                  <span className="text-muted-foreground text-xs">
                    {c.page} · {c.target}
                    {c.kept === false ? ' · not applied' : ''}
                  </span>
                  <br />
                  {c.change}
                </span>
              </li>
            ))}
          </ol>
        ) : null}

        {ok && r.verification ? (
          <p className="text-muted-foreground text-xs">
            Check after fixes: {r.verification.status}
            {r.verification.summary ? `. ${r.verification.summary}` : ''}
            {r.verification.regressions.length
              ? ` Regressions: ${r.verification.regressions.join('; ')}`
              : ''}
          </p>
        ) : null}
        {ok && r.unresolved ? (
          <p className="text-muted-foreground text-xs">{r.unresolved} change(s) left unresolved.</p>
        ) : null}
      </CardContent>
    </Card>
  );
}
