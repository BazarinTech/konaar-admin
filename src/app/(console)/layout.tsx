import { currentAdmin } from '@/lib/session';
import { Sidebar } from '@/components/sidebar';
import { MobileNav } from '@/components/mobile-nav';
import { AdminMenu } from '@/components/admin-menu';
import { Wordmark } from '@/components/nav';

/**
 * The console shell.
 *
 * The administrator is fetched here, once, and their areas decide the
 * navigation. Hiding a link is presentation only — the API returns 404 for an
 * area someone does not hold, which is what actually keeps them out.
 *
 * The rail is pinned to the viewport and the header is sticky above the
 * content, so neither moves when a long table scrolls. Below `md` the rail
 * becomes a drawer and the header carries the wordmark instead.
 */
export default async function ConsoleLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const admin = await currentAdmin();

  return (
    <div className="flex min-h-svh">
      <Sidebar roles={admin.roles} />
      <div className="flex min-w-0 flex-1 flex-col">
        {/*
          Opaque, not translucent. A blurred bar over a dense table reads as a
          rendering fault rather than as depth, and `backdrop-filter` is what
          makes a sticky header stutter while scrolling on a phone.
        */}
        <header className="bg-background sticky top-0 z-30 flex h-14 shrink-0 items-center gap-2 border-b px-4 md:px-6">
          <MobileNav roles={admin.roles} />
          <div className="md:hidden">
            <Wordmark />
          </div>
          <div className="text-muted-foreground hidden text-sm md:block">
            Konar platform administration
          </div>
          <div className="ml-auto">
            <AdminMenu admin={admin} />
          </div>
        </header>
        <main className="min-w-0 flex-1 p-4 md:p-6">{children}</main>
      </div>
    </div>
  );
}
