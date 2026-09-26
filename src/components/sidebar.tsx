import { NavLinks, Wordmark } from '@/components/nav';

/**
 * The rail, from `md` up.
 *
 * `sticky top-0` with an explicit `h-svh` rather than a stretched flex child:
 * a flex item defaults to `align-self: stretch`, which made this element as
 * tall as the whole document, so the navigation scrolled out of view while the
 * header stayed put. Pinning it to the viewport and giving the link list its
 * own overflow keeps both in place, however long the page is.
 */
export function Sidebar({ roles }: { roles: string[] }) {
  return (
    <aside className="bg-card/40 sticky top-0 hidden h-svh w-56 shrink-0 flex-col self-start border-r md:flex">
      <div className="flex h-14 shrink-0 items-center border-b px-5">
        <Wordmark />
      </div>
      <div className="min-h-0 flex-1 overflow-y-auto p-2">
        <NavLinks roles={roles} />
      </div>
      <div className="text-muted-foreground shrink-0 border-t px-5 py-3 text-xs">
        Every change here is recorded.
      </div>
    </aside>
  );
}
