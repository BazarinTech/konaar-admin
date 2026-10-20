'use client';

import { useTransition } from 'react';
import { toast } from 'sonner';
import { PauseIcon, PlayIcon, Trash2Icon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  removeDiscount,
  removeOffer,
  saveDiscount,
  saveOffer,
} from './pricing-actions';

/** Pause, resume and retire — the same three buttons for discounts and offers. */
export function RuleControls({
  kind,
  id,
  name,
  status,
}: {
  kind: 'discount' | 'offer';
  id: string;
  name: string;
  status: 'active' | 'paused';
}) {
  const [pending, start] = useTransition();
  const save = kind === 'discount' ? saveDiscount : saveOffer;
  const remove = kind === 'discount' ? removeDiscount : removeOffer;

  const run = (action: () => Promise<{ error?: string; message?: string }>) =>
    start(async () => {
      const result = await action();
      if (result.error) toast.error(result.error);
      else toast.success(result.message ?? 'Saved.');
    });

  return (
    <div className="flex items-center gap-0.5">
      <Button
        variant="ghost"
        size="icon"
        disabled={pending}
        aria-label={status === 'active' ? `Pause ${name}` : `Resume ${name}`}
        title={status === 'active' ? 'Pause' : 'Resume'}
        onClick={() =>
          run(() => save(id, { status: status === 'active' ? 'paused' : 'active' }))
        }
      >
        {status === 'active' ? <PauseIcon /> : <PlayIcon />}
      </Button>
      <Button
        variant="ghost"
        size="icon"
        disabled={pending}
        aria-label={`Retire ${name}`}
        title="Retire"
        onClick={() => {
          // A two-step confirm in the toast: the console has no modal for this,
          // and retiring is not undoable.
          toast(`Retire ${name}?`, {
            description:
              kind === 'discount'
                ? 'Customers already priced with it keep their price.'
                : 'Workspaces that already got the perk keep it.',
            action: { label: 'Retire', onClick: () => run(() => remove(id)) },
          });
        }}
      >
        <Trash2Icon />
      </Button>
    </div>
  );
}
