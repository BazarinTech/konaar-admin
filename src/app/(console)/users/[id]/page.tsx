import Link from 'next/link';
import { ArrowLeftIcon } from 'lucide-react';
import { apiPage } from '@/lib/api';
import { ago, count, date, dateTime, money } from '@/lib/format';
import { PageHeader } from '@/components/page-header';
import { Stat } from '@/components/stat';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { UserActions } from './user-actions';

interface UserDetail {
  user: {
    id: string;
    email: string;
    name: string;
    country: string | null;
    locale: string;
    createdAt: string;
    lastLoginAt: string | null;
    emailVerified: boolean;
    banned: {
      at: string;
      reason: string;
      by: { name: string; email: string } | null;
    } | null;
    onboarding: {
      goal: string | null;
      experience: string | null;
      source: string | null;
    };
  };
  workspaces: {
    id: string;
    name: string;
    slug: string;
    role: string;
    isOwner: boolean;
    createdAt: string;
    plan: { code: string; name: string };
    subscription: {
      status: string;
      seats: number;
      currentPeriodEnd: string | null;
      cancelAtPeriodEnd: boolean;
    } | null;
    suspended: { at: string; reason: string | null } | null;
    credits: {
      ai: { balance: number; spent: number };
      cloud: { balance: number; spent: number };
    };
    projects: number;
    services: number;
    deployedServices: number;
  }[];
  spending: {
    paid: number;
    outstanding: number;
    topups: number;
    granted: number;
    modelSpend: number;
    meteredUsage: number;
    refunds: number;
    contribution: number;
  };
  usage: {
    tokens: { input: number; output: number; cached: number };
    generations: { operations: number; modelSeconds: number };
    builds: {
      total: number;
      succeeded: number;
      failed: number;
      active: number;
      lastAt: string | null;
    };
    resources: {
      category: string;
      quantity: number;
      unit: string;
      cost: number;
    }[];
  };
  builds: {
    id: string;
    status: string;
    createdAt: string;
    finishedAt: string | null;
    name: string;
    project: { id: string; name: string } | null;
    cost: number;
  }[];
  sessions: {
    id: string;
    userAgent: string | null;
    ip: string | null;
    createdAt: string;
    expiresAt: string;
    active: boolean;
  }[];
}

function statusTone(status: string) {
  if (status === 'ready') return 'success' as const;
  if (status === 'failed') return 'destructive' as const;
  if (status === 'canceled') return 'outline' as const;
  return 'warning' as const;
}

export default async function UserPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const detail = await apiPage<UserDetail>(`/admin/users/${id}`);
  const { user, spending, usage } = detail;

  return (
    <>
      <Button variant="ghost" size="sm" asChild className="mb-4 -ml-2">
        <Link href="/users">
          <ArrowLeftIcon />
          All users
        </Link>
      </Button>

      <PageHeader
        title={user.name}
        description={`${user.email} · joined ${date(user.createdAt)} · last seen ${ago(user.lastLoginAt)}`}
      >
        <UserActions
          userId={user.id}
          banned={!!user.banned}
          workspaces={detail.workspaces.map((w) => ({
            id: w.id,
            name: w.name,
          }))}
        />
      </PageHeader>

      {user.banned ? (
        <Card className="border-destructive/40 bg-destructive/5 mb-4">
          <CardContent className="py-4">
            <p className="text-destructive text-sm font-medium">
              Banned {ago(user.banned.at)}
              {user.banned.by ? ` by ${user.banned.by.name}` : ''}
            </p>
            <p className="mt-1 text-sm">{user.banned.reason}</p>
            <p className="text-muted-foreground mt-2 text-xs">
              Sign-in and session renewal are refused. An access token issued
              before the ban stops working within fifteen minutes.
            </p>
          </CardContent>
        </Card>
      ) : null}

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <Stat
          label="Paid"
          value={money(spending.paid)}
          hint={`${money(spending.topups)} in top-ups`}
        />
        <Stat
          label="Cost to serve"
          value={money(spending.modelSpend)}
          hint={`${count(usage.generations.operations)} model calls`}
          tone="warning"
        />
        <Stat
          label="Contribution"
          value={money(spending.contribution)}
          hint="Paid, less what serving them cost"
          tone={spending.contribution >= 0 ? 'positive' : 'negative'}
        />
        <Stat
          label="Granted credits"
          value={count(spending.granted)}
          hint={
            spending.outstanding
              ? `${money(spending.outstanding)} invoiced and unpaid`
              : 'Free-plan and goodwill credits'
          }
        />
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Workspaces</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Workspace</TableHead>
                  <TableHead>Plan</TableHead>
                  <TableHead>AI credits</TableHead>
                  <TableHead>Cloud credits</TableHead>
                  <TableHead className="text-right">Projects</TableHead>
                  <TableHead className="text-right">Deployed</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {detail.workspaces.map((workspace) => (
                  <TableRow key={workspace.id}>
                    <TableCell>
                      <div className="flex flex-col">
                        <span className="flex items-center gap-2 font-medium">
                          {workspace.name}
                          {workspace.isOwner ? null : (
                            <Badge variant="outline">{workspace.role}</Badge>
                          )}
                          {workspace.suspended ? (
                            <Badge variant="destructive">suspended</Badge>
                          ) : null}
                        </span>
                        <span className="text-muted-foreground text-xs">
                          {workspace.slug}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col">
                        <span>{workspace.plan.name}</span>
                        {workspace.subscription ? (
                          <span className="text-muted-foreground text-xs">
                            {workspace.subscription.status}
                            {workspace.subscription.cancelAtPeriodEnd
                              ? ' · cancelling'
                              : ''}
                          </span>
                        ) : null}
                      </div>
                    </TableCell>
                    <TableCell className="tabular">
                      {count(workspace.credits.ai.balance)}
                      <span className="text-muted-foreground text-xs">
                        {' '}
                        / {count(workspace.credits.ai.spent)} spent
                      </span>
                    </TableCell>
                    <TableCell className="tabular">
                      {count(workspace.credits.cloud.balance)}
                      <span className="text-muted-foreground text-xs">
                        {' '}
                        / {count(workspace.credits.cloud.spent)} spent
                      </span>
                    </TableCell>
                    <TableCell className="tabular text-right">
                      {count(workspace.projects)}
                    </TableCell>
                    <TableCell className="tabular text-right">
                      {count(workspace.deployedServices)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <div className="flex flex-col gap-4">
          <Card>
            <CardHeader>
              <CardTitle>Usage</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-2 text-sm">
              <Row label="Builds">
                {count(usage.builds.total)} total · {count(usage.builds.succeeded)}{' '}
                finished · {count(usage.builds.failed)} failed
              </Row>
              <Row label="Last build">{ago(usage.builds.lastAt)}</Row>
              <Row label="Input tokens">{count(usage.tokens.input)}</Row>
              <Row label="Cached">{count(usage.tokens.cached)}</Row>
              <Row label="Output tokens">{count(usage.tokens.output)}</Row>
              <Row label="Model time">
                {count(Math.round(usage.generations.modelSeconds / 60))} min
              </Row>
              {usage.resources.map((resource) => (
                <Row key={resource.category} label={resource.category}>
                  {count(Math.round(resource.quantity))} {resource.unit} ·{' '}
                  {money(resource.cost)}
                </Row>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Account</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-2 text-sm">
              <Row label="Email verified">
                {user.emailVerified ? 'Yes' : 'No'}
              </Row>
              <Row label="Country">{user.country ?? '—'}</Row>
              <Row label="Goal">{user.onboarding.goal ?? '—'}</Row>
              <Row label="Experience">{user.onboarding.experience ?? '—'}</Row>
              <Row label="Found us via">{user.onboarding.source ?? '—'}</Row>
            </CardContent>
          </Card>
        </div>
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Recent builds</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Project</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Cost</TableHead>
                  <TableHead>When</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {detail.builds.map((build) => (
                  <TableRow key={build.id}>
                    <TableCell className="max-w-48 truncate">
                      {build.project?.name ?? build.name}
                    </TableCell>
                    <TableCell>
                      <Badge variant={statusTone(build.status)}>
                        {build.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="tabular text-right">
                      {money(build.cost)}
                    </TableCell>
                    <TableCell className="text-muted-foreground text-xs">
                      {ago(build.createdAt)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Sessions</CardTitle>
            <p className="text-muted-foreground text-xs">
              Where this account is signed in. Tokens themselves are stored
              hashed and are not readable here.
            </p>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Device</TableHead>
                  <TableHead>IP</TableHead>
                  <TableHead>Started</TableHead>
                  <TableHead>State</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {detail.sessions.map((session) => (
                  <TableRow key={session.id}>
                    <TableCell className="max-w-56 truncate text-xs">
                      {session.userAgent ?? 'unknown'}
                    </TableCell>
                    <TableCell className="text-xs">
                      {session.ip ?? '—'}
                    </TableCell>
                    <TableCell
                      className="text-muted-foreground text-xs"
                      title={dateTime(session.createdAt)}
                    >
                      {ago(session.createdAt)}
                    </TableCell>
                    <TableCell>
                      <Badge variant={session.active ? 'success' : 'outline'}>
                        {session.active ? 'active' : 'ended'}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
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
