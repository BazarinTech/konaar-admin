import type { Metadata } from 'next';

import { api } from '@/lib/api';
import { SubscribeForm } from './subscribe-form';
import { UptimeBar } from './uptime-bar';
import { IncidentEntry } from './incident-entry';

/**
 * Public, and indexed, unlike the rest of this app.
 *
 * The root layout marks the console `noindex` because it is nobody's
 * business; a status page is the opposite — when something breaks, people
 * search for it.
 */
export const metadata: Metadata = {
  title: 'Konaar Status',
  description: 'Live and historical availability of the Konaar platform.',
  robots: { index: true, follow: true },
};

/**
 * Re-read often. Not cached for long: the one moment this page matters is
 * the moment something changed, and a stale status page is worse than none.
 */
export const revalidate = 30;

export type DayState = 'up' | 'partial' | 'down' | 'maintenance' | 'unknown';

export type StatusComponent = {
  id: string;
  name: string;
  description: string | null;
  status:
    | 'operational'
    | 'degraded'
    | 'partial_outage'
    | 'major_outage'
    | 'maintenance';
  uptimePercent: number;
  days: DayState[];
};

export type StatusIncident = {
  id: string;
  title: string;
  status: 'investigating' | 'identified' | 'monitoring' | 'resolved';
  impact: 'maintenance' | 'minor' | 'major' | 'critical';
  components: string[];
  startedAt: string;
  resolvedAt: string | null;
  updates: { id: string; status: string; body: string; createdAt: string }[];
};

interface StatusPage {
  status: StatusComponent['status'];
  summary: string;
  headline: string;
  windowDays: number;
  updatedAt: string;
  groups: { id: string; name: string; components: StatusComponent[] }[];
  ungrouped: StatusComponent[];
  incidents: StatusIncident[];
}

const BANNER: Record<StatusComponent['status'], string> = {
  operational: 'bg-[var(--up)]',
  maintenance: 'bg-[var(--maintenance)]',
  degraded: 'bg-[var(--partial)]',
  partial_outage: 'bg-[var(--partial)]',
  major_outage: 'bg-[var(--down)]',
};

export const COMPONENT_LABEL: Record<StatusComponent['status'], string> = {
  operational: 'Operational',
  degraded: 'Degraded',
  partial_outage: 'Partial outage',
  major_outage: 'Major outage',
  maintenance: 'Maintenance',
};

export const COMPONENT_DOT: Record<StatusComponent['status'], string> = {
  operational: 'bg-[var(--up)] text-[var(--up)]',
  degraded: 'bg-[var(--partial)] text-[var(--partial)]',
  partial_outage: 'bg-[var(--partial)] text-[var(--partial)]',
  major_outage: 'bg-[var(--down)] text-[var(--down)]',
  maintenance: 'bg-[var(--maintenance)] text-[var(--maintenance)]',
};

/** `10 Oct 2026, 01:27` — the format the page's own timestamps use. */
export function stamp(iso: string): string {
  return new Date(iso).toLocaleString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export default async function StatusPage() {
  /**
   * Anonymous. This page has no session and must not acquire one: the
   * moment it matters most is an outage, and an outage is exactly when
   * nobody can sign in to read it.
   */
  const page = await api<StatusPage>('/status', { anonymous: true });
  const sections = [
    ...page.groups.filter((g) => g.components.length > 0),
    ...(page.ungrouped.length > 0
      ? [{ id: 'other', name: 'Other', components: page.ungrouped }]
      : []),
  ];

  return (
    <div className="status-page min-h-svh">
      <div className="mx-auto w-full max-w-3xl px-4 py-10 sm:px-6 sm:py-14">
        <header className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-base font-semibold tracking-tight">Konaar</p>
            <p className="text-muted-foreground font-mono text-xs">
              System Status
            </p>
          </div>
          <SubscribeForm />
        </header>

        <div
          className={`mt-8 flex items-center gap-3 rounded-md px-5 py-5 text-white ${BANNER[page.status]}`}
        >
          <CheckIcon status={page.status} />
          <p className="text-lg font-semibold tracking-tight">
            {page.headline}
          </p>
        </div>
        <p className="text-muted-foreground mt-2 text-right font-mono text-xs">
          Updated {stamp(page.updatedAt)}
        </p>

        {sections.length === 0 ? (
          <p className="text-muted-foreground mt-12 rounded-md border border-dashed px-6 py-16 text-center text-sm">
            Nothing is being tracked here yet.
          </p>
        ) : null}

        {sections.map((group) => (
          <section key={group.id} className="mt-12">
            <h2 className="text-muted-foreground font-mono text-[11px] tracking-[0.14em] uppercase">
              {group.name}
            </h2>
            <div className="mt-4 flex flex-col">
              {group.components.map((component) => (
                <article key={component.id} className="border-b py-5 last:border-b-0">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="min-w-0">
                      <h3 className="text-sm font-semibold">{component.name}</h3>
                      {component.description ? (
                        <p className="text-muted-foreground text-xs">
                          {component.description}
                        </p>
                      ) : null}
                    </div>
                    <p
                      className={`flex shrink-0 items-center gap-1.5 text-xs font-medium ${COMPONENT_DOT[component.status].split(' ')[1]}`}
                    >
                      <span
                        aria-hidden
                        className={`size-1.5 rounded-full ${COMPONENT_DOT[component.status].split(' ')[0]}`}
                      />
                      {COMPONENT_LABEL[component.status]}
                    </p>
                  </div>

                  <UptimeBar days={component.days} name={component.name} />

                  <div className="text-muted-foreground mt-2 flex items-center justify-between font-mono text-[11px]">
                    <span>{page.windowDays} days ago</span>
                    <span>{component.uptimePercent.toFixed(2)}% uptime</span>
                    <span>Today</span>
                  </div>
                </article>
              ))}
            </div>
          </section>
        ))}

        <section className="mt-16">
          <h2 className="text-muted-foreground font-mono text-[11px] tracking-[0.14em] uppercase">
            Past incidents
          </h2>
          {page.incidents.length === 0 ? (
            <p className="text-muted-foreground mt-6 border-t pt-6 text-sm">
              No incidents in the last {page.windowDays} days.
            </p>
          ) : (
            <div className="mt-4 flex flex-col">
              {page.incidents.map((incident) => (
                <IncidentEntry key={incident.id} incident={incident} />
              ))}
            </div>
          )}
        </section>

        <footer className="text-muted-foreground mt-16 flex flex-wrap justify-between gap-2 border-t pt-5 font-mono text-[11px]">
          <span>Konaar · AI software platform</span>
          <span>status.konaar.dev</span>
        </footer>
      </div>
    </div>
  );
}

/** A tick when all is well, an exclamation when it is not. */
function CheckIcon({ status }: { status: StatusComponent['status'] }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="size-6 shrink-0"
      aria-hidden
    >
      <circle cx="12" cy="12" r="10" />
      {status === 'operational' ? (
        <path d="m9 12 2 2 4-4" />
      ) : (
        <>
          <path d="M12 8v4" />
          <path d="M12 16h.01" />
        </>
      )}
    </svg>
  );
}
