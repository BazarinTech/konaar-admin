import { Loading03Icon } from '@hugeicons/core-free-icons';
import { HugeiconsIcon } from '@hugeicons/react';

import { cn } from '@/lib/utils';

/**
 * The one loading indicator: Hugeicons' eight-spoke Loading 03, turning — the
 * same spinner as the Konaar app, so "working" looks the same in both.
 *
 * Draws in `currentColor` and sizes like any icon: `size-*`, or the size a
 * Button gives its icons when no class sets one (16px otherwise, via the
 * size attribute, so a Button's own sizing still applies).
 *
 * Decorative by default; pass `aria-label` when it is the only sign that
 * something is loading.
 */
export function Spinner({
  className,
  ...props
}: Omit<React.ComponentProps<typeof HugeiconsIcon>, 'icon'>) {
  return (
    <HugeiconsIcon
      icon={Loading03Icon}
      size={16}
      strokeWidth={2}
      aria-hidden={props['aria-label'] ? undefined : true}
      className={cn('shrink-0 animate-spin motion-reduce:animate-none', className)}
      {...props}
    />
  );
}
