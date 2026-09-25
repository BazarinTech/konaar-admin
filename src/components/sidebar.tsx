'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboardIcon,
  UsersIcon,
  SlidersHorizontalIcon,
  ServerIcon,
  WalletIcon,
  ShieldIcon,
  ScrollTextIcon,
} from 'lucide-react';
import { cn } from '@/lib/utils';

/**
 * Navigation, and the area each item needs.
 *
 * `null` means every signed-in administrator: the dashboard and the activity
 * log are the two things nobody is shut out of, because the first is why they
 * signed in and the second is how they are held to account.
 */
const NAV = [
    { href: '/', label: 'Dashboard', icon: LayoutDashboardIcon, role: null },
    { href: '/users', label: 'Users', icon: UsersIcon, role: 'users' },
    {
      href: '/platform',
      label: 'Platform',
      icon: SlidersHorizontalIcon,
      role: 'platform',
    },
    {
      href: '/resources',
      label: 'Resources',
      icon: ServerIcon,
      role: 'resources',
    },
    { href: '/revenue', label: 'Revenue', icon: WalletIcon, role: 'revenue' },
    { href: '/admins', label: 'Administrators', icon: ShieldIcon, role: 'admins' },
    { href: '/activity', label: 'Activity', icon: ScrollTextIcon, role: null },
  ] as const;

export function Sidebar({ roles }: { roles: string[] }) {
  const pathname = usePathname();
  const held = new Set(roles);

  return (
    <aside className="bg-card/40 hidden w-56 shrink-0 flex-col border-r md:flex">
      <div className="flex h-14 items-center gap-2 border-b px-5">
        <div className="bg-primary text-primary-foreground flex size-6 items-center justify-center rounded text-xs font-bold">
          K
        </div>
        <span className="text-sm font-semibold tracking-tight">Konar</span>
      </div>
      <nav className="flex flex-1 flex-col gap-0.5 p-2">
        {NAV.filter((item) => !item.role || held.has(item.role)).map((item) => {
          const active =
            item.href === '/'
              ? pathname === '/'
              : pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex items-center gap-2.5 rounded-md px-3 py-2 text-sm transition-colors',
                active
                  ? 'bg-accent text-accent-foreground font-medium'
                  : 'text-muted-foreground hover:bg-accent/50 hover:text-foreground',
              )}
            >
              <item.icon className="size-4" />
              {item.label}
            </Link>
          );
        })}
      </nav>
      <div className="text-muted-foreground border-t px-5 py-3 text-xs">
        Every change here is recorded.
      </div>
    </aside>
  );
}
