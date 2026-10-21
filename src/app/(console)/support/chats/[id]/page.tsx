import Link from 'next/link';
import { ArrowLeftIcon, LifeBuoyIcon, SparklesIcon } from 'lucide-react';
import { apiPage } from '@/lib/api';
import { count, dateTime } from '@/lib/format';
import { cn } from '@/lib/utils';
import { PageHeader } from '@/components/page-header';
import { Markdown } from '@/components/markdown';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import type { ChatDetail } from '../../types';

export const metadata = { title: 'Assistant conversation — Konaar Console' };

export default async function ChatPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const chat = await apiPage<ChatDetail>(`/admin/support/chats/${id}`);

  return (
    <>
      <Button variant="ghost" size="sm" asChild className="mb-4 -ml-2">
        <Link href="/support/chats">
          <ArrowLeftIcon />
          Conversations
        </Link>
      </Button>
      <PageHeader
        title={chat.title ?? 'Conversation'}
        description={`${chat.customer.name} · ${chat.customer.email} · ${count(chat.tokens.input + chat.tokens.output)} tokens`}
      >
        {chat.case ? (
          <Button size="sm" asChild>
            <Link href={`/support/${chat.case.id}`}>
              <LifeBuoyIcon />
              Case {chat.case.number}
            </Link>
          </Button>
        ) : (
          <Badge variant="outline">No case opened</Badge>
        )}
      </PageHeader>

      <ol className="mx-auto flex max-w-3xl flex-col gap-4">
        {chat.messages.map((m) => (
          <li key={m.id} className={cn('flex gap-3', m.role === 'user' && 'justify-end')}>
            {m.role === 'assistant' ? (
              <span className="bg-primary/10 text-primary flex size-7 shrink-0 items-center justify-center rounded-full">
                <SparklesIcon className="size-3.5" />
              </span>
            ) : null}
            <div
              className={cn(
                'min-w-0 rounded-lg px-3.5 py-2.5',
                m.role === 'user' ? 'bg-muted max-w-[85%]' : 'flex-1 border',
              )}
            >
              <div className="text-muted-foreground mb-1 flex items-center justify-between gap-3 text-[11px]">
                <span>{m.role === 'user' ? chat.customer.name : 'Assistant'}</span>
                <span>{dateTime(m.createdAt)}</span>
              </div>
              {m.role === 'user' ? (
                <p className="text-sm whitespace-pre-wrap [overflow-wrap:anywhere]">{m.content}</p>
              ) : (
                <Markdown>{m.content}</Markdown>
              )}
              {m.suggestCase ? (
                <p className="text-muted-foreground mt-2 text-[11px]">Offered to open a support case.</p>
              ) : null}
            </div>
          </li>
        ))}
      </ol>
    </>
  );
}
