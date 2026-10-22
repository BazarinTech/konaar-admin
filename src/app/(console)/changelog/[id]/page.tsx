import Link from 'next/link';
import { ArrowLeftIcon } from 'lucide-react';
import { apiPage } from '@/lib/api';
import { PageHeader } from '@/components/page-header';
import { Button } from '@/components/ui/button';
import { EntryEditor } from '../entry-editor';
import { siteUrl } from '../site';
import type { ChangelogEntry, ChangelogMeta } from '../types';

export const metadata = { title: 'Changelog entry — Konaar Console' };

export default async function EntryPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [entry, meta] = await Promise.all([
    apiPage<ChangelogEntry>(`/admin/changelog/${id}`),
    apiPage<ChangelogMeta>('/admin/changelog/areas'),
  ]);
  return (
    <>
      <Button variant="ghost" size="sm" asChild className="mb-4 -ml-2">
        <Link href="/changelog">
          <ArrowLeftIcon />
          Changelog
        </Link>
      </Button>
      <PageHeader
        title={entry.status === 'published' ? 'Edit entry' : 'Edit draft'}
        description={
          entry.status === 'published'
            ? 'This entry is live. Saving updates it straight away; its link stays the same.'
            : 'Not public yet.'
        }
      />
      <EntryEditor key={entry.updatedAt} entry={entry} meta={meta} siteUrl={siteUrl()} />
    </>
  );
}
