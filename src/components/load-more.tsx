'use client';

import { useState, useTransition } from 'react';
import { LoaderCircleIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';

export interface Cursor {
  nextCursor: string | null;
  hasMore: boolean;
}

/**
 * Appends the next page, on demand.
 *
 * Deliberately a button rather than an infinite scroll. These lists are read by
 * someone looking for a particular row, and a list that keeps growing under the
 * scrollbar makes "the third one down" impossible to get back to. It also means
 * a page is only fetched when somebody wants it.
 */
export function useLoadMore<T>(
  initial: { data: T[]; pageInfo: Cursor },
  fetchPage: (
    cursor: string,
  ) => Promise<{ data: T[]; pageInfo: Cursor } | null>,
) {
  const [rows, setRows] = useState(initial.data);
  const [cursor, setCursor] = useState(initial.pageInfo);
  const [pending, start] = useTransition();
  const [failed, setFailed] = useState(false);

  const loadMore = () => {
    if (!cursor.nextCursor) return;
    const next = cursor.nextCursor;
    start(async () => {
      const page = await fetchPage(next);
      if (!page) {
        setFailed(true);
        return;
      }
      setFailed(false);
      setRows((current) => [...current, ...page.data]);
      setCursor(page.pageInfo);
    });
  };

  return { rows, cursor, pending, failed, loadMore };
}

export function LoadMoreButton({
  hasMore,
  pending,
  failed,
  onClick,
  shown,
  total,
}: {
  hasMore: boolean;
  pending: boolean;
  failed: boolean;
  onClick: () => void;
  shown: number;
  total?: number;
}) {
  return (
    <div className="mt-4 flex flex-col items-center gap-2">
      {failed ? (
        <p className="text-destructive text-xs">
          That page did not load. Try again.
        </p>
      ) : null}
      <span className="text-muted-foreground text-xs">
        {total !== undefined
          ? `Showing ${shown} of ${total}`
          : `Showing ${shown}`}
      </span>
      {hasMore ? (
        <Button
          variant="outline"
          size="sm"
          onClick={onClick}
          disabled={pending}
        >
          {pending ? (
            <>
              <LoaderCircleIcon className="animate-spin" />
              Loading
            </>
          ) : (
            'Load more'
          )}
        </Button>
      ) : null}
    </div>
  );
}
