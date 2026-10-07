import Link from 'next/link';
import { ArrowLeftIcon } from 'lucide-react';
import { apiPage } from '@/lib/api';
import { PageHeader } from '@/components/page-header';
import { Button } from '@/components/ui/button';
import { Empty } from '@/components/empty';
import { LedgerTable } from './ledger-table';
import type { LedgerLine, PageInfo } from '../types';

export const metadata = { title: 'Ledger — Konaar Console' };

export default async function LedgerPage({
  searchParams,
}: {
  searchParams: Promise<{ days?: string }>;
}) {
  const { days } = await searchParams;
  const window = Math.min(Math.max(Number(days) || 90, 1), 365);
  const ledger = await apiPage<{ data: LedgerLine[]; pageInfo: PageInfo }>(
    `/admin/revenue/ledger?days=${window}`,
  );

  return (
    <>
      <Button variant="ghost" size="sm" asChild className="mb-4 -ml-2">
        <Link href="/revenue">
          <ArrowLeftIcon />
          Revenue
        </Link>
      </Button>
      <PageHeader
        title="Ledger"
        description="Every movement, from whichever table recorded it. Only hand-entered lines can be withdrawn."
      >
        {[30, 90, 365].map((option) => (
          <Button
            key={option}
            asChild
            size="sm"
            variant={window === option ? 'secondary' : 'ghost'}
            className="shrink-0"
          >
            <Link
              href={{ pathname: '/revenue/ledger', query: { days: option } }}
            >
              {option === 365 ? '1 year' : `${option} days`}
            </Link>
          </Button>
        ))}
      </PageHeader>

      {ledger.data.length === 0 ? (
        <Empty>Nothing moved in this period.</Empty>
      ) : (
        <LedgerTable initial={ledger} days={window} />
      )}
    </>
  );
}
