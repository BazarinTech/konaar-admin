'use client';

import * as React from 'react';
import * as DialogPrimitive from '@radix-ui/react-dialog';
import { XIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

const Sheet = DialogPrimitive.Root;
const SheetTrigger = DialogPrimitive.Trigger;
const SheetClose = DialogPrimitive.Close;
const SheetTitle = DialogPrimitive.Title;
const SheetDescription = DialogPrimitive.Description;

/** A panel that slides in from the edge — the small-screen form of a rail. */
function SheetContent({
  className,
  children,
  side = 'left',
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Content> & {
  side?: 'left' | 'right';
}) {
  return (
    <DialogPrimitive.Portal>
      <DialogPrimitive.Overlay className="data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 fixed inset-0 z-50 bg-black/60" />
      <DialogPrimitive.Content
        className={cn(
          'bg-card data-[state=open]:animate-in data-[state=closed]:animate-out fixed inset-y-0 z-50 flex h-svh w-72 max-w-[85vw] flex-col shadow-lg transition ease-in-out',
          side === 'left'
            ? 'data-[state=closed]:slide-out-to-left data-[state=open]:slide-in-from-left left-0 border-r'
            : 'data-[state=closed]:slide-out-to-right data-[state=open]:slide-in-from-right right-0 border-l',
          className,
        )}
        {...props}
      >
        {children}
        <DialogPrimitive.Close className="focus:ring-ring absolute top-4 right-4 rounded-sm opacity-60 transition-opacity hover:opacity-100 focus:ring-2 focus:outline-none">
          <XIcon className="size-4" />
          <span className="sr-only">Close</span>
        </DialogPrimitive.Close>
      </DialogPrimitive.Content>
    </DialogPrimitive.Portal>
  );
}

export {
  Sheet,
  SheetTrigger,
  SheetClose,
  SheetContent,
  SheetTitle,
  SheetDescription,
};
