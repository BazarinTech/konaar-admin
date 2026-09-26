'use client';

import { loadActivity, type ActivityEntry, type ActivityPage } from './actions';
import { LoadMoreButton, useLoadMore } from '@/components/load-more';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ago, dateTime } from '@/lib/format';

export function ActivityFeed({ initial }: { initial: ActivityPage }) {
  const { rows, cursor, pending, failed, loadMore } =
    useLoadMore<ActivityEntry>(initial, loadActivity);

  return (
    <>
      <Card>
        <CardContent className="flex flex-col divide-y p-0">
          {rows.map((entry) => (
            <div
              key={entry.id}
              className="flex flex-wrap items-baseline justify-between gap-2 px-4 py-3 sm:px-5"
            >
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <Badge variant="outline">{entry.action}</Badge>
                  {entry.targetType ? (
                    <span className="text-muted-foreground text-xs">
                      {entry.targetType}
                    </span>
                  ) : null}
                </div>
                <p className="mt-1 text-sm">{entry.summary}</p>
              </div>
              <div className="text-muted-foreground text-right text-xs">
                <div title={dateTime(entry.createdAt)}>
                  {ago(entry.createdAt)}
                </div>
                <div>{entry.adminEmail ?? 'unknown administrator'}</div>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      <LoadMoreButton
        hasMore={cursor.hasMore}
        pending={pending}
        failed={failed}
        onClick={loadMore}
        shown={rows.length}
      />
    </>
  );
}
