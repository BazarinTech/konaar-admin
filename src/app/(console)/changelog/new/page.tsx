import Link from 'next/link';
import { ArrowLeftIcon } from 'lucide-react';
import { apiPage } from '@/lib/api';
import { PageHeader } from '@/components/page-header';
import { Button } from '@/components/ui/button';
import { EntryEditor } from '../entry-editor';
import { siteUrl } from '../site';
import type { ChangelogMeta } from '../types';

export const metadata = { title: 'New changelog entry — Konaar Console' };

export default async function NewEntryPage() {
  const meta = await apiPage<ChangelogMeta>('/admin/changelog/areas');
  return (
    <>
      <Button variant="ghost" size="sm" asChild className="mb-4 -ml-2">
        <Link href="/changelog">
          <ArrowLeftIcon />
          Changelog
        </Link>
      </Button>
      <PageHeader title="New entry" description="Saved as a draft until you publish it." />
      <EntryEditor entry={null} meta={meta} siteUrl={siteUrl()} />
    </>
  );
}
