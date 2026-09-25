import { currentAdmin } from '@/lib/session';
import { Sidebar } from '@/components/sidebar';
import { AdminMenu } from '@/components/admin-menu';

/**
 * The console shell.
 *
 * The administrator is fetched here, once, and their areas decide the
 * navigation. Hiding a link is presentation only — the API returns 404 for an
 * area someone does not hold, which is what actually keeps them out.
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
        <header className="bg-background/80 sticky top-0 z-20 flex h-14 items-center justify-between gap-4 border-b px-6 backdrop-blur">
          <div className="text-muted-foreground text-sm">
            Konar platform administration
          </div>
          <AdminMenu admin={admin} />
        </header>
        <main className="min-w-0 flex-1 p-6">{children}</main>
      </div>
    </div>
  );
}
