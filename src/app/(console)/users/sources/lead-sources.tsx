import { count, percent } from '@/lib/format';
import { cn } from '@/lib/utils';

export interface Acquisition {
  days: number;
  total: number;
  answered: number;
  sources: {
    source: string;
    label: string;
    signups: number;
    onboarded: number;
    paid: number;
    previous: number;
  }[];
  otherNotes: { note: string; count: number }[];
}

/**
 * Sign-ups per source as a bar list: one series, so one colour and no legend;
 * every bar is labelled with its value, and the conversion columns beside it
 * are the table view. "Not answered" is drawn muted — it is a gap in the data,
 * not a channel.
 */
export function LeadSources({ data, compact = false }: { data: Acquisition; compact?: boolean }) {
  const rows = compact ? data.sources.filter((s) => s.source !== 'unanswered').slice(0, 5) : data.sources;
  const max = Math.max(1, ...rows.map((s) => s.signups));

  if (rows.length === 0) {
    return <p className="text-muted-foreground py-6 text-center text-sm">No answers in this period yet.</p>;
  }

  return (
    <div className="flex flex-col gap-1">
      {!compact ? (
        <div className="text-muted-foreground grid grid-cols-[minmax(0,1fr)_auto] gap-3 px-1 pb-1 text-[11px] font-medium tracking-wide uppercase sm:grid-cols-[minmax(0,1fr)_5rem_5rem_5rem]">
          <span>Source</span>
          <span className="text-right">Sign-ups</span>
          <span className="hidden text-right sm:block">Onboarded</span>
          <span className="hidden text-right sm:block">Paid now</span>
        </div>
      ) : null}
      <ul className="flex flex-col">
        {rows.map((s) => {
          const muted = s.source === 'unanswered';
          const change = data.days > 0 && s.previous > 0 ? (s.signups - s.previous) / s.previous : null;
          return (
            <li
              key={s.source}
              title={`${s.label}: ${s.signups} sign-ups, ${s.onboarded} onboarded, ${s.paid} on a paid plan`}
              className="hover:bg-accent/40 grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 rounded-md px-1 py-1.5 sm:grid-cols-[minmax(0,1fr)_5rem_5rem_5rem]"
            >
              <div className="min-w-0">
                <div className="flex items-baseline justify-between gap-2 text-sm">
                  <span className={cn('truncate', muted ? 'text-muted-foreground' : 'font-medium')}>{s.label}</span>
                  {change !== null && !compact ? (
                    <span className="text-muted-foreground shrink-0 text-[11px] tabular">
                      {change >= 0 ? '+' : ''}
                      {percent(change, 0)} vs prior
                    </span>
                  ) : null}
                </div>
                <div className="bg-muted mt-1 h-2 w-full overflow-hidden rounded-full">
                  <div
                    className={cn('h-full rounded-full', muted ? 'bg-muted-foreground/40' : 'bg-primary')}
                    style={{ width: `${(s.signups / max) * 100}%`, minWidth: s.signups > 0 ? 4 : 0 }}
                  />
                </div>
              </div>
              <span className="text-right text-sm font-semibold tabular">{count(s.signups)}</span>
              <span className="text-muted-foreground hidden text-right text-sm tabular sm:block">
                {s.signups ? percent(s.onboarded / s.signups, 0) : '—'}
              </span>
              <span className="text-muted-foreground hidden text-right text-sm tabular sm:block">
                {count(s.paid)}
                {s.signups && s.paid ? <span className="text-[11px]"> · {percent(s.paid / s.signups, 0)}</span> : null}
              </span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
