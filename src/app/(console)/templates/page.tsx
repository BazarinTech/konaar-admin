import { apiPage } from '@/lib/api';
import { ago } from '@/lib/format';
import { PageHeader } from '@/components/page-header';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ReviewCard } from './review-card';
import { PublishedRow } from './published-row';
import { CommentRow } from './comment-row';

export const metadata = { title: 'Templates — Konaar Console' };

export interface TemplateRecord {
  id: string;
  projectId: string | null;
  title: string;
  summary: string;
  category: string;
  categoryLabel: string;
  prompt: string | null;
  status: 'draft' | 'pending' | 'approved' | 'rejected' | 'withdrawn';
  rejectionReason: string | null;
  hasScreenshot: boolean;
  /** Copied at submission. A template with none is a seeded starter. */
  fileCount: number;
  totalBytes: number;
  /** The author's own deployed copy, captured at submission. */
  liveUrl: string | null;
  featuredRank: number | null;
  remixCount: number;
  likeCount: number;
  commentCount: number;
  submittedAt: string;
  reviewedAt: string | null;
  publishedAt: string | null;
  author: { name: string; email: string };
}

/** A comment on somebody's template, in the moderation list. */
export interface CommentRecord {
  id: string;
  templateId: string;
  templateTitle: string;
  body: string;
  author: { id: string; name: string; email: string };
  hidden: boolean;
  hiddenReason: string | null;
  createdAt: string;
}

/**
 * The queue, and what is already live.
 *
 * Pending first and on its own, because it is the only part of this page that
 * is work: everything below it is reference. A reviewer opening this should
 * see what is waiting without reading past anything.
 */
export default async function TemplatesPage() {
  const [queue, all, thread] = await Promise.all([
    apiPage<{ data: TemplateRecord[] }>('/admin/templates/queue'),
    apiPage<{ data: TemplateRecord[] }>('/admin/templates?status=approved'),
    apiPage<{ data: CommentRecord[] }>('/admin/templates/comments?limit=50'),
  ]);

  const waiting = queue.data;
  const published = all.data;
  const comments = thread.data;
  // The first free position, so featuring something does not need a number
  // typed in and never collides with a rank already in use.
  const nextFeaturedRank =
    Math.max(0, ...published.map((t) => t.featuredRank ?? 0)) + 1;

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
                <PublishedRow
                  key={template.id}
                  template={template}
                  nextRank={nextFeaturedRank}
                />
              ))}
            </CardContent>
          </Card>
        )}
      </section>

      <section className="flex flex-col gap-3">
        <div className="flex items-baseline gap-2">
          <h2 className="text-sm font-medium">Recent comments</h2>
          <Badge variant="secondary">{comments.length}</Badge>
        </div>
        <p className="text-xs text-muted-foreground">
          Across every template, newest first. A comment sits on the front page
          under our name, so hiding one is recorded with a reason — and the
          hidden ones stay here so the decision can be looked at again.
        </p>

        {comments.length === 0 ? (
          <Card>
            <CardContent className="py-10 text-center text-sm text-muted-foreground">
              Nobody has commented on a template yet.
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardContent className="flex flex-col divide-y p-0">
              {comments.map((comment) => (
                <CommentRow key={comment.id} comment={comment} />
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
