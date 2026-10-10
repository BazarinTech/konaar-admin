import { apiPage } from '@/lib/api';
import { PageHeader } from '@/components/page-header';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { PayoutRow } from './payout-row';

export const metadata = { title: 'Referrals — Konaar Console' };

export interface PayoutRecord {
  id: string;
  amountCents: number;
  currency: string;
  status: 'requested' | 'processing' | 'paid' | 'failed';
  destination: string | null;
  failureReason: string | null;
  requestedAt: string;
  paidAt: string | null;
  /** The real address, not the masked one customers see: whoever approves
   *  this is sending money and has to answer for the decision. */
  person: { name: string; email: string };
}

interface Queue {
  /** False when this deployment has no payment provider configured. */
  configured: boolean;
  data: PayoutRecord[];
}

/**
 * Payouts waiting to be sent.
 *
 * The queue only. Earnings themselves need no operator — they are recorded
 * by the ledger and mature on a schedule — so the one thing on this page is
 * the one decision a person has to make.
 */
export default async function ReferralsPage() {
  const queue = await apiPage<Queue>('/admin/referrals/payouts');
  const waiting = queue.data;
  const total = waiting.reduce((sum, p) => sum + p.amountCents, 0);

  return (
    <div className="flex flex-col gap-8">
      <PageHeader
        title="Referrals"
        description="Commission people have asked to cash out. Nothing is sent until somebody here approves it."
      />

      {!queue.configured ? (
        <Card>
          <CardContent className="py-4 text-sm">
            <p className="font-medium">Payouts are not switched on</p>
            <p className="pt-1 text-muted-foreground">
              People can earn and request a payout, and those requests collect
              here, but nothing can be sent until{' '}
              <code className="font-mono text-xs">STRIPE_SECRET_KEY</code> is
              set on the API. Approving one now will fail and give the person
              their balance back.
            </p>
          </CardContent>
        </Card>
      ) : null}

      <section className="flex flex-col gap-3">
        <div className="flex items-baseline gap-2">
          <h2 className="text-sm font-medium">Waiting</h2>
          <Badge variant={waiting.length > 0 ? 'default' : 'secondary'}>
            {waiting.length}
          </Badge>
          {total > 0 ? (
            <span className="tabular text-xs text-muted-foreground">
              ${(total / 100).toFixed(2)} in total
            </span>
          ) : null}
        </div>

        {waiting.length === 0 ? (
          <Card>
            <CardContent className="py-10 text-center text-sm text-muted-foreground">
              Nobody is waiting to be paid.
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardContent className="flex flex-col divide-y p-0">
              {waiting.map((payout) => (
                <PayoutRow key={payout.id} payout={payout} />
              ))}
            </CardContent>
          </Card>
        )}
      </section>

      <p className="text-xs text-muted-foreground">
        The commission rate, the earning window, the hold and the minimum
        payout are all set under <span className="font-medium">Platform</span>.
        Approvals and refusals are recorded in{' '}
        <span className="font-medium">Activity</span>.
      </p>
    </div>
  );
}
