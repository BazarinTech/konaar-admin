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
import { OfferDialog } from './offer-dialog';
import { RuleControls } from '../rule-controls';
import { SCOPE_LABEL, STATE_VARIANT, type Offer } from '../pricing-types';
import type { PlatformOverview } from '../types';

export const metadata = { title: 'Offers — Konaar Console' };

export default async function OffersPage() {
  const [overview, offers] = await Promise.all([
    apiPage<PlatformOverview>('/admin/platform'),
    apiPage<{ data: Offer[] }>('/admin/platform/offers'),
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
        title="Offers"
        description="Extras that come with a plan: a free domain, bonus credits. Each workspace gets an offer once."
      >
        <OfferDialog plans={overview.plans} />
      </PageHeader>

      {offers.data.length === 0 ? (
        <Empty>No offers yet.</Empty>
      ) : (
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Offer</TableHead>
                  <TableHead className="hidden md:table-cell">With</TableHead>
                  <TableHead className="hidden lg:table-cell">Runs</TableHead>
                  <TableHead className="text-right">Granted</TableHead>
                  <TableHead />
                </TableRow>
              </TableHeader>
              <TableBody>
                {offers.data.map((o) => (
                  <TableRow key={o.id}>
                    <TableCell className="whitespace-normal">
                      <div className="flex flex-wrap items-center gap-1.5">
                        <span className="font-medium">{o.name}</span>
                        <Badge variant={STATE_VARIANT[o.state]}>{o.state}</Badge>
                      </div>
                      <div className="text-muted-foreground mt-0.5 text-xs">
                        {o.perk === 'free_domain'
                          ? `Free first year, names up to ${money(o.perkValue / 100)}`
                          : `${count(o.perkValue)} ${o.perk === 'ai_credits' ? 'AI' : 'cloud'} credits`}
                        {o.claimDays ? ` · claim within ${o.claimDays} days` : ''}
                      </div>
                    </TableCell>
                    <TableCell className="hidden text-xs md:table-cell">
                      {o.planCodes.length ? o.planCodes.map(planName).join(', ') : 'Any paid plan'}
                      <div className="text-muted-foreground">{SCOPE_LABEL[o.billingInterval]}</div>
                    </TableCell>
                    <TableCell className="text-muted-foreground hidden text-xs lg:table-cell">
                      {o.startsAt ? date(o.startsAt) : 'Now'} – {o.endsAt ? date(o.endsAt) : 'until stopped'}
                    </TableCell>
                    <TableCell className="tabular text-right text-xs">
                      {count(o.granted)}
                      {o.perk === 'free_domain' ? (
                        <div className="text-muted-foreground">{count(o.claimed)} claimed</div>
                      ) : null}
                    </TableCell>
                    <TableCell>
                      <div className="flex justify-end">
                        <OfferDialog plans={overview.plans} offer={o} />
                        <RuleControls kind="offer" id={o.id} name={o.name} status={o.status} />
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
