'use client';

import { useState, useTransition } from 'react';
import { toast } from 'sonner';
import { Trash2Icon } from 'lucide-react';
import { deleteSkill, updateSkill } from '../actions';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';

/** The on/off switch for one skill. Saves on change — there is nothing to type. */
export function SkillToggle({
  id,
  name,
  enabled,
}: {
  id: string;
  name: string;
  enabled: boolean;
}) {
  const [pending, start] = useTransition();
  return (
    <Switch
      checked={enabled}
      disabled={pending}
      aria-label={`${enabled ? 'Turn off' : 'Turn on'} ${name}`}
      onCheckedChange={(next) =>
        start(async () => {
          const result = await updateSkill(id, { enabled: next });
          if (result.error) toast.error(result.error);
          else toast.success(next ? `${name} is on.` : `${name} is off.`);
        })
      }
    />
  );
}

/**
 * Delete, in two presses.
 *
 * A skill changes what every matching build is told, so removing one by a
 * stray click is worth one extra step. The text survives in the activity
 * log either way.
 */
export function SkillDelete({ id, name }: { id: string; name: string }) {
  const [armed, setArmed] = useState(false);
  const [pending, start] = useTransition();

  if (!armed) {
    return (
      <Button
        size="sm"
        variant="ghost"
        aria-label={`Delete ${name}`}
        onClick={() => setArmed(true)}
      >
        <Trash2Icon />
      </Button>
    );
  }
  return (
    <span className="flex items-center gap-1">
      <Button
        size="sm"
        variant="destructive"
        disabled={pending}
        onClick={() =>
          start(async () => {
            const result = await deleteSkill(id);
            if (result.error) {
              toast.error(result.error);
              setArmed(false);
            } else toast.success(result.message ?? 'Deleted.');
          })
        }
      >
        {pending ? 'Deleting…' : 'Delete'}
      </Button>
      <Button size="sm" variant="ghost" onClick={() => setArmed(false)}>
        Keep
      </Button>
    </span>
  );
}
