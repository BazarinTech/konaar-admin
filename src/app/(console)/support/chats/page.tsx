import Link from 'next/link';
import { SearchIcon } from 'lucide-react';
import { apiPage } from '@/lib/api';
import { ago, count } from '@/lib/format';
import { PageHeader } from '@/components/page-header';
import { Empty } from '@/components/empty';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import type { ChatRow } from '../types';

export const metadata = { title: 'Assistant conversations — Konaar Console' };

const VIEWS = [
  { value: '', label: 'All' },
  { value: 'escalated', label: 'Became a case' },
  { value: 'active', label: 'Solved by the assistant' },
] as const;

export default async function ChatsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const one = (key: string) => {
    const v = params[key];
    return Array.isArray(v) ? v[0] : v;
  };
  const status = one('status') ?? '';
  const query = one('query') ?? '';
  const search = new URLSearchParams();
  if (status) search.set('status', status);
  if (query) search.set('query', query);
  const chats = await apiPage<{ data: ChatRow[] }>(`/admin/support/chats?${search}`);
  const escalated = chats.data.filter((c) => c.status === 'escalated').length;

  return (
    <>
      <PageHeader
        title="Assistant conversations"
        description="Everything customers asked the support assistant, and what it answered. Read them to see what the docs are missing."
      />
      <div className="mb-4 flex flex-wrap items-center gap-2">
        {VIEWS.map((v) => (
          <Button key={v.label} variant={status === v.value ? 'secondary' : 'ghost'} size="sm" asChild>
            <Link href={{ pathname: '/support/chats', query: { ...(v.value ? { status: v.value } : {}), ...(query ? { query } : {}) } }}>
              {v.label}
            </Link>
          </Button>
        ))}
        <form action="/support/chats" className="relative ml-auto w-full max-w-xs">
          {status ? <input type="hidden" name="status" value={status} /> : null}
          <SearchIcon className="text-muted-foreground pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2" />
          <Input name="query" defaultValue={query} placeholder="Search customer or topic" className="pl-8" />
        </form>
      </div>
      {status === '' && chats.data.length ? (
        <p className="text-muted-foreground mb-3 text-xs">
          {count(chats.data.length)} conversations shown · {count(escalated)} became a case
        </p>
      ) : null}

      {chats.data.length === 0 ? (
        <Empty>No conversations yet.</Empty>
      ) : (
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Conversation</TableHead>
                  <TableHead className="hidden md:table-cell">Customer</TableHead>
                  <TableHead>Outcome</TableHead>
                  <TableHead className="hidden sm:table-cell">When</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {chats.data.map((c) => (
                  <TableRow key={c.id} className="relative">
                    <TableCell className="max-w-0 whitespace-normal">
                      <Link href={`/support/chats/${c.id}`} className="font-medium after:absolute after:inset-0">
                        {c.title ?? 'Untitled'}
                      </Link>
                      <div className="text-muted-foreground line-clamp-1 text-xs">{c.lastMessage}</div>
                    </TableCell>
                    <TableCell className="hidden text-xs md:table-cell">
                      <div>{c.customer}</div>
                      <div className="text-muted-foreground">{c.email}</div>
                    </TableCell>
                    <TableCell>
                      {c.case ? (
                        <Badge variant="secondary">Case {c.case.number}</Badge>
                      ) : (
                        <Badge variant="outline">{count(c.messageCount)} messages</Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-muted-foreground hidden text-xs sm:table-cell">{ago(c.updatedAt)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </>
  );
}
