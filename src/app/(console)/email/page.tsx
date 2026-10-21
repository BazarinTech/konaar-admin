import Link from 'next/link';
import { PlusIcon } from 'lucide-react';
import { apiPage } from '@/lib/api';
import { count, dateTime, percent } from '@/lib/format';
import { PageHeader } from '@/components/page-header';
import { Empty } from '@/components/empty';
import { Stat } from '@/components/stat';
import { AutoRefresh } from '@/components/auto-refresh';
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
import { AUDIENCE_LABEL, statusVariant, type Campaign } from './types';

export const metadata = { title: 'Email — Konaar Console' };

export default async function EmailPage() {
  const [campaigns, stats] = await Promise.all([
    apiPage<{ data: Campaign[] }>('/admin/email/campaigns'),
    apiPage<Record<string, number>>('/admin/email/deliveries/stats?days=30'),
  ]);
  const sending = campaigns.data.some((c) => c.status === 'sending');
  const total = Object.values(stats).reduce((a, b) => a + b, 0);
  const problems = (stats.bounced ?? 0) + (stats.complained ?? 0) + (stats.failed ?? 0);

  return (
    <>
      {sending ? <AutoRefresh seconds={5} /> : null}
      <PageHeader
        title="Bulk email"
        description="Send one message to a slice of your users — everyone, or by status and plan. People who turned product updates off are skipped."
      >
        <Button size="sm" asChild>
          <Link href="/email/new">
            <PlusIcon />
            New bulk email
          </Link>
        </Button>
      </PageHeader>

      <div className="mb-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Stat label="Sent, last 30 days" value={count(total)} />
        <Stat label="Delivered" value={count(stats.delivered ?? 0)} hint={total ? percent((stats.delivered ?? 0) / total) : undefined} />
        <Stat label="Bounced or failed" value={count(problems)} hint={total ? percent(problems / total) : undefined} />
        <Stat label="Still queued" value={count(stats.queued ?? 0)} />
      </div>

      {campaigns.data.length === 0 ? (
        <Empty>No bulk emails yet.</Empty>
      ) : (
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Subject</TableHead>
                  <TableHead className="hidden md:table-cell">Audience</TableHead>
                  <TableHead className="text-right">Sent</TableHead>
                  <TableHead className="hidden lg:table-cell">When</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {campaigns.data.map((c) => (
                  <TableRow key={c.id}>
                    <TableCell className="whitespace-normal">
                      <div className="flex flex-wrap items-center gap-1.5">
                        <span className="font-medium">{c.subject}</span>
                        <Badge variant={statusVariant(c.status)}>{c.status}</Badge>
                      </div>
                      <div className="text-muted-foreground text-xs">
                        From {c.from ?? 'the platform address'}
                        {c.createdBy ? ` · by ${c.createdBy}` : ''}
                      </div>
                    </TableCell>
                    <TableCell className="text-muted-foreground hidden text-xs whitespace-normal md:table-cell">
                      {AUDIENCE_LABEL[c.audience.status]}
                      {c.audience.plan ? ` · ${c.audience.plan} plan` : ''}
                      {c.audience.includeOptedOut ? ' · including opted-out' : ''}
                    </TableCell>
                    <TableCell className="text-right tabular">
                      {c.status === 'sending' ? (
                        <span>
                          {count(c.progress)} / {count(c.recipientCount)}
                        </span>
                      ) : (
                        <span>
                          {count(c.sentCount)} / {count(c.recipientCount)}
                          {c.failedCount ? (
                            <span className="text-destructive block text-xs">{count(c.failedCount)} failed</span>
                          ) : null}
                        </span>
                      )}
                    </TableCell>
                    <TableCell className="text-muted-foreground hidden text-xs lg:table-cell">{dateTime(c.createdAt)}</TableCell>
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
