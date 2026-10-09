import { apiPage } from '@/lib/api';
import { ago } from '@/lib/format';
import { PageHeader } from '@/components/page-header';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ReviewCard } from './review-card';
import { PublishedRow } from './published-row';

export const metadata = { title: 'Templates — Konaar Console' };

export interface TemplateRecord {
  id: string;
  projectId: string | null;
  title: string;
  summary: string;
  category: string;
  categoryLabel: string;
  prompt: string;
  status: 'draft' | 'pending' | 'approved' | 'rejected' | 'withdrawn';
  rejectionReason: string | null;
  hasScreenshot: boolean;
  remixCount: number;
  likeCount: number;
  submittedAt: string;
  reviewedAt: string | null;
  publishedAt: string | null;
  author: { name: string; email: string };
}

/**
 * The queue, and what is already live.
 *
 * Pending first and on its own, because it is the only part of this page that
 * is work: everything below it is reference. A reviewer opening this should
 * see what is waiting without reading past anything.
 */
export default async function TemplatesPage() {
  const [queue, all] = await Promise.all([
    apiPage<{ data: TemplateRecord[] }>('/admin/templates/queue'),
    apiPage<{ data: TemplateRecord[] }>('/admin/templates?status=approved'),
  ]);

  const waiting = queue.data;
  const published = all.data;

  return (
    <div className="flex flex-col gap-8">
      <PageHeader
        title="Templates"
        description="Projects customers have offered to the showcase. Every one is looked at by hand before it appears."
      />

      <section className="flex flex-col gap-3">
        <div className="flex items-baseline gap-2">
          <h2 className="text-sm font-medium">Waiting for review</h2>
          <Badge variant={waiting.length > 0 ? 'default' : 'secondary'}>
            {waiting.length}
          </Badge>
        </div>

        {waiting.length === 0 ? (
          <Card>
            <CardContent className="py-10 text-center text-sm text-muted-foreground">
              Nothing waiting. Submissions appear here the moment they are sent.
            </CardContent>
          </Card>
        ) : (
          <div className="flex flex-col gap-3">
            {waiting.map((template) => (
              <ReviewCard key={template.id} template={template} />
            ))}
          </div>
        )}
      </section>

      <section className="flex flex-col gap-3">
        <div className="flex items-baseline gap-2">
          <h2 className="text-sm font-medium">On the showcase</h2>
          <Badge variant="secondary">{published.length}</Badge>
        </div>

        {published.length === 0 ? (
          <Card>
            <CardContent className="py-10 text-center text-sm text-muted-foreground">
              Nothing published yet.
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardContent className="flex flex-col divide-y p-0">
              {published.map((template) => (
                <PublishedRow key={template.id} template={template} />
              ))}
            </CardContent>
          </Card>
        )}
      </section>

      <p className="text-xs text-muted-foreground">
        Approvals, rejections and take-downs are recorded in{' '}
        <span className="font-medium">Activity</span>, with who decided and when.
        Last loaded {ago(new Date().toISOString())}.
      </p>
    </div>
  );
}
