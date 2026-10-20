'use client';

import { useState, useTransition } from 'react';
import { UsersIcon } from 'lucide-react';
import { loadRedemptions } from '../pricing-actions';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { date, money } from '@/lib/format';
import type { Redemption } from '../pricing-types';

/** Who used a discount — loaded when asked for, not with the list. */
export function Redemptions({ id, name, count }: { id: string; name: string; count: number }) {
  const [open, setOpen] = useState(false);
  const [rows, setRows] = useState<Redemption[] | null>(null);
  const [pending, start] = useTransition();

  return (
    <>
      <Button
        variant="ghost"
        size="sm"
        disabled={count === 0}
        onClick={() => {
          setOpen(true);
          start(async () => setRows(await loadRedemptions(id)));
        }}
      >
        <UsersIcon />
        {count}
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{name}</DialogTitle>
            <DialogDescription>Workspaces that used it, newest first.</DialogDescription>
          </DialogHeader>
          {pending || !rows ? (
            <p className="text-muted-foreground py-6 text-center text-sm">Loading…</p>
          ) : (
            <ul className="flex max-h-80 flex-col divide-y overflow-y-auto text-sm">
              {rows.map((r) => (
                <li key={r.workspaceId} className="flex items-center justify-between gap-3 py-2">
                  <span className="min-w-0">
                    <span className="block truncate">{r.workspaceName}</span>
                    <span className="text-muted-foreground text-xs">
                      {r.planCode} · {r.interval === 'year' ? 'yearly' : 'monthly'} · {date(r.createdAt)}
                    </span>
                  </span>
                  <span className="tabular shrink-0 text-xs">
                    −{money(r.amountOffCents / 100)}
                    <span className="text-muted-foreground"> of {money(r.listPriceCents / 100)}</span>
                  </span>
                </li>
              ))}
            </ul>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
