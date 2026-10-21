'use client';

import * as React from 'react';
import { toast } from 'sonner';
import { Trash2Icon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { removeMailbox } from '../../email/actions';

/** Removing is confirmed in the toast, the console's pattern for irreversible steps. */
export function RemoveMailbox({ id, address }: { id: string; address: string }) {
  const [pending, start] = React.useTransition();
  return (
    <Button
      variant="ghost"
      size="icon"
      disabled={pending}
      aria-label={`Remove ${address}`}
      title="Remove"
      onClick={() =>
        toast(`Remove ${address}?`, {
          description: 'Mail to it stops arriving. Existing conversations are kept.',
          action: {
            label: 'Remove',
            onClick: () =>
              start(async () => {
                const r = await removeMailbox(id);
                if (r.error) toast.error(r.error);
                else toast.success(r.message ?? 'Removed.');
              }),
          },
        })
      }
    >
      <Trash2Icon />
    </Button>
  );
}
