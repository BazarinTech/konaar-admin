'use client';

import * as React from 'react';
import { toast } from 'sonner';
import { ShieldCheckIcon } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { setTemplatePublisher } from './actions';

/**
 * Letting someone publish templates, or stopping them.
 *
 * Both directions ask for a note, and both record it. "Why is this account
 * verified" gets asked months later, usually about the one case somebody
 * regrets — and the revocation is the half that needs explaining most, since
 * it is the one the customer will write in about.
 */
export function PublisherToggle({
  userId,
  verified,
}: {
  userId: string;
  verified: boolean;
}) {
  const [pending, start] = React.useTransition();
  const [open, setOpen] = React.useState(false);
  const [note, setNote] = React.useState('');

  function apply() {
    start(async () => {
      const result = await setTemplatePublisher(userId, !verified, note);
      if (result.error) toast.error(result.error);
      else {
        toast.success(result.message ?? 'Saved.');
        setOpen(false);
        setNote('');
      }
    });
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <span className="flex items-center gap-2 text-sm">
          <ShieldCheckIcon className="size-4 text-muted-foreground" />
          {verified
            ? 'Can publish templates to the showcase'
            : 'Cannot publish templates'}
        </span>
        <Button
          size="sm"
          variant={verified ? 'outline' : 'default'}
          disabled={pending}
          onClick={() => setOpen((v) => !v)}
        >
          {verified ? 'Turn off' : 'Allow publishing'}
        </Button>
      </div>

      {open ? (
        <div className="flex flex-col gap-2">
          <Textarea
            value={note}
            rows={2}
            onChange={(event: React.ChangeEvent<HTMLTextAreaElement>) =>
              setNote(event.target.value)
            }
            placeholder={
              verified
                ? 'Why publishing is being turned off — recorded in the activity log.'
                : 'Why this account is trusted to publish — recorded in the activity log.'
            }
          />
          <div className="flex justify-end gap-2">
            <Button variant="ghost" disabled={pending} onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button
              variant={verified ? 'destructive' : 'default'}
              // The API's own minimum, so the button refuses rather than the
              // request.
              disabled={pending || note.trim().length < 5}
              onClick={apply}
            >
              {pending ? 'Saving…' : verified ? 'Turn off' : 'Allow'}
            </Button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
