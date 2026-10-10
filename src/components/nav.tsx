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
  LayoutTemplateIcon,
  GiftIcon,
  ActivityIcon,
} from 'lucide-react';
import { cn } from '@/lib/utils';

/**
 * Navigation, and the area each item needs.
 *
 * `null` means every signed-in administrator: the dashboard and the activity
 * log are the two things nobody is shut out of, because the first is why they
 * signed in and the second is how they are held to account.
 */
export const NAV = [
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
  {
    href: '/admins',
    label: 'Administrators',
    icon: ShieldIcon,
    role: 'admins',
  },
  {
    href: '/templates',
    label: 'Templates',
    icon: LayoutTemplateIcon,
    // Moderating what customers publish is platform curation, not user
    // administration — the same area that owns pricing and the rate card.
    role: 'platform',
  },
  {
    // Not `/status`: that path belongs to the public status page this app
    // also serves, and two routes cannot answer one URL.
    href: '/platform/status',
    label: 'Status',
    icon: ActivityIcon,
    // What customers are told about outages is platform curation, the same
    // area that owns pricing and the templates queue.
    role: 'platform',
  },
  {
    href: '/referrals',
    label: 'Referrals',
    icon: GiftIcon,
    // Approving a payout is sending real money, so it sits with the other
    // revenue decisions rather than with user administration.
    role: 'revenue',
  },
  { href: '/activity', label: 'Activity', icon: ScrollTextIcon, role: null },
] as const;

/**
 * The links themselves, shared by the sidebar and the small-screen drawer.
 *
 * One list in one place: a console where the phone menu and the desktop rail
 * disagree about what exists is worse than one that only has the rail.
 */
export function NavLinks({
  roles,
  onNavigate,
}: {
  roles: string[];
  onNavigate?: () => void;
}) {
  const pathname = usePathname();
  const held = new Set(roles);

  return (
    <nav className="flex flex-col gap-0.5">
      {NAV.filter((item) => !item.role || held.has(item.role)).map((item) => {
        const active =
          item.href === '/' ? pathname === '/' : pathname.startsWith(item.href);
        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={onNavigate}
            aria-current={active ? 'page' : undefined}
            className={cn(
              'flex items-center gap-2.5 rounded-md px-3 py-2 text-sm transition-colors',
              active
                ? 'bg-accent text-accent-foreground font-medium'
                : 'text-muted-foreground hover:bg-accent/50 hover:text-foreground',
            )}
          >
            <item.icon className="size-4 shrink-0" />
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}

export function Wordmark() {
  return (
    <span className="flex items-center gap-2">
      <span className="bg-primary text-primary-foreground flex size-6 items-center justify-center rounded text-xs font-bold">
        K
      </span>
      <span className="text-sm font-semibold tracking-tight">Konaar</span>
    </span>
  );
}
