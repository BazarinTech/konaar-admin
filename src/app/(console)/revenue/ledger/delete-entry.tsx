'use client';

import { useTransition } from 'react';
import { toast } from 'sonner';
import { Trash2Icon } from 'lucide-react';
import { deleteEntry } from '../actions';
import { Button } from '@/components/ui/button';

export function DeleteEntry({ id }: { id: string }) {
  const [pending, start] = useTransition();
  return (
    <Button
      variant="ghost"
      size="icon"
      title="Withdraw this entry"
      disabled={pending}
      onClick={() =>
        start(async () => {
          const result = await deleteEntry(id);
          if (result.error) toast.error(result.error);
          else toast.success(result.message ?? 'Withdrawn.');
        })
      }
    >
      <Trash2Icon className="text-muted-foreground size-4" />
    </Button>
  );
}
