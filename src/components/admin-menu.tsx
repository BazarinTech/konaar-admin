'use client';

import { LogOutIcon, UserIcon } from 'lucide-react';
import { signOut } from '@/lib/session';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import type { Admin } from '@/lib/session';

export function AdminMenu({ admin }: { admin: Admin }) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger className="hover:bg-accent flex items-center gap-2 rounded-md px-2 py-1.5 text-sm transition-colors">
        <span className="bg-secondary flex size-6 items-center justify-center rounded-full text-xs font-medium">
          {admin.name.slice(0, 1).toUpperCase()}
        </span>
        <span className="hidden sm:inline">{admin.name}</span>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-64">
        <DropdownMenuLabel className="text-foreground text-sm font-medium">
          {admin.email}
        </DropdownMenuLabel>
        <div className="flex flex-wrap gap-1 px-2 pb-2">
          {admin.roles.length ? (
            admin.roles.map((role) => (
              <Badge key={role} variant="outline">
                {role}
              </Badge>
            ))
          ) : (
            <span className="text-muted-foreground text-xs">
              No areas assigned
            </span>
          )}
        </div>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <a href="/admins" className="flex items-center gap-2">
            <UserIcon />
            Administrators
          </a>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          variant="destructive"
          onSelect={() => void signOut()}
          className="flex items-center gap-2"
        >
          <LogOutIcon />
          Sign out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
