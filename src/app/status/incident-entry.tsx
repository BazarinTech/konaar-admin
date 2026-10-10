import { stamp, type StatusIncident } from './page';

const DOT: Record<StatusIncident['impact'], string> = {
  critical: 'bg-[var(--down)]',
  major: 'bg-[var(--down)]',
  minor: 'bg-[var(--partial)]',
  maintenance: 'bg-[var(--maintenance)]',
};

const BADGE: Record<StatusIncident['status'], string> = {
  resolved: 'border-[var(--up)] text-[var(--up)]',
  monitoring: 'border-[var(--maintenance)] text-[var(--maintenance)]',
  identified: 'border-[var(--partial)] text-[var(--partial)]',
  investigating: 'border-[var(--down)] text-[var(--down)]',
};

/**
 * One incident and everything that was said about it.
 *
 * The timeline is newest first, like the page: somebody opening this during
 * an outage wants the latest note, and somebody reading it afterwards wants
 * the conclusion. Both are at the top.
 */
export function IncidentEntry({ incident }: { incident: StatusIncident }) {
  return (
    <article className="border-b py-6 last:border-b-0">
      <div className="flex flex-wrap items-center gap-2">
        <span
          aria-hidden
          className={`size-2 shrink-0 rounded-full ${DOT[incident.impact]}`}
        />
        <h3 className="text-sm font-semibold">{incident.title}</h3>
        <span
          className={`rounded-sm border px-1.5 py-0.5 font-mono text-[10px] tracking-wider uppercase ${BADGE[incident.status]}`}
        >
          {incident.status}
        </span>
      </div>

      <p className="text-muted-foreground mt-1 ml-4 font-mono text-[11px]">
        {stamp(incident.startedAt)}
        {incident.components.length > 0
          ? ` · ${incident.components.join(', ')}`
          : ''}
      </p>

      <div className="mt-3 ml-4 flex flex-col gap-2 border-l pl-3">
        {incident.updates.map((update) => (
          <p key={update.id} className="text-xs">
            <span className="text-muted-foreground mr-2 font-mono text-[10px] tracking-wider uppercase">
              {update.status}
            </span>
            {update.body}
          </p>
        ))}
        {incident.updates.length === 0 ? (
          <p className="text-muted-foreground text-xs">
            No updates were posted on this one.
          </p>
        ) : null}
      </div>
    </article>
  );
}
