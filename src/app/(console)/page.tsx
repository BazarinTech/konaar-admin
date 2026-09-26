import Link from 'next/link';
import {
  ActivityIcon,
  BoxIcon,
  CoinsIcon,
  HammerIcon,
  TrendingUpIcon,
  UsersIcon,
} from 'lucide-react';
import { apiPage } from '@/lib/api';
import { count, money, percent, ago } from '@/lib/format';
import { PageHeader } from '@/components/page-header';
import { Stat } from '@/components/stat';
import { BuildsChart, GrowthChart, type GrowthPoint } from '@/components/charts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

interface Summary {
  users: { total: number; activeThisWeek: number; newThisMonth: number };
  workspaces: { total: number; withSubscription: number };
  builds: { total: number; succeeded: number; thisWeek: number; running: number };
  projects: { total: number; deployed: number };
  money: {
    revenue: number;
    modelSpend: number;
    otherExpenses: number;
    otherIncome: number;
    netProfit: number;
    margin: number | null;
  };
}

interface Activity {
  data: {
    id: number;
    action: string;
    summary: string;
    createdAt: string;
    adminName: string | null;
  }[];
  pageInfo: { nextCursor: string | null; hasMore: boolean };
}

export default async function DashboardPage() {
  const [summary, growth, activity] = await Promise.all([
    apiPage<Summary>('/admin/dashboard'),
    apiPage<{ data: GrowthPoint[] }>('/admin/dashboard/growth?days=30'),
    apiPage<Activity>('/admin/activity?limit=8'),
  ]);

  const { money: m } = summary;

  return (
    <>
      <PageHeader
        title="Dashboard"
        description="Everything the platform knows about itself, as of right now."
      />

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <Stat
          label="Users"
          value={count(summary.users.total)}
          hint={`${count(summary.users.activeThisWeek)} signed in this week · ${count(summary.users.newThisMonth)} new this month`}
          icon={<UsersIcon className="size-4" />}
        />
        <Stat
          label="Active subscriptions"
          value={count(summary.workspaces.withSubscription)}
          hint={`across ${count(summary.workspaces.total)} workspaces`}
          icon={<CoinsIcon className="size-4" />}
        />
        <Stat
          label="Builds"
          value={count(summary.builds.total)}
          hint={`${count(summary.builds.succeeded)} finished · ${count(summary.builds.thisWeek)} this week${summary.builds.running ? ` · ${summary.builds.running} running now` : ''}`}
          icon={<HammerIcon className="size-4" />}
        />
        <Stat
          label="Projects"
          value={count(summary.projects.total)}
          hint={`${count(summary.projects.deployed)} deployed`}
          icon={<BoxIcon className="size-4" />}
        />
      </div>

      <div className="mt-3 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <Stat
          label="Revenue"
          value={money(m.revenue)}
          hint="Paid invoices and credit top-ups"
        />
        <Stat
          label="Model spend"
          value={money(m.modelSpend)}
          hint="What the provider charged us"
          tone="warning"
        />
        <Stat
          label="Net profit"
          value={money(m.netProfit)}
          hint={
            m.otherExpenses || m.otherIncome
              ? `includes ${money(m.otherIncome)} other income, ${money(m.otherExpenses)} other costs`
              : 'revenue less every recorded cost'
          }
          tone={m.netProfit >= 0 ? 'positive' : 'negative'}
        />
        <Stat
          label="Margin"
          value={percent(m.margin)}
          hint="Share of gross income kept"
          icon={<TrendingUpIcon className="size-4" />}
        />
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Users and activity</CardTitle>
            <p className="text-muted-foreground text-xs">
              Cumulative signups against who actually signed in that day. Thirty
              days.
            </p>
          </CardHeader>
          <CardContent>
            <GrowthChart data={growth.data} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex-row items-center justify-between">
            <CardTitle>Recent administration</CardTitle>
            <Button variant="ghost" size="sm" asChild>
              <Link href="/activity">
                <ActivityIcon />
                All
              </Link>
            </Button>
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
            {activity.data.length === 0 ? (
              <p className="text-muted-foreground text-sm">
                Nothing has been changed yet.
              </p>
            ) : (
              activity.data.map((entry) => (
                <div key={entry.id} className="flex flex-col gap-1">
                  <div className="flex items-center gap-2">
                    <Badge variant="outline">{entry.action}</Badge>
                    <span className="text-muted-foreground text-xs">
                      {ago(entry.createdAt)}
                    </span>
                  </div>
                  <p className="text-sm leading-snug">{entry.summary}</p>
                  {entry.adminName ? (
                    <p className="text-muted-foreground text-xs">
                      {entry.adminName}
                    </p>
                  ) : null}
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>

      <Card className="mt-4">
        <CardHeader>
          <CardTitle>Builds per day</CardTitle>
        </CardHeader>
        <CardContent>
          <BuildsChart data={growth.data} />
        </CardContent>
      </Card>
    </>
  );
}
