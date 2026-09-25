import Link from 'next/link';
import { ArrowLeftIcon } from 'lucide-react';
import { apiPage } from '@/lib/api';
import { count, money } from '@/lib/format';
import { PageHeader } from '@/components/page-header';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { PlanEditor } from './plan-editor';
import type { PlatformOverview } from '../types';

export const metadata = { title: 'Plans — Konar Console' };

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
      />

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
              </div>
              <div className="flex flex-col items-end gap-1">
                <Badge variant={plan.isPublic ? 'success' : 'outline'}>
                  {plan.isPublic ? 'public' : 'hidden'}
                </Badge>
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
