import Link from 'next/link';
import { PaperclipIcon, SearchIcon } from 'lucide-react';
import { apiPage } from '@/lib/api';
import { ago } from '@/lib/format';
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
import { DeliveryActions } from './delivery-actions';
import { statusVariant, type Delivery, type TemplateInfo } from '../types';

export const metadata = { title: 'Delivery log — Konaar Console' };

const STATUSES = ['queued', 'sent', 'delivered', 'delayed', 'bounced', 'complained', 'failed'] as const;

export default async function DeliveryLogPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const one = (key: string) => {
    const v = params[key];
    return Array.isArray(v) ? v[0] : v;
  };
  const query = one('query') ?? '';
  const status = one('status') ?? '';
  const template = one('template') ?? '';
  const cursor = one('cursor') ?? '';

  const search = new URLSearchParams();
  if (query) search.set('query', query);
  if (status) search.set('status', status);
  if (template) search.set('template', template);
  if (cursor) search.set('cursor', cursor);

  const [log, templates] = await Promise.all([
    apiPage<{ items: Delivery[]; nextCursor: string | null }>(`/admin/email/deliveries?${search}`),
    apiPage<{ data: TemplateInfo[] }>('/admin/email/templates'),
  ]);
  const label = new Map(templates.data.map((t) => [t.name, t.label]));

  const link = (patch: Record<string, string>) => ({
    pathname: '/email/log' as const,
    query: Object.fromEntries(
      Object.entries({ query, status, template, ...patch }).filter(([, v]) => v !== ''),
    ),
  });

  return (
    <>
      <PageHeader
        title="Delivery log"
        description="Every email the platform sent, and what happened to it. Statuses come from Resend as mail is delivered or bounces."
      />

      <div className="mb-4 flex flex-col gap-3">
        <form action="/email/log" className="relative max-w-md">
          {status ? <input type="hidden" name="status" value={status} /> : null}
          {template ? <input type="hidden" name="template" value={template} /> : null}
          <SearchIcon className="text-muted-foreground pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2" />
          <Input name="query" defaultValue={query} placeholder="Search recipient or subject" className="pl-8" />
        </form>
        <div className="flex flex-wrap gap-1.5">
          <Button variant={status === '' ? 'secondary' : 'ghost'} size="sm" asChild>
            <Link href={link({ status: '', cursor: '' })}>Any status</Link>
          </Button>
          {STATUSES.map((s) => (
            <Button key={s} variant={status === s ? 'secondary' : 'ghost'} size="sm" asChild>
              <Link href={link({ status: s, cursor: '' })}>{s}</Link>
            </Button>
          ))}
        </div>
        <div className="flex flex-wrap gap-1.5">
          <Button variant={template === '' ? 'secondary' : 'ghost'} size="sm" asChild>
            <Link href={link({ template: '', cursor: '' })}>Every email</Link>
          </Button>
          {templates.data.map((t) => (
            <Button key={t.name} variant={template === t.name ? 'secondary' : 'ghost'} size="sm" asChild>
              <Link href={link({ template: t.name, cursor: '' })}>{t.label}</Link>
            </Button>
          ))}
        </div>
      </div>

      {log.items.length === 0 ? (
        <Empty>Nothing matches.</Empty>
      ) : (
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Email</TableHead>
                  <TableHead className="hidden md:table-cell">Kind</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="hidden sm:table-cell">When</TableHead>
                  <TableHead />
                </TableRow>
              </TableHeader>
              <TableBody>
                {log.items.map((d) => (
                  <TableRow key={d.id}>
                    <TableCell className="max-w-0 whitespace-normal">
                      <div className="flex items-center gap-1.5">
                        <span className="truncate font-medium">{d.subject}</span>
                        {d.hasAttachment ? <PaperclipIcon className="text-muted-foreground size-3.5 shrink-0" aria-label="Has an attachment" /> : null}
                      </div>
                      <div className="text-muted-foreground truncate text-xs">{d.to}</div>
                      {d.error ? <div className="text-destructive truncate text-xs" title={d.error}>{d.error}</div> : null}
                    </TableCell>
                    <TableCell className="text-muted-foreground hidden text-xs md:table-cell">
                      {label.get(d.template) ?? d.template}
                    </TableCell>
                    <TableCell>
                      <Badge variant={statusVariant(d.status)}>{d.status}</Badge>
                      {d.attempts > 1 ? <div className="text-muted-foreground mt-0.5 text-[11px]">{d.attempts} tries</div> : null}
                    </TableCell>
                    <TableCell className="text-muted-foreground hidden text-xs sm:table-cell">{ago(d.createdAt)}</TableCell>
                    <TableCell>
                      <DeliveryActions delivery={d} />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {log.nextCursor ? (
        <div className="mt-4 flex justify-center">
          <Button variant="outline" size="sm" asChild>
            <Link href={link({ cursor: log.nextCursor })}>Older</Link>
          </Button>
        </div>
      ) : null}
    </>
  );
}
