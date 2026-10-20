import Link from 'next/link';
import { ArrowLeftIcon } from 'lucide-react';
import { apiPage } from '@/lib/api';
import { count, date, money } from '@/lib/format';
import { PageHeader } from '@/components/page-header';
import { Empty } from '@/components/empty';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { DiscountDialog } from './discount-dialog';
import { Redemptions } from './redemptions';
import { RuleControls } from '../rule-controls';
import { SCOPE_LABEL, STATE_VARIANT, type Discount } from '../pricing-types';
import type { PlatformOverview } from '../types';

export const metadata = { title: 'Discounts — Konaar Console' };

export default async function DiscountsPage() {
  const [overview, discounts] = await Promise.all([
    apiPage<PlatformOverview>('/admin/platform'),
    apiPage<{ data: Discount[] }>('/admin/platform/discounts'),
  ]);
  const planName = (code: string) =>
    overview.plans.find((p) => p.code === code)?.name ?? code;

  return (
    <>
      <Button variant="ghost" size="sm" asChild className="mb-4 -ml-2">
        <Link href="/platform/plans">
          <ArrowLeftIcon />
          Plans
        </Link>
      </Button>
      <PageHeader
        title="Discounts"
        description="Codes customers type, and sales that apply by themselves. A customer always gets the larger of the two."
      >
        <DiscountDialog plans={overview.plans} />
      </PageHeader>

      {discounts.data.length === 0 ? (
        <Empty>No discounts yet.</Empty>
      ) : (
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Discount</TableHead>
                  <TableHead className="hidden md:table-cell">Applies to</TableHead>
                  <TableHead className="hidden lg:table-cell">Runs</TableHead>
                  <TableHead className="text-right">Used</TableHead>
                  <TableHead className="hidden text-right sm:table-cell">Given away</TableHead>
                  <TableHead />
                </TableRow>
              </TableHeader>
              <TableBody>
                {discounts.data.map((d) => (
                  <TableRow key={d.id}>
                    <TableCell className="whitespace-normal">
                      <div className="flex flex-wrap items-center gap-1.5">
                        <span className="font-medium">{d.name}</span>
                        <Badge variant={STATE_VARIANT[d.state]}>{d.state}</Badge>
                      </div>
                      <div className="text-muted-foreground mt-0.5 text-xs">
                        {d.kind === 'percent'
                          ? `${d.percentOff}% off`
                          : `${money((d.amountOffCents ?? 0) / 100)} off`}
                        {' · '}
                        {d.code ? (
                          <code className="font-mono">{d.code}</code>
                        ) : (
                          'automatic'
                        )}
                        {d.durationCycles ? ` · for ${d.durationCycles} periods` : ''}
                      </div>
                    </TableCell>
                    <TableCell className="hidden text-xs md:table-cell">
                      {d.planCodes.length ? d.planCodes.map(planName).join(', ') : 'Every paid plan'}
                      <div className="text-muted-foreground">{SCOPE_LABEL[d.billingInterval]}</div>
                    </TableCell>
                    <TableCell className="text-muted-foreground hidden text-xs lg:table-cell">
                      {d.startsAt ? date(d.startsAt) : 'Now'} – {d.endsAt ? date(d.endsAt) : 'until stopped'}
                    </TableCell>
                    <TableCell className="text-right">
                      <Redemptions id={d.id} name={d.name} count={d.redemptionCount} />
                      {d.maxRedemptions ? (
                        <div className="text-muted-foreground text-[11px] tabular">
                          of {count(d.maxRedemptions)}
                        </div>
                      ) : null}
                    </TableCell>
                    <TableCell className="tabular hidden text-right text-xs sm:table-cell">
                      {money(d.savedCents / 100)}
                    </TableCell>
                    <TableCell>
                      <div className="flex justify-end">
                        <DiscountDialog plans={overview.plans} discount={d} />
                        <RuleControls kind="discount" id={d.id} name={d.name} status={d.status} />
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </>
  );
}
