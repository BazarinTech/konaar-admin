'use client';

import * as React from 'react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { ago } from '@/lib/format';
import { featureTemplate, takeDownTemplate } from './actions';
import type { TemplateRecord } from './page';

/** One live template, and the one action that applies to it. */
export function PublishedRow({
  template,
  nextRank,
}: {
  template: TemplateRecord;
  /** The first free position in the featured row, worked out by the page. */
  nextRank: number;
}) {
  const [pending, start] = React.useTransition();
  const [removing, setRemoving] = React.useState(false);
  const [reason, setReason] = React.useState('');

  /**
   * Into the featured row, or out of it.
   *
   * The position is the next free one rather than something to type: a
   * reviewer deciding "this is good" should not also have to decide where in
   * a list of six it goes, and the row can be reordered by unfeaturing.
   */
  function feature() {
    start(async () => {
      const result = await featureTemplate(
        template.id,
        template.featuredRank === null ? nextRank : null,
      );
      if (result.error) toast.error(result.error);
      else toast.success(result.message ?? 'Saved.');
    });
  }

  function takeDown() {
    start(async () => {
      const result = await takeDownTemplate(template.id, reason);
      if (result.error) toast.error(result.error);
      else {
        toast.success(result.message ?? 'Removed.');
        setRemoving(false);
        setReason('');
      }
    });
  }

  return (
    <div className="flex flex-col gap-3 p-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate font-medium">{template.title}</p>
          <p className="text-xs text-muted-foreground">
            {template.author.name} · published {ago(template.publishedAt ?? template.submittedAt)}
          </p>
        </div>
        <div className="flex items-center gap-4">
          <span className="tabular text-xs text-muted-foreground">
            {template.fileCount > 0
              ? `${template.fileCount} files`
              : 'Starter — no files'}{' '}
            · {template.remixCount} used · {template.likeCount} likes ·{' '}
            {template.commentCount} comments
          </span>
          <Button
            size="sm"
            variant={template.featuredRank === null ? 'outline' : 'default'}
            disabled={pending}
            onClick={feature}
            title={
              template.featuredRank === null
                ? 'Show this one first in the gallery'
                : `Featured at position ${template.featuredRank}`
            }
          >
            {pending
              ? '…'
              : template.featuredRank === null
                ? 'Feature'
                : `Featured #${template.featuredRank}`}
          </Button>
          <Button
            size="sm"
            variant="outline"
            disabled={pending}
            onClick={() => setRemoving((v) => !v)}
          >
            Take down
          </Button>
        </div>
      </div>

      {removing ? (
        <div className="flex flex-col gap-2">
          <Textarea
            value={reason}
            rows={2}
            onChange={(event: React.ChangeEvent<HTMLTextAreaElement>) =>
                setReason(event.target.value)
              }
            placeholder="Why it is coming off the showcase — recorded in the activity log."
          />
          <div className="flex justify-end gap-2">
            <Button variant="ghost" disabled={pending} onClick={() => setRemoving(false)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              disabled={pending || reason.trim().length < 10}
              onClick={takeDown}
            >
              {pending ? 'Removing…' : 'Remove'}
            </Button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
