import { apiPage } from '@/lib/api';
import { dateTime, ago } from '@/lib/format';
import { PageHeader } from '@/components/page-header';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Empty } from '@/components/empty';

interface Feed {
  data: {
    id: number;
    action: string;
    summary: string;
    targetType: string | null;
    targetId: string | null;
    createdAt: string;
    adminName: string | null;
    adminEmail: string | null;
  }[];
}

export const metadata = { title: 'Activity — Konar Console' };

export default async function ActivityPage() {
  const feed = await apiPage<Feed>('/admin/activity?limit=200');

  return (
    <>
      <PageHeader
        title="Activity"
        description="Every change an administrator has made, newest first. This log cannot be edited from the console."
      />
      {feed.data.length === 0 ? (
        <Empty>No administrative changes have been recorded yet.</Empty>
      ) : (
        <Card>
          <CardContent className="flex flex-col divide-y p-0">
            {feed.data.map((entry) => (
              <div
                key={entry.id}
                className="flex flex-wrap items-baseline justify-between gap-2 px-5 py-3"
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
      )}
    </>
  );
}
