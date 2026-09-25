import Link from 'next/link';
import { LayersIcon, SparklesIcon } from 'lucide-react';
import { apiPage } from '@/lib/api';
import { ago, count, money, percent } from '@/lib/format';
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
import { Button } from '@/components/ui/button';
import { SettingField } from './setting-field';
import type { PlatformOverview } from './types';

export const metadata = { title: 'Platform — Konar Console' };

export default async function PlatformPage() {
  const overview = await apiPage<PlatformOverview>('/admin/platform');
  const pricing = overview.settings.filter((s) => s.group === 'pricing');
  const limits = overview.settings.filter((s) => s.group === 'limits');
  const { margin } = overview;

  return (
    <>
      <PageHeader
        title="Platform"
        description="What the platform charges, grants and allows. Changes take effect without a deploy."
      >
        <Button variant="outline" size="sm" asChild>
          <Link href="/platform/plans">
            <LayersIcon />
            Plans
          </Link>
        </Button>
        <Button variant="outline" size="sm" asChild>
          <Link href="/platform/models">
            <SparklesIcon />
            Models
          </Link>
        </Button>
      </PageHeader>

      <div className="grid gap-3 sm:grid-cols-3">
        <Stat
          label={`Charged for model usage (${margin.windowDays}d)`}
          value={money(margin.charged)}
          hint="What customers' credits were debited"
        />
        <Stat
          label="Provider cost"
          value={money(margin.providerCost)}
          hint="What the model provider billed us"
          tone="warning"
        />
        <Stat
          label="Gross profit on usage"
          value={money(margin.grossProfit)}
          hint={
            margin.providerCost > 0
              ? `${percent(margin.grossProfit / margin.providerCost)} over cost`
              : 'no usage in this window'
          }
          tone={margin.grossProfit > 0 ? 'positive' : 'default'}
        />
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Pricing</CardTitle>
            <p className="text-muted-foreground text-xs">
              Margins multiply what the platform pays. 1× bills at cost.
            </p>
          </CardHeader>
          <CardContent className="flex flex-col gap-5">
            {pricing.map((setting) => (
              <SettingField key={setting.key} setting={setting} />
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Limits</CardTitle>
            <p className="text-muted-foreground text-xs">
              Spending ceilings a build cannot cross.
            </p>
          </CardHeader>
          <CardContent className="flex flex-col gap-5">
            {limits.map((setting) => (
              <SettingField key={setting.key} setting={setting} />
            ))}
          </CardContent>
        </Card>
      </div>

      <Card className="mt-4">
        <CardHeader>
          <CardTitle>Margin by model, last {margin.windowDays} days</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Model</TableHead>
                <TableHead className="text-right">Calls</TableHead>
                <TableHead className="text-right">Provider cost</TableHead>
                <TableHead className="text-right">Charged</TableHead>
                <TableHead className="text-right">Markup</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {margin.byModel.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-muted-foreground">
                    No model calls in this window.
                  </TableCell>
                </TableRow>
              ) : (
                margin.byModel.map((row) => (
                  <TableRow key={row.model}>
                    <TableCell className="font-medium">{row.model}</TableCell>
                    <TableCell className="tabular text-right">
                      {count(row.operations)}
                    </TableCell>
                    <TableCell className="tabular text-right">
                      {money(row.providerCost)}
                    </TableCell>
                    <TableCell className="tabular text-right">
                      {money(row.charged)}
                    </TableCell>
                    <TableCell className="tabular text-right">
                      {percent(row.margin)}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Cloud rate card</CardTitle>
            <p className="text-muted-foreground text-xs">
              Per month assumes one always-on resource for 730 hours.
            </p>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Tier</TableHead>
                  <TableHead>Unit</TableHead>
                  <TableHead className="text-right">Per hour</TableHead>
                  <TableHead className="text-right">Per month</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {[...overview.rateCard.compute, ...overview.rateCard.database].map(
                  (row) => (
                    <TableRow key={`${row.unit}-${row.tier}`}>
                      <TableCell className="font-medium">{row.tier}</TableCell>
                      <TableCell className="text-muted-foreground text-xs">
                        {row.unit}
                      </TableCell>
                      <TableCell className="tabular text-right text-xs">
                        ${row.pricePerHour.toFixed(6)}
                      </TableCell>
                      <TableCell className="tabular text-right">
                        {money(row.pricePerMonth)}
                      </TableCell>
                    </TableRow>
                  ),
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Build engine</CardTitle>
            <p className="text-muted-foreground text-xs">
              From the API&apos;s environment, not editable here — a field that
              reset on the next deploy would be a lie.
            </p>
          </CardHeader>
          <CardContent className="flex flex-col gap-2 text-sm">
            <Row label="Architect">{overview.engine.models.architect}</Row>
            <Row label="Editor">{overview.engine.models.editor}</Row>
            <Row label="Premium">{overview.engine.models.premium}</Row>
            <Row label="Premium escalation">
              {overview.engine.escalation.premiumEnabled ? 'on' : 'off'} · after{' '}
              {overview.engine.escalation.afterFailures} failures · max{' '}
              {overview.engine.escalation.maxPremiumOperationsPerRun} per run
            </Row>
            <Row label="Repair attempts">
              {overview.engine.repair.maxAttemptsPerRun} per run
            </Row>
            <Row label="Review">
              {overview.engine.review.enabled
                ? `${overview.engine.review.maxRounds} rounds`
                : 'off'}
            </Row>
            <Row label="Required checks">
              {overview.engine.verify.required.join(', ') || 'none'}
            </Row>
          </CardContent>
        </Card>
      </div>

      <p className="text-muted-foreground mt-4 text-xs">
        {overview.settings.some((s) => s.updatedAt)
          ? `Last pricing change ${ago(
              overview.settings
                .map((s) => s.updatedAt)
                .filter((value): value is string => !!value)
                .sort()
                .at(-1),
            )}.`
          : 'No setting has been changed from its default yet.'}
      </p>
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
      <span className="text-right text-sm">{children}</span>
    </div>
  );
}
