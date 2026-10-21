'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';

const TABS = [
  { href: '/email', label: 'Bulk email' },
  { href: '/email/log', label: 'Delivery log' },
  { href: '/email/templates', label: 'Templates' },
] as const;

export function EmailTabs() {
  const pathname = usePathname();
  return (
    <nav className="mb-6 flex gap-1 overflow-x-auto border-b">
      {TABS.map((t) => {
        const active =
          t.href === '/email'
            ? pathname === '/email' || pathname.startsWith('/email/new') || pathname.startsWith('/email/campaigns')
            : pathname.startsWith(t.href);
        return (
          <Link
            key={t.href}
            href={t.href}
            aria-current={active ? 'page' : undefined}
            className={cn(
              '-mb-px border-b-2 px-3 py-2 text-sm whitespace-nowrap transition-colors',
              active
                ? 'border-primary text-foreground font-medium'
                : 'text-muted-foreground hover:text-foreground border-transparent',
            )}
          >
            {t.label}
          </Link>
        );
      })}
    </nav>
  );
}
