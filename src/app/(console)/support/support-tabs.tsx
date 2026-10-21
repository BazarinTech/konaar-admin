'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';

export function SupportTabs() {
  const pathname = usePathname();
  const chats = pathname.startsWith('/support/chats');
  return (
    <nav className="mb-6 flex gap-1 overflow-x-auto border-b">
      {(
        [
          ['/support', 'Cases', !chats],
          ['/support/chats', 'Assistant conversations', chats],
        ] as const
      ).map(([href, label, active]) => (
        <Link
          key={href}
          href={href}
          aria-current={active ? 'page' : undefined}
          className={cn(
            '-mb-px border-b-2 px-3 py-2 text-sm whitespace-nowrap transition-colors',
            active
              ? 'border-primary text-foreground font-medium'
              : 'text-muted-foreground hover:text-foreground border-transparent',
          )}
        >
          {label}
        </Link>
      ))}
    </nav>
  );
}
