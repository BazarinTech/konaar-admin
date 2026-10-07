import Link from 'next/link';
import { ArrowLeftIcon } from 'lucide-react';
import { apiPage } from '@/lib/api';
import { count, money } from '@/lib/format';
import { PageHeader } from '@/components/page-header';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { PlanEditor } from './plan-editor';
import { NewPlan } from './new-plan';
import { DeletePlan } from './delete-plan';
import type { PlatformOverview } from '../types';

export const metadata = { title: 'Plans — Konaar Console' };

export default async function PlansPage() {
  const overview = await apiPage<PlatformOverview>('/admin/platform');

  return (
    <>
      <Button variant="ghost" size="sm" asChild className="mb-4 -ml-2">
        <Link href="/platform">
          <ArrowLeftIcon />
          Platform
        </Link>
      </Button>
      <PageHeader
        title="Plans"
        description="Prices, included credits and what each plan advertises. A plan's code never changes — workspaces reference it."
      >
        <NewPlan />
      </PageHeader>

      <div className="grid gap-4 lg:grid-cols-2 xl:grid-cols-3">
        {overview.plans.map((plan) => (
          <Card key={plan.code}>
            <CardHeader className="flex-row items-start justify-between">
              <div>
                <CardTitle className="text-base">{plan.name}</CardTitle>
                <p className="text-muted-foreground mt-1 text-xs">
                  {money(plan.priceCents / 100)} {plan.cadence} · code{' '}
                  <code className="font-mono">{plan.code}</code>
                </p>
                <p className="text-muted-foreground mt-1 text-xs">
                  {ceiling(plan.maxProjects, 'project')} ·{' '}
                  {ceiling(plan.maxServices, 'service')} ·{' '}
                  {ceiling(plan.maxWorkspaces, 'workspace')}
                </p>
              </div>
              <div className="flex flex-col items-end gap-1">
                <div className="flex items-center gap-1">
                  <Badge variant={plan.isPublic ? 'success' : 'outline'}>
                    {plan.isPublic ? 'public' : 'hidden'}
                  </Badge>
                  {plan.workspaces === 0 && plan.subscriptions === 0 ? (
                    <DeletePlan code={plan.code} name={plan.name} />
                  ) : null}
                </div>
                <span className="text-muted-foreground text-xs">
                  {count(plan.subscriptions)} subscribed
                </span>
              </div>
            </CardHeader>
            <CardContent>
              <PlanEditor plan={plan} />
            </CardContent>
          </Card>
        ))}
      </div>
    </>
  );
}

/** "3 projects", or "unlimited projects" when there is no ceiling. */
function ceiling(limit: number | null, noun: string): string {
  if (limit === null) return `unlimited ${noun}s`;
  return `${count(limit)} ${limit === 1 ? noun : `${noun}s`}`;
}
