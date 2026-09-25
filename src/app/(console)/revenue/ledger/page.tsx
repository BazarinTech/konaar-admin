import Link from 'next/link';
import { ArrowLeftIcon } from 'lucide-react';
import { apiPage } from '@/lib/api';
import { dateTime, money } from '@/lib/format';
import { PageHeader } from '@/components/page-header';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Empty } from '@/components/empty';
import { DeleteEntry } from './delete-entry';
import type { LedgerLine } from '../types';

export const metadata = { title: 'Ledger — Konar Console' };

const SOURCES: Record<string, string> = {
  invoice: 'Invoice',
  credit_topup: 'Top-up',
  generation: 'Model usage',
  manual: 'Entered',
};

export default async function LedgerPage({
  searchParams,
}: {
  searchParams: Promise<{ days?: string }>;
}) {
  const { days } = await searchParams;
  const window = Math.min(Math.max(Number(days) || 90, 1), 365);
  const ledger = await apiPage<{ data: LedgerLine[] }>(
    `/admin/revenue/ledger?days=${window}&limit=500`,
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
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>When</TableHead>
                  <TableHead>Source</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead className="text-right">Amount</TableHead>
                  <TableHead />
                </TableRow>
              </TableHeader>
              <TableBody>
                {ledger.data.map((line) => (
                  <TableRow key={`${line.source}-${line.sourceId}`}>
                    <TableCell className="text-muted-foreground text-xs">
                      {dateTime(line.at)}
                    </TableCell>
                    <TableCell className="text-xs">
                      {SOURCES[line.source] ?? line.source}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{line.category}</Badge>
                    </TableCell>
                    <TableCell className="max-w-96 truncate text-sm">
                      {line.description}
                      {line.recordedBy ? (
                        <span className="text-muted-foreground text-xs">
                          {' '}
                          · {line.recordedBy}
                        </span>
                      ) : null}
                    </TableCell>
                    <TableCell
                      className={
                        line.kind === 'income'
                          ? 'tabular text-success text-right'
                          : 'tabular text-right'
                      }
                    >
                      {line.kind === 'income' ? '+' : '−'}
                      {money(line.amount).replace('$', '$')}
                    </TableCell>
                    <TableCell className="text-right">
                      {line.editable ? (
                        <DeleteEntry id={line.sourceId} />
                      ) : null}
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
