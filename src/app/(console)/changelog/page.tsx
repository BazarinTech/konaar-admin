import Link from 'next/link';
import { PlusIcon } from 'lucide-react';
import { apiPage } from '@/lib/api';
import { date } from '@/lib/format';
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
import { KIND_LABEL, kindVariant, type ChangelogEntry } from './types';

export const metadata = { title: 'Changelog — Konaar Console' };

export default async function ChangelogPage() {
  const list = await apiPage<{ data: ChangelogEntry[] }>('/admin/changelog');
  const drafts = list.data.filter((e) => e.status === 'draft').length;

  return (
    <>
      <PageHeader
        title="Changelog"
        description="What shipped, in your words. Drafts stay private; published entries appear on konaar.dev/changelog, newest first."
      >
        <Button size="sm" asChild>
          <Link href="/changelog/new">
            <PlusIcon />
            New entry
          </Link>
        </Button>
      </PageHeader>

      {list.data.length === 0 ? (
        <Empty>Nothing written yet. Start with the last thing you shipped.</Empty>
      ) : (
        <>
          {drafts ? (
            <p className="text-muted-foreground mb-3 text-xs">
              {drafts} draft{drafts === 1 ? '' : 's'} waiting to be published.
            </p>
          ) : null}
          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Entry</TableHead>
                    <TableHead className="hidden md:table-cell">Type</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="hidden sm:table-cell">Release date</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {list.data.map((e) => (
                    <TableRow key={e.id} className="relative">
                      <TableCell className="max-w-0 whitespace-normal">
                        <Link href={`/changelog/${e.id}`} className="font-medium after:absolute after:inset-0">
                          {e.title}
                        </Link>
                        <div className="text-muted-foreground line-clamp-1 text-xs">
                          {e.version ? <span className="font-mono">{e.version} · </span> : null}
                          {e.summary}
                        </div>
                      </TableCell>
                      <TableCell className="hidden md:table-cell">
                        <Badge variant={kindVariant(e.kind)}>{KIND_LABEL[e.kind]}</Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant={e.status === 'published' ? 'secondary' : 'outline'}>
                          {e.status === 'published' ? 'Published' : 'Draft'}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-muted-foreground hidden text-xs sm:table-cell">
                        {e.publishedAt ? date(e.publishedAt) : '—'}
                        {e.editedBy ? <div>Edited by {e.editedBy}</div> : null}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </>
      )}
    </>
  );
}
