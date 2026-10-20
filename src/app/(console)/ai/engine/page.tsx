import Link from 'next/link';
import { BookOpenIcon } from 'lucide-react';
import { apiPage } from '@/lib/api';
import { ago, count } from '@/lib/format';
import { PageHeader } from '@/components/page-header';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { EngineControl } from './engine-control';
import { OPERATION_LABELS, type EngineOverview, type EngineSetting } from '../types';

export const metadata = { title: 'Engine — Konaar Console' };

export default async function EnginePage() {
  const overview = await apiPage<EngineOverview>('/admin/ai/engine');
  const byKey = new Map(overview.settings.map((s) => [s.key, s]));
  const pick = (key: string) => byKey.get(key);
  const shared = {
    models: overview.models,
    roles: overview.roles,
    efforts: overview.efforts,
  };
  const changed = overview.settings.filter((s) => s.overridden);

  const quality = overview.settings.filter(
    (s) => s.group === 'quality',
  );
  const turns = overview.settings.filter((s) => s.key.startsWith('maxTurns.'));

  return (
    <>
      <PageHeader
        title="Engine"
        description="Which model does which work, how hard it thinks and how long it may run. The environment sets the defaults; changes here sit on top, take effect within ten seconds and survive deploys."
      >
        <Button variant="outline" size="sm" asChild>
          <Link href="/ai/skills">
            <BookOpenIcon />
            Skills
          </Link>
        </Button>
      </PageHeader>

      {changed.length ? (
        <p className="text-muted-foreground mb-4 text-sm">
          {count(changed.length)} setting{changed.length === 1 ? '' : 's'}{' '}
          changed from the default:{' '}
          {changed.map((s) => s.label).join(', ')}.
        </p>
      ) : (
        <p className="text-muted-foreground mb-4 text-sm">
          Everything is on its default.
        </p>
      )}

      {/* `minmax(0,1fr)`, not the implicit `auto` track: an auto track grows
          to fit its widest child, so the routing table made every card on
          the page as wide as itself and the page scrolled sideways on a
          phone. With a zero minimum, the table scrolls inside its own box. */}
      <div className="grid grid-cols-[minmax(0,1fr)] gap-4">
        {/* ── models ─────────────────────────────────────────────────── */}
        <Card>
          <CardHeader>
            <CardTitle>Models</CardTitle>
            <CardDescription>
              Three roles, and the model that fills each. Work is routed to a
              role, never to a model directly — so swapping a model here moves
              every kind of work that role does.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-6 md:grid-cols-3">
            {(['architect', 'editor', 'premium'] as const).map((role) => {
              const s = pick(`models.${role}`);
              return s ? <EngineControl key={s.key} setting={s} {...shared} /> : null;
            })}
          </CardContent>
        </Card>

        {/* ── routing ────────────────────────────────────────────────── */}
        <Card>
          <CardHeader>
            <CardTitle>Work</CardTitle>
            <CardDescription>
              Each kind of work, the role it goes to, how hard it thinks and
              the most one call may write. Automatic lets the router decide
              from the work and its complexity; pinning overrides that but
              not escalation — pinned work that keeps failing still moves up
              a tier.
            </CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Work</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Effort</TableHead>
                    <TableHead>Output limit (tokens)</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {overview.operations.map((op) => {
                    const role = pick(`role.${op}`);
                    const effort = pick(`effort.${op}`);
                    const tokens = pick(`maxOutputTokens.${op}`);
                    const touched = [role, effort, tokens].some((s) => s?.overridden);
                    return (
                      <TableRow key={op}>
                        <TableCell className="min-w-48 align-top whitespace-normal">
                          <div className="flex flex-col gap-0.5">
                            <span className="flex items-center gap-2 font-medium">
                              {OPERATION_LABELS[op] ?? op}
                              {touched ? <Badge variant="outline">changed</Badge> : null}
                            </span>
                            <span className="text-muted-foreground max-w-64 text-xs">
                              {helpFor(role)}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell className="align-top">
                          {role ? <EngineControl setting={role} {...shared} compact /> : null}
                        </TableCell>
                        <TableCell className="align-top">
                          {effort ? (
                            <EngineControl setting={effort} {...shared} compact />
                          ) : null}
                        </TableCell>
                        <TableCell className="align-top">
                          {tokens ? (
                            <EngineControl setting={tokens} {...shared} compact />
                          ) : null}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>

        {/* ── limits ─────────────────────────────────────────────────── */}
        <Card>
          <CardHeader>
            <CardTitle>Step limits</CardTitle>
            <CardDescription>
              How many model turns each loop may take. A build that runs out
              stops and can be resumed; a turn that only recovers from a
              context or output limit is not counted.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-6 md:grid-cols-2">
            {turns.map((s) => (
              <EngineControl key={s.key} setting={s} {...shared} />
            ))}
          </CardContent>
        </Card>

        {/* ── quality ────────────────────────────────────────────────── */}
        <Card>
          <CardHeader>
            <CardTitle>Escalation and review</CardTitle>
            <CardDescription>
              When work moves up a tier, how much of the premium model one
              build may use, and how the finished site is checked.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-6 md:grid-cols-2">
            {quality.map((s) => (
              <EngineControl key={s.key} setting={s} {...shared} />
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Budgets</CardTitle>
            <CardDescription>
              Set with the other platform limits, where they are enforced.
            </CardDescription>
          </CardHeader>
          <CardContent className="text-sm">
            A build may spend{' '}
            <span className="tabular font-medium">
              {count(overview.budgets.runCredits)}
            </span>{' '}
            credits, and a project{' '}
            <span className="tabular font-medium">
              {count(overview.budgets.projectCredits30d)}
            </span>{' '}
            in thirty days.{' '}
            <Link href="/platform" className="underline underline-offset-4">
              Change on the platform page
            </Link>
            .
          </CardContent>
        </Card>
      </div>

      {changed.length ? <History settings={changed} /> : null}
    </>
  );
}

/** The operation's own help, without the routing sentence every row repeats. */
function helpFor(setting: EngineSetting | undefined): string {
  if (!setting) return '';
  return setting.help.replace(/\s*Pin it to a role, or leave it automatic\.$/, '');
}

function History({ settings }: { settings: EngineSetting[] }) {
  return (
    <div className="mt-6">
      <h2 className="mb-2 text-sm font-medium">Changed from the default</h2>
      <ul className="text-muted-foreground grid gap-1 text-xs">
        {settings
          .slice()
          .sort((a, b) => (b.updatedAt ?? '').localeCompare(a.updatedAt ?? ''))
          .map((s) => (
            <li key={s.key}>
              <span className="text-foreground">{s.label}</span>
              {s.updatedBy
                ? ` · ${ago(s.updatedAt)} by ${s.updatedBy.name}`
                : ''}
            </li>
          ))}
      </ul>
    </div>
  );
}
