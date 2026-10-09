'use client';

import * as React from 'react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { ago } from '@/lib/format';
import { reviewTemplate } from './actions';
import type { TemplateRecord } from './page';

/**
 * One submission, with everything needed to judge it on the card.
 *
 * The prompt is shown in full rather than truncated: it is what a stranger's
 * build will actually run, and it is the thing most likely to be wrong in a
 * way a title and a screenshot hide.
 */
export function ReviewCard({ template }: { template: TemplateRecord }) {
  const [pending, start] = React.useTransition();
  const [rejecting, setRejecting] = React.useState(false);
  const [reason, setReason] = React.useState('');

  function decide(decision: 'approve' | 'reject') {
    start(async () => {
      const result = await reviewTemplate(template.id, decision, reason);
      if (result.error) toast.error(result.error);
      else {
        toast.success(result.message ?? 'Done.');
        setRejecting(false);
        setReason('');
      }
    });
  }

  return (
    <Card>
      <CardContent className="flex flex-col gap-4 p-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="font-medium">{template.title}</p>
            <p className="text-sm text-muted-foreground">{template.summary}</p>
          </div>
          <Badge variant="secondary">{template.categoryLabel}</Badge>
        </div>

        <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
          <span>
            {template.author.name} · {template.author.email}
          </span>
          <span>Submitted {ago(template.submittedAt)}</span>
          {/* Said plainly: a template with no picture shows a drawn
              placeholder on the front page, which a reviewer should know
              before approving it. */}
          <span>
            {template.hasScreenshot
              ? 'Has a screenshot'
              : 'No screenshot — the card will show a placeholder'}
          </span>
        </div>

        <div className="border bg-muted/30 p-3">
          <p className="mb-1 text-xs font-medium text-muted-foreground">
            What a remix builds
          </p>
          <p className="text-sm whitespace-pre-wrap">{template.prompt}</p>
        </div>

        {rejecting ? (
          <div className="flex flex-col gap-2">
            <label htmlFor={`reason-${template.id}`} className="text-xs font-medium">
              Why not? The author sees this.
            </label>
            <Textarea
              id={`reason-${template.id}`}
              value={reason}
              rows={3}
              onChange={(event: React.ChangeEvent<HTMLTextAreaElement>) =>
                setReason(event.target.value)
              }
              placeholder="The screenshot does not match the project, and the prompt describes a different app."
            />
          </div>
        ) : null}

        <div className="flex flex-wrap justify-end gap-2">
          {rejecting ? (
            <>
              <Button
                variant="ghost"
                disabled={pending}
                onClick={() => {
                  setRejecting(false);
                  setReason('');
                }}
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                // Matches the API's own minimum, so the button is disabled
                // rather than the request refused.
                disabled={pending || reason.trim().length < 10}
                onClick={() => decide('reject')}
              >
                {pending ? 'Rejecting…' : 'Reject'}
              </Button>
            </>
          ) : (
            <>
              <Button
                variant="outline"
                disabled={pending}
                onClick={() => setRejecting(true)}
              >
                Reject
              </Button>
              <Button disabled={pending} onClick={() => decide('approve')}>
                {pending ? 'Publishing…' : 'Publish'}
              </Button>
            </>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
