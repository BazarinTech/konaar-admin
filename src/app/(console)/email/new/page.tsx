import Link from 'next/link';
import { ArrowLeftIcon } from 'lucide-react';
import { api, apiPage } from '@/lib/api';
import { PageHeader } from '@/components/page-header';
import { Button } from '@/components/ui/button';
import { CampaignComposer } from './campaign-composer';
import type { MyMailbox } from '../types';

export const metadata = { title: 'New bulk email — Konaar Console' };

export default async function NewCampaignPage() {
  const [mine, plans] = await Promise.all([
    apiPage<{ data: MyMailbox[] }>('/admin/email/inbox'),
    // The public catalogue: every administrator who may send can read it,
    // which is not true of the platform area's own plan list.
    api<{ data: { code: string; name: string }[] }>('/plans', { anonymous: true }).catch(() => ({
      data: [],
    })),
  ]);

  return (
    <>
      <Button variant="ghost" size="sm" asChild className="mb-4 -ml-2">
        <Link href="/email">
          <ArrowLeftIcon />
          Bulk email
        </Link>
      </Button>
      <PageHeader
        title="New bulk email"
        description="Write it, choose who gets it, check the preview. You confirm the number of recipients before anything is sent."
      />
      <CampaignComposer
        mailboxes={mine.data.filter((m) => m.status === 'active')}
        plans={plans.data.map((p) => ({ code: p.code, name: p.name }))}
      />
    </>
  );
}
