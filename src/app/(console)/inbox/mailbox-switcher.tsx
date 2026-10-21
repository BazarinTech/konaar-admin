'use client';

import { useRouter } from 'next/navigation';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import type { MyMailbox } from '../email/types';

/** Which shared mailbox is open, with what is waiting in each. */
export function MailboxSwitcher({
  mailboxes,
  current,
}: {
  mailboxes: MyMailbox[];
  current: string;
}) {
  const router = useRouter();
  return (
    <Select
      value={current}
      onValueChange={(id) => router.push(`/inbox?m=${encodeURIComponent(id)}`)}
    >
      <SelectTrigger className="h-9 w-full min-w-0 sm:w-auto sm:min-w-64">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {mailboxes.map((m) => (
          <SelectItem key={m.id} value={m.id}>
            <span className="flex w-full items-center gap-2">
              <span className="font-medium">{m.displayName}</span>
              <span className="text-muted-foreground text-xs">{m.address}</span>
              {m.unread > 0 ? (
                <span className="bg-primary text-primary-foreground ml-auto rounded-full px-1.5 text-[10px] font-semibold tabular">
                  {m.unread}
                </span>
              ) : null}
              {m.status === 'disabled' ? (
                <span className="text-muted-foreground ml-auto text-[10px]">disabled</span>
              ) : null}
            </span>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
