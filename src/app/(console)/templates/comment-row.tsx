'use client';

import * as React from 'react';
import { toast } from 'sonner';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { ago } from '@/lib/format';
import { hideComment, showComment } from './actions';
import type { CommentRecord } from './page';

/**
 * One comment, and the one decision that applies to it.
 *
 * Hidden ones stay in the list rather than disappearing: a moderator
 * reviewing a decision — their own or somebody else's — needs to see what
 * was taken down and why.
 */
export function CommentRow({ comment }: { comment: CommentRecord }) {
  const [pending, start] = React.useTransition();
  const [hiding, setHiding] = React.useState(false);
  const [reason, setReason] = React.useState('');

  function hide() {
    start(async () => {
      const result = await hideComment(comment.id, reason);
      if (result.error) toast.error(result.error);
      else {
        toast.success(result.message ?? 'Hidden.');
        setHiding(false);
        setReason('');
      }
    });
  }

  function restore() {
    start(async () => {
      const result = await showComment(comment.id);
      if (result.error) toast.error(result.error);
      else toast.success(result.message ?? 'Back on the page.');
    });
  }

  return (
    <div className="flex flex-col gap-2 p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="flex items-center gap-2 text-xs text-muted-foreground">
            <span className="font-medium text-foreground">
              {comment.author.name}
            </span>
            <span className="truncate">{comment.author.email}</span>
            <span>·</span>
            <span>{ago(comment.createdAt)}</span>
            {comment.hidden ? <Badge variant="secondary">Hidden</Badge> : null}
          </p>
          <p className="pt-1 text-xs text-muted-foreground">
            on <span className="font-medium">{comment.templateTitle}</span>
          </p>
        </div>

        {comment.hidden ? (
          <Button size="sm" variant="outline" disabled={pending} onClick={restore}>
            {pending ? 'Restoring…' : 'Put it back'}
          </Button>
        ) : (
          <Button
            size="sm"
            variant="outline"
            disabled={pending}
            onClick={() => setHiding((v) => !v)}
          >
            Hide
          </Button>
        )}
      </div>

      {/* Somebody else's text, rendered as text. */}
      <p className="text-sm whitespace-pre-wrap">{comment.body}</p>

      {comment.hidden && comment.hiddenReason ? (
        <p className="border-l-2 pl-2 text-xs text-muted-foreground">
          {comment.hiddenReason}
        </p>
      ) : null}

      {hiding ? (
        <div className="flex flex-col gap-2 pt-1">
          <Textarea
            value={reason}
            rows={2}
            onChange={(event: React.ChangeEvent<HTMLTextAreaElement>) =>
              setReason(event.target.value)
            }
            placeholder="Why it is coming down — recorded in the activity log."
          />
          <div className="flex justify-end gap-2">
            <Button variant="ghost" disabled={pending} onClick={() => setHiding(false)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              disabled={pending || reason.trim().length < 5}
              onClick={hide}
            >
              {pending ? 'Hiding…' : 'Hide it'}
            </Button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
