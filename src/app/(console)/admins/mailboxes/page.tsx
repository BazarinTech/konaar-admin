import Link from 'next/link';
import { ArrowLeftIcon, TriangleAlertIcon } from 'lucide-react';
import { apiPage } from '@/lib/api';
import { currentAdmin } from '@/lib/session';
import { count, date } from '@/lib/format';
import { PageHeader } from '@/components/page-header';
import { Empty } from '@/components/empty';
import { Button } from '@/components/ui/button';
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
import { MailboxDialog } from './mailbox-dialog';
import { RemoveMailbox } from './remove-mailbox';
import type { ManagedMailbox } from '../../email/types';
import type { AdminRecord } from '../page';

export const metadata = { title: 'Mailboxes — Konaar Console' };

export default async function MailboxesPage() {
  const [list, admins, me] = await Promise.all([
    apiPage<{ domains: string[]; receiving: boolean; mailboxes: ManagedMailbox[] }>(
      '/admin/email/mailboxes',
    ),
    apiPage<{ data: AdminRecord[] }>('/admin/admins'),
    currentAdmin(),
  ]);
  const people = admins.data
    .filter((a) => a.status === 'active')
    .map((a) => ({ id: a.id, name: a.name, email: a.email }));

  return (
    <>
      <Button variant="ghost" size="sm" asChild className="mb-4 -ml-2">
        <Link href="/admins">
          <ArrowLeftIcon />
          Administrators
        </Link>
      </Button>
      <PageHeader
        title="Mailboxes"
        description="Shared addresses read and answered from the Inbox. Only the members you list can open one — add yourself if you need to."
      >
        <MailboxDialog domains={list.domains} people={people} me={me.id} />
      </PageHeader>

      {!list.receiving ? (
        <div className="mb-4 flex items-start gap-2 rounded-lg border border-amber-500/40 bg-amber-500/10 px-3 py-2.5 text-sm">
          <TriangleAlertIcon className="mt-0.5 size-4 shrink-0 text-amber-600" />
          <span>
            Email is not connected yet, so nothing is sent or received. Set{' '}
            <code className="font-mono text-xs">RESEND_API_KEY</code> and the webhook secret on the API.
          </span>
        </div>
      ) : null}

      {list.mailboxes.length === 0 ? (
        <Empty>No mailboxes yet. Create support@{list.domains[0] ?? 'your domain'} to start.</Empty>
      ) : (
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Mailbox</TableHead>
                  <TableHead>Members</TableHead>
                  <TableHead className="hidden text-right sm:table-cell">Conversations</TableHead>
                  <TableHead className="hidden md:table-cell">Created</TableHead>
                  <TableHead />
                </TableRow>
              </TableHeader>
              <TableBody>
                {list.mailboxes.map((m) => (
                  <TableRow key={m.id}>
                    <TableCell className="whitespace-normal">
                      <div className="flex flex-wrap items-center gap-1.5">
                        <span className="font-medium">{m.displayName}</span>
                        {m.status === 'disabled' ? <Badge variant="outline">disabled</Badge> : null}
                      </div>
                      <div className="text-muted-foreground font-mono text-xs">{m.address}</div>
                    </TableCell>
                    <TableCell className="whitespace-normal">
                      {m.members.length ? (
                        <div className="flex flex-wrap gap-1">
                          {m.members.map((p) => (
                            <Badge key={p.id} variant="secondary" title={p.email}>
                              {p.name}
                            </Badge>
                          ))}
                        </div>
                      ) : (
                        <span className="text-muted-foreground text-xs">Nobody — no one can read it</span>
                      )}
                    </TableCell>
                    <TableCell className="hidden text-right tabular sm:table-cell">{count(m.threads)}</TableCell>
                    <TableCell className="text-muted-foreground hidden text-xs md:table-cell">{date(m.createdAt)}</TableCell>
                    <TableCell>
                      <div className="flex justify-end gap-0.5">
                        <MailboxDialog domains={list.domains} people={people} me={me.id} mailbox={m} />
                        <RemoveMailbox id={m.id} address={m.address} />
                      </div>
                    </TableCell>
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
