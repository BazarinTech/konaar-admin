'use client';

import * as React from 'react';
import { toast } from 'sonner';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ago } from '@/lib/format';
import { approvePayout, rejectPayout } from './actions';
import type { PayoutRecord } from './page';

/**
 * One request, and the two things that can happen to it.
 *
 * Approving is irreversible — the money leaves — so it asks once. Declining
 * is not: the earnings go straight back to the person's available balance
 * and they can ask again.
 */
export function PayoutRow({ payout }: { payout: PayoutRecord }) {
  const [pending, start] = React.useTransition();
  const [confirming, setConfirming] = React.useState(false);

  function run(action: () => Promise<{ error?: string; message?: string }>) {
    start(async () => {
      const result = await action();
      if (result.error) toast.error(result.error);
      else {
        toast.success(result.message ?? 'Done.');
        setConfirming(false);
      }
    });
  }

  return (
    <div className="flex flex-col gap-3 p-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate font-medium">
            ${(payout.amountCents / 100).toFixed(2)} {payout.currency}
          </p>
          <p className="truncate text-xs text-muted-foreground">
            {payout.person.name} · {payout.person.email} · asked{' '}
            {ago(payout.requestedAt)}
          </p>
          {payout.destination ? (
            <p className="truncate text-xs text-muted-foreground">
              to {payout.destination}
            </p>
          ) : null}
        </div>

        <div className="flex items-center gap-2">
          {payout.status === 'processing' ? (
            <Badge variant="secondary">At the provider</Badge>
          ) : (
            <>
              <Button
                size="sm"
                variant="ghost"
                disabled={pending}
                onClick={() => run(() => rejectPayout(payout.id))}
              >
                Decline
              </Button>
              <Button
                size="sm"
                disabled={pending}
                onClick={() =>
                  confirming
                    ? run(() => approvePayout(payout.id))
                    : setConfirming(true)
                }
              >
                {pending
                  ? 'Sending…'
                  : confirming
                    ? 'Yes, send it'
                    : 'Approve'}
              </Button>
            </>
          )}
        </div>
      </div>

      {confirming ? (
        <p className="border-l-2 pl-3 text-xs text-muted-foreground">
          This sends ${(payout.amountCents / 100).toFixed(2)} to{' '}
          {payout.person.name}. It cannot be undone from here.
        </p>
      ) : null}
    </div>
  );
}
