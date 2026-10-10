import Link from 'next/link';
import { ExternalLinkIcon } from 'lucide-react';

import { apiPage } from '@/lib/api';
import { PageHeader } from '@/components/page-header';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { ComponentRow } from './component-row';
import { ComponentForm } from './component-form';
import { GroupForm } from './group-form';
import { IncidentForm } from './incident-form';
import { IncidentCard } from './incident-card';

export const metadata = { title: 'Status — Konaar Console' };

export type ComponentStatus =
  | 'operational'
  | 'degraded'
  | 'partial_outage'
  | 'major_outage'
  | 'maintenance';

export interface StatusGroup {
  id: string;
  name: string;
  sortIndex: number;
}

export interface StatusComponentRecord {
  id: string;
  groupId: string | null;
  name: string;
  description: string | null;
  sortIndex: number;
  status: ComponentStatus;
  visible: boolean;
}

export interface IncidentRecord {
  id: string;
  title: string;
  status: 'investigating' | 'identified' | 'monitoring' | 'resolved';
  impact: 'maintenance' | 'minor' | 'major' | 'critical';
  componentIds: string[];
  components: string[];
  startedAt: string;
  resolvedAt: string | null;
  updates: { id: string; status: string; body: string; createdAt: string }[];
}

/**
 * Keeping the status page.
 *
 * Open incidents first, because the only reason anybody opens this screen in
 * a hurry is to post an update on one. Everything else is setup, and setup
 * is done once.
 */
export default async function StatusConsolePage() {
  const [groups, components, incidents] = await Promise.all([
    apiPage<{ data: StatusGroup[] }>('/admin/status/groups'),
    apiPage<{ data: StatusComponentRecord[] }>('/admin/status/components'),
    apiPage<{ data: IncidentRecord[] }>('/admin/status/incidents'),
  ]);

  const open = incidents.data.filter((i) => i.resolvedAt === null);
  const past = incidents.data.filter((i) => i.resolvedAt !== null);
  const broken = components.data.filter((c) => c.status !== 'operational');

  return (
    <div className="flex flex-col gap-8">
      <PageHeader
        title="Status"
        description="What the public status page says. Everything here is a statement customers read — nothing on that page is measured or guessed."
      >
        <Button variant="outline" size="sm" asChild>
          <Link href="/status" target="_blank" rel="noreferrer">
            View the page
            <ExternalLinkIcon className="size-3.5" />
          </Link>
        </Button>
      </PageHeader>

      {broken.length > 0 ? (
        <Card>
          <CardContent className="py-4 text-sm">
            <p className="font-medium">
              {broken.length === 1
                ? `${broken[0].name} is not marked operational`
                : `${broken.length} services are not marked operational`}
            </p>
            <p className="text-muted-foreground pt-1">
              The banner on the public page is the worst of these. It stays
              that way until they are set back, which resolving an incident
              does for the services it named.
            </p>
          </CardContent>
        </Card>
      ) : null}

      <section className="flex flex-col gap-3">
        <div className="flex items-baseline gap-2">
          <h2 className="text-sm font-medium">Open incidents</h2>
          <Badge variant={open.length > 0 ? 'default' : 'secondary'}>
            {open.length}
          </Badge>
        </div>

        {open.length === 0 ? (
          <Card>
            <CardContent className="text-muted-foreground py-8 text-center text-sm">
              Nothing open. Customers see the all-clear.
            </CardContent>
          </Card>
        ) : (
          <div className="flex flex-col gap-3">
            {open.map((incident) => (
              <IncidentCard key={incident.id} incident={incident} />
            ))}
          </div>
        )}

        <IncidentForm components={components.data} />
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="text-sm font-medium">Services</h2>
        <p className="text-muted-foreground text-xs">
          Each one gets a row and a ninety-day bar. The bar is drawn from the
          incidents recorded against it, so it needs no keeping of its own.
        </p>

        {components.data.length === 0 ? (
          <Card>
            <CardContent className="text-muted-foreground py-8 text-center text-sm">
              Nothing is being tracked. Add a service and it appears on the
              public page straight away.
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardContent className="flex flex-col divide-y p-0">
              {components.data.map((component) => (
                <ComponentRow
                  key={component.id}
                  component={component}
                  groups={groups.data}
                />
              ))}
            </CardContent>
          </Card>
        )}

        <div className="grid gap-3 lg:grid-cols-2">
          <ComponentForm groups={groups.data} />
          <GroupForm groups={groups.data} />
        </div>
      </section>

      <section className="flex flex-col gap-3">
        <div className="flex items-baseline gap-2">
          <h2 className="text-sm font-medium">Resolved</h2>
          <Badge variant="secondary">{past.length}</Badge>
        </div>
        {past.length === 0 ? (
          <Card>
            <CardContent className="text-muted-foreground py-8 text-center text-sm">
              No incidents have been resolved yet.
            </CardContent>
          </Card>
        ) : (
          <div className="flex flex-col gap-3">
            {past.slice(0, 20).map((incident) => (
              <IncidentCard key={incident.id} incident={incident} />
            ))}
          </div>
        )}
      </section>

      <p className="text-muted-foreground text-xs">
        Every change here is recorded in{' '}
        <span className="font-medium">Activity</span>, with who made it. A
        status page is what customers quote in an argument about a refund, so
        &ldquo;who said the API was fine at 4pm&rdquo; has to be answerable.
      </p>
    </div>
  );
}
