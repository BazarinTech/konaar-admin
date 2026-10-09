import * as React from 'react';
import { cn } from '@/lib/utils';

/**
 * The multi-line counterpart to `Input`, sharing its border, focus ring and
 * invalid state so a form does not change character halfway down.
 *
 * `field-sizing-content` lets it grow with what is typed where the browser
 * supports it, with `rows` as the floor everywhere else — a reason for
 * rejecting someone's work should not be written through a two-line slot.
 */
function Textarea({ className, ...props }: React.ComponentProps<'textarea'>) {
  return (
    <textarea
      data-slot="textarea"
      className={cn(
        'border-input placeholder:text-muted-foreground field-sizing-content flex min-h-16 w-full rounded-md border bg-transparent px-3 py-2 text-sm shadow-xs transition-[color,box-shadow] outline-none',
        'focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]',
        'disabled:cursor-not-allowed disabled:opacity-50',
        'aria-invalid:border-destructive aria-invalid:ring-destructive/20',
        className,
      )}
      {...props}
    />
  );
}

export { Textarea };
