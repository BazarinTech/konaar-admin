import Link from 'next/link';
import { apiPage } from '@/lib/api';
import { count, dateTime, money } from '@/lib/format';
import { PageHeader } from '@/components/page-header';
import { Empty } from '@/components/empty';
import { Stat } from '@/components/stat';
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
import { cn } from '@/lib/utils';
import {
  STATUS_LABEL,
  kes,
  statusVariant,
  type AdminPayment,
  type PaymentStatus,
  type PaymentsSummary,
  type UnclaimedPayment,
} from './types';
import { UnclaimedRow } from './unclaimed';

export const metadata = { title: 'Payments — Konaar Console' };

const titleCase = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

const FILTERS: { value: PaymentStatus | ''; label: string }[] = [
  { value: '', label: 'All' },
  { value: 'succeeded', label: 'Paid' },
  { value: 'pending', label: 'Waiting' },
  { value: 'underpaid', label: 'Underpaid' },
  { value: 'failed', label: 'Failed' },
  { value: 'expired', label: 'Expired' },
];

const MATCHED: Record<string, string> = {
  client: 'confirmed in the browser',
  callback: 'matched from the callback',
  admin: 'matched by an administrator',
};

export default async function PaymentsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; before?: string }>;
}) {
  const sp = await searchParams;
  const status = FILTERS.some((f) => f.value === sp.status) ? sp.status : undefined;
  const qs = new URLSearchParams();
  if (status) qs.set('status', status);
  if (sp.before) qs.set('before', sp.before);

  const [summary, list, unclaimed] = await Promise.all([
    apiPage<PaymentsSummary>('/admin/payments/summary'),
    apiPage<{ data: AdminPayment[]; nextBefore: string | null }>(
      `/admin/payments${qs.size ? `?${qs}` : ''}`,
    ),
    apiPage<{ data: UnclaimedPayment[] }>('/admin/payments/unclaimed'),
  ]);

  const href = (q: { status?: string; before?: string }) => ({
    pathname: '/payments',
    query: Object.fromEntries(Object.entries(q).filter(([, v]) => v)),
  });

  return (
    <div className="flex flex-col gap-8">
      <PageHeader
        title="Payments"
        description="M-Pesa payments through Palpluss. Nothing is credited until the Palpluss API confirms the transaction."
      />

      {!summary.configured || !summary.callbackConfigured ? (
        <Card>
          <CardContent className="py-4 text-sm">
            <p className="font-medium">
              {summary.configured ? 'The callback is not set up' : 'Payments are not switched on'}
            </p>
            <p className="text-muted-foreground pt-1">
              {summary.configured ? (
                <>
                  Set <code className="font-mono text-xs">PALPLUSS_CALLBACK_TOKEN</code> on
                  the API and put the callback URL on the paylink, or payments made in a
                  closed tab and every referral payout will wait for someone here.
                </>
              ) : (
                <>
                  Set <code className="font-mono text-xs">PALPLUSS_API_KEY</code> and{' '}
                  <code className="font-mono text-xs">PALPLUSS_PAYLINK_ID</code> on the API.
                  Until then customers cannot pay, and paid plans cannot be taken.
                </>
              )}
            </p>
          </CardContent>
        </Card>
      ) : null}

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Stat label="Received this month" value={kes(summary.monthKes)} hint={`${count(summary.monthPaid)} payments`} />
        <Stat label="Waiting" value={count(summary.pending)} hint="Checkouts started, not yet paid" />
        <Stat
          label="Unclaimed"
          value={count(summary.unclaimed)}
          tone={summary.unclaimed > 0 ? 'warning' : 'default'}
          hint="Paid, but matched to no checkout"
        />
        <Stat
          label="Rate"
          value={`KES ${summary.kesPerUsd.toLocaleString('en-US')}`}
          hint="Per dollar — change it under Platform"
        />
      </div>

      {unclaimed.data.length ? (
        <section className="flex flex-col gap-3">
          <div className="flex items-baseline gap-2">
            <h2 className="text-sm font-medium">Unclaimed</h2>
            <Badge>{unclaimed.data.length}</Badge>
          </div>
          <p className="text-muted-foreground text-xs">
            Money that arrived with no checkout to match it to. Find the customer by the
            phone number, then credit their workspace or match the checkout they started.
          </p>
          <Card>
            <CardContent className="p-0">
              <ul className="divide-y">
                {unclaimed.data.map((tx) => (
                  <UnclaimedRow key={tx.id} tx={tx} />
                ))}
              </ul>
            </CardContent>
          </Card>
        </section>
      ) : null}

      <section className="flex flex-col gap-3">
        <nav aria-label="Filter by status" className="flex flex-wrap gap-1.5">
          {FILTERS.map((f) => (
            <Link
              key={f.label}
              href={href({ status: f.value || undefined })}
              aria-current={(status ?? '') === f.value ? 'page' : undefined}
              className={cn(
                'rounded-md border px-2.5 py-1 text-xs transition-colors',
                (status ?? '') === f.value
                  ? 'bg-primary text-primary-foreground border-primary'
                  : 'text-muted-foreground hover:text-foreground',
              )}
            >
              {f.label}
            </Link>
          ))}
        </nav>

        {list.data.length === 0 ? (
          <Empty>No payments here yet.</Empty>
        ) : (
          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Payment</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Amount</TableHead>
                    <TableHead className="hidden md:table-cell">M-Pesa</TableHead>
                    <TableHead className="hidden sm:table-cell">Started</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {list.data.map((p) => (
                    <TableRow key={p.id}>
                      <TableCell className="max-w-0 whitespace-normal">
                        <div className="font-medium">
                          {p.purpose === 'subscription'
                            ? `${titleCase(p.planCode ?? 'plan')} plan, ${p.interval === 'year' ? 'yearly' : 'monthly'}`
                            : `${p.creditKind === 'ai' ? 'AI' : 'Cloud'} credits`}
                        </div>
                        <div className="text-muted-foreground truncate text-xs">
                          {p.workspaceName} · <span className="font-mono">{p.id}</span>
                        </div>
                        {p.failureReason ? (
                          <div className="text-muted-foreground text-xs">{p.failureReason}</div>
                        ) : null}
                      </TableCell>
                      <TableCell>
                        <Badge variant={statusVariant(p.status)}>{STATUS_LABEL[p.status]}</Badge>
                        {p.matchedBy ? (
                          <div className="text-muted-foreground pt-1 text-[11px]">{MATCHED[p.matchedBy]}</div>
                        ) : null}
                      </TableCell>
                      <TableCell className="tabular text-right text-xs">
                        <div>{kes(p.paidKes ?? p.amountKes)}</div>
                        <div className="text-muted-foreground">
                          {money(
                            (p.purpose === 'subscription' || p.creditedCents === null
                              ? p.amountCents
                              : p.creditedCents) / 100,
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="hidden font-mono text-xs md:table-cell">
                        {p.mpesaReceipt ?? '—'}
                      </TableCell>
                      <TableCell className="text-muted-foreground hidden text-xs sm:table-cell">
                        {dateTime(p.createdAt)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        )}

        {list.nextBefore ? (
          <div className="flex justify-center">
            <Link
              href={href({ status, before: list.nextBefore })}
              className="rounded-md border px-3 py-1.5 text-xs hover:bg-muted"
            >
              Older payments
            </Link>
          </div>
        ) : null}
      </section>
    </div>
  );
}
