'use client';

import { useTransition } from 'react';
import { toast } from 'sonner';
import { Trash2Icon } from 'lucide-react';
import { deletePlan } from '../actions';
import { Button } from '@/components/ui/button';

/**
 * Only offered for a plan nobody is on.
 *
 * The API refuses the rest, and a button that exists to be refused is worse
 * than no button.
 */
export function DeletePlan({ code, name }: { code: string; name: string }) {
  const [pending, start] = useTransition();
  return (
    <Button
      variant="ghost"
      size="icon"
      title={`Remove the ${name} plan`}
      disabled={pending}
      onClick={() =>
        start(async () => {
          const result = await deletePlan(code);
          if (result.error) toast.error(result.error);
          else toast.success(result.message ?? 'Removed.');
        })
      }
    >
      <Trash2Icon className="text-muted-foreground size-4" />
    </Button>
  );
}
