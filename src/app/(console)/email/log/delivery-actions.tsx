'use client';

import * as React from 'react';
import { toast } from 'sonner';
import { EyeIcon, RotateCwIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { HtmlFrame } from '@/components/email/html-frame';
import { loadDelivery, retryDelivery } from '../actions';
import type { Delivery } from '../types';

/** Look at exactly what was sent, and send a failed one again. */
export function DeliveryActions({ delivery }: { delivery: Delivery }) {
  const [open, setOpen] = React.useState(false);
  const [html, setHtml] = React.useState<string | null>(null);
  const [pending, start] = React.useTransition();

  const view = () => {
    setOpen(true);
    if (html !== null) return;
    start(async () => {
      const r = await loadDelivery(delivery.id);
      if (r.error) toast.error(r.error);
      else setHtml(r.data?.html ?? '');
    });
  };

  return (
    <div className="flex justify-end gap-0.5">
      {delivery.category === 'transactional' ? (
        <Button variant="ghost" size="icon" aria-label="View the email" title="View" onClick={view}>
          <EyeIcon />
        </Button>
      ) : null}
      {delivery.status === 'failed' && delivery.category === 'transactional' ? (
        <Button
          variant="ghost"
          size="icon"
          aria-label="Send again"
          title="Send again"
          disabled={pending}
          onClick={() =>
            start(async () => {
              const r = await retryDelivery(delivery.id);
              if (r.error) toast.error(r.error);
              else toast.success(r.message ?? 'Queued.');
            })
          }
        >
          <RotateCwIcon />
        </Button>
      ) : null}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-h-[92svh] overflow-y-auto sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle className="[overflow-wrap:anywhere]">{delivery.subject}</DialogTitle>
            <DialogDescription>To {delivery.to}</DialogDescription>
          </DialogHeader>
          {html === null ? (
            <div className="text-muted-foreground py-10 text-center text-sm">Loading…</div>
          ) : html ? (
            <HtmlFrame html={html} className="border" minHeight={300} />
          ) : (
            <div className="text-muted-foreground py-10 text-center text-sm">No copy was kept of this one.</div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
