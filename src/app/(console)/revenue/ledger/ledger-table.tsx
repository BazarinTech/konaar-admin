'use client';

import { loadLedger } from '../actions';
import { LoadMoreButton, useLoadMore } from '@/components/load-more';
import { Card, CardContent } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { dateTime, money } from '@/lib/format';
import { DeleteEntry } from './delete-entry';
import type { LedgerLine, PageInfo } from '../types';

const SOURCES: Record<string, string> = {
  invoice: 'Invoice',
  credit_topup: 'Top-up',
  generation: 'Model usage',
  manual: 'Entered',
  recurring: 'Monthly',
};

export function LedgerTable({
  initial,
  days,
}: {
  initial: { data: LedgerLine[]; pageInfo: PageInfo };
  days: number;
}) {
  const { rows, cursor, pending, failed, loadMore } = useLoadMore<LedgerLine>(
    initial,
    (next) => loadLedger(days, next),
  );

  return (
    <>
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>When</TableHead>
                <TableHead className="hidden sm:table-cell">Source</TableHead>
                <TableHead className="hidden md:table-cell">Category</TableHead>
                <TableHead>Description</TableHead>
                <TableHead className="text-right">Amount</TableHead>
                <TableHead />
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((line) => (
                <TableRow key={`${line.source}-${line.sourceId}`}>
                  <TableCell className="text-muted-foreground text-xs">
                    {dateTime(line.at)}
                  </TableCell>
                  <TableCell className="hidden text-xs sm:table-cell">
                    {SOURCES[line.source] ?? line.source}
                  </TableCell>
                  <TableCell className="hidden md:table-cell">
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
                    {money(line.amount)}
                  </TableCell>
                  <TableCell className="text-right">
                    {line.editable ? <DeleteEntry id={line.sourceId} /> : null}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <LoadMoreButton
        hasMore={cursor.hasMore}
        pending={pending}
        failed={failed}
        onClick={loadMore}
        shown={rows.length}
      />
    </>
  );
}
