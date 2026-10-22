'use client';

import { useState, useTransition } from 'react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { dateTime } from '@/lib/format';
import { assignPayment, dismissPayment, matchPayment } from './actions';
import { kes, type UnclaimedPayment } from './types';

/**
 * One M-Pesa payment nobody's checkout claimed — a customer who closed the
 * tab, or two checkouts for the same amount at once. The operator says whose
 * it is; the API looks the transaction up again before crediting anything.
 */
export function UnclaimedRow({ tx }: { tx: UnclaimedPayment }) {
  const [mode, setMode] = useState<'idle' | 'credit' | 'match'>('idle');
  const [workspaceId, setWorkspaceId] = useState('');
  const [paymentId, setPaymentId] = useState('');
  const [kind, setKind] = useState<'ai' | 'cloud'>('cloud');
  const [pending, start] = useTransition();

  const run = (fn: () => Promise<{ error?: string; message?: string }>) =>
    start(async () => {
      const r = await fn();
      if (r.error) toast.error(r.error);
      else toast.success(r.message ?? 'Done.');
    });

  return (
    <li className="flex flex-col gap-3 px-4 py-3">
      <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
        <div className="min-w-0">
          <span className="tabular font-medium">{kes(tx.amountKes)}</span>
          <span className="text-muted-foreground pl-2 text-xs">
            {tx.phone ? `from ${tx.phone}` : null}
            {tx.mpesaReceipt ? (
              <>
                {' · '}
                <span className="font-mono">{tx.mpesaReceipt}</span>
              </>
            ) : null}
          </span>
          <div className="text-muted-foreground text-xs">
            {dateTime(tx.paidAt)} · <span className="font-mono">{tx.id}</span>
          </div>
        </div>
        {mode === 'idle' ? (
          <div className="flex flex-wrap gap-2">
            <Button size="sm" onClick={() => setMode('credit')}>
              Credit a workspace
            </Button>
            <Button size="sm" variant="outline" onClick={() => setMode('match')}>
              Match a checkout
            </Button>
            <Button
              size="sm"
              variant="ghost"
              disabled={pending}
              onClick={() => run(() => dismissPayment(tx.id))}
            >
              Set aside
            </Button>
          </div>
        ) : null}
      </div>

      {mode === 'credit' ? (
        <form
          className="flex flex-col gap-2 sm:flex-row sm:items-end"
          onSubmit={(e) => {
            e.preventDefault();
            run(() => assignPayment(tx.id, workspaceId, kind));
          }}
        >
          <div className="flex flex-1 flex-col gap-1">
            <Label htmlFor={`ws-${tx.id}`} className="text-xs">
              Workspace ID
            </Label>
            <Input
              id={`ws-${tx.id}`}
              value={workspaceId}
              onChange={(e) => setWorkspaceId(e.target.value)}
              placeholder="ws_…"
              className="font-mono"
            />
          </div>
          <div className="flex flex-col gap-1">
            <Label className="text-xs">As</Label>
            <Select value={kind} onValueChange={(v) => setKind(v as 'ai' | 'cloud')}>
              <SelectTrigger className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="cloud">Cloud credits</SelectItem>
                <SelectItem value="ai">AI credits</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex gap-2">
            <Button type="submit" size="sm" disabled={pending || !workspaceId.trim()}>
              {pending ? 'Crediting…' : 'Credit'}
            </Button>
            <Button type="button" size="sm" variant="ghost" onClick={() => setMode('idle')}>
              Cancel
            </Button>
          </div>
        </form>
      ) : null}

      {mode === 'match' ? (
        <form
          className="flex flex-col gap-2 sm:flex-row sm:items-end"
          onSubmit={(e) => {
            e.preventDefault();
            run(() => matchPayment(tx.id, paymentId));
          }}
        >
          <div className="flex flex-1 flex-col gap-1">
            <Label htmlFor={`pay-${tx.id}`} className="text-xs">
              Checkout ID — a plan or top-up the customer started
            </Label>
            <Input
              id={`pay-${tx.id}`}
              value={paymentId}
              onChange={(e) => setPaymentId(e.target.value)}
              placeholder="pay_…"
              className="font-mono"
            />
          </div>
          <div className="flex gap-2">
            <Button type="submit" size="sm" disabled={pending || !paymentId.trim()}>
              {pending ? 'Matching…' : 'Match'}
            </Button>
            <Button type="button" size="sm" variant="ghost" onClick={() => setMode('idle')}>
              Cancel
            </Button>
          </div>
        </form>
      ) : null}
    </li>
  );
}
