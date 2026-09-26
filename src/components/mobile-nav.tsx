'use client';

import { useState } from 'react';
import { MenuIcon } from 'lucide-react';
import { NavLinks, Wordmark } from '@/components/nav';
import { Button } from '@/components/ui/button';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';

/**
 * The same navigation, below `md`, in a drawer.
 *
 * It closes on navigation. A drawer that stays open over the page it just
 * loaded is the standard way this pattern goes wrong on a phone.
 */
export function MobileNav({ roles }: { roles: string[] }) {
  const [open, setOpen] = useState(false);

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" className="md:hidden" aria-label="Menu">
          <MenuIcon className="size-5" />
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="p-0">
        <div className="flex h-14 shrink-0 items-center border-b px-5">
          <SheetTitle asChild>
            <Wordmark />
          </SheetTitle>
        </div>
        <SheetDescription className="sr-only">
          Console navigation
        </SheetDescription>
        <div className="min-h-0 flex-1 overflow-y-auto p-2">
          <NavLinks roles={roles} onNavigate={() => setOpen(false)} />
        </div>
        <div className="text-muted-foreground shrink-0 border-t px-5 py-3 text-xs">
          Every change here is recorded.
        </div>
      </SheetContent>
    </Sheet>
  );
}
