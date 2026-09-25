import Link from 'next/link';
import { BookOpenIcon, BuildingIcon } from 'lucide-react';
import { apiPage } from '@/lib/api';
import { count, money, percent } from '@/lib/format';
import { PageHeader } from '@/components/page-header';
import { Stat } from '@/components/stat';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { RevenueChart, type MoneyPoint } from '@/components/charts';
import { EntryForm } from './entry-form';
import type { RevenueSummary } from './types';

export const metadata = { title: 'Revenue — Konar Console' };

export default async function RevenuePage({
  searchParams,
}: {
  searchParams: Promise<{ days?: string }>;
}) {
  const { days } = await searchParams;
  const window = Math.min(Math.max(Number(days) || 30, 7), 365);

  const [summary, series] = await Promise.all([
    apiPage<RevenueSummary>(`/admin/revenue?days=${window}`),
    apiPage<{ data: MoneyPoint[] }>(`/admin/revenue/series?days=${window}`),
  ]);

  return (
    <>
      <PageHeader
        title="Revenue"
        description={`Money in against what it cost to serve, over ${window} days.`}
      >
        {[30, 90, 365].map((option) => (
          <Button
            key={option}
            asChild
            size="sm"
            variant={window === option ? 'secondary' : 'ghost'}
          >
            <Link href={{ pathname: '/revenue', query: { days: option } }}>
              {option === 365 ? '1 year' : `${option} days`}
            </Link>
          </Button>
        ))}
        <Button variant="outline" size="sm" asChild>
          <Link href="/revenue/ledger">
            <BookOpenIcon />
            Ledger
          </Link>
        </Button>
        <Button variant="outline" size="sm" asChild>
          <Link href="/revenue/accounts">
            <BuildingIcon />
            Accounts
          </Link>
        </Button>
      </PageHeader>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <Stat
          label="Revenue"
          value={money(summary.revenue)}
          hint={`${money(summary.invoices)} invoiced · ${money(summary.topups)} in top-ups`}
        />
        <Stat
          label="Cost"
          value={money(summary.cost)}
          hint={`${money(summary.modelCost)} models · ${money(summary.otherExpense)} entered by hand`}
          tone="warning"
        />
        <Stat
          label="Profit"
          value={money(summary.profit)}
          hint={`${percent(summary.margin)} of revenue`}
          tone={summary.profit >= 0 ? 'positive' : 'negative'}
        />
        <Stat
          label="Unearned credits"
          value={count(summary.unearnedCredits)}
          hint="Bought and not yet spent — a liability, not revenue"
        />
      </div>

      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Revenue against cost</CardTitle>
          <p className="text-muted-foreground text-xs">
            Bars are what arrived and what it cost. The line is the difference.
          </p>
        </CardHeader>
        <CardContent>
          <RevenueChart data={series.data} />
        </CardContent>
      </Card>

      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Record something the product cannot see</CardTitle>
            <p className="text-muted-foreground text-xs">
              Infrastructure bills, refunds, payroll, one-off income. Invoices,
              top-ups and model spend are already counted — entering those again
              would double them.
            </p>
          </CardHeader>
          <CardContent>
            <EntryForm />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Where the numbers come from</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-2 text-sm">
            <Row label="Paid invoices">{money(summary.invoices)}</Row>
            <Row label="Credit top-ups">{money(summary.topups)}</Row>
            <Row label="Other income (entered)">
              {money(summary.otherIncome)}
            </Row>
            <Row label="Model cost (provider)">{money(summary.modelCost)}</Row>
            <Row label="Charged for model usage">
              {money(summary.modelCharged)}
            </Row>
            <Row label="Other costs (entered)">
              {money(summary.otherExpense)}
            </Row>
            <Row label="Credits granted free">
              {count(summary.grantedCredits)}
            </Row>
            <Row label="Invoiced and unpaid">
              {money(summary.unpaidInvoices)}
            </Row>
          </CardContent>
        </Card>
      </div>
    </>
  );
}

function Row({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-baseline justify-between gap-3">
      <span className="text-muted-foreground text-xs">{label}</span>
      <span className="tabular text-right text-sm">{children}</span>
    </div>
  );
}
