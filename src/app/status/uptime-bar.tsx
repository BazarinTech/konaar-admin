import type { DayState } from './page';

const FILL: Record<DayState, string> = {
  up: 'bg-[var(--up)]',
  partial: 'bg-[var(--partial)]',
  down: 'bg-[var(--down)]',
  maintenance: 'bg-[var(--maintenance)]',
  unknown: 'bg-[var(--unknown)]',
};

const WORD: Record<DayState, string> = {
  up: 'no incidents',
  partial: 'degraded',
  down: 'outage',
  maintenance: 'maintenance',
  unknown: 'no data',
};

/**
 * Ninety days, one bar each.
 *
 * Flex with a gap rather than ninety fixed widths: at phone width the bars
 * have to get thinner, and a row that overflows is the one thing this
 * component must never do — the page it sits on is read on a phone, in a
 * hurry, by somebody who already suspects the worst.
 *
 * Rendered as a list with a label rather than a decorative div, because a
 * screen reader should be able to reach the same summary the sighted reader
 * gets from the shape.
 */
export function UptimeBar({ days, name }: { days: DayState[]; name: string }) {
  const bad = days.filter((d) => d === 'down' || d === 'partial').length;

  return (
    <div
      role="img"
      aria-label={
        bad === 0
          ? `${name}: no incidents in the last ${days.length} days`
          : `${name}: ${bad} of the last ${days.length} days affected`
      }
      className="mt-3 flex h-8 items-stretch gap-[2px]"
    >
      {days.map((day, i) => (
        <span
          key={i}
          // The day is in the title so a pointer can find the bad one, which
          // is the only thing anybody hovers these for.
          title={`${days.length - i} day${days.length - i === 1 ? '' : 's'} ago — ${WORD[day]}`}
          className={`min-w-[2px] flex-1 rounded-[1px] ${FILL[day]}`}
        />
      ))}
    </div>
  );
}
