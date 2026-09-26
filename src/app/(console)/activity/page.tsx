import { apiPage } from '@/lib/api';
import { PageHeader } from '@/components/page-header';
import { Empty } from '@/components/empty';
import { ActivityFeed } from './activity-feed';
import type { ActivityPage } from './actions';

export const metadata = { title: 'Activity — Konar Console' };

export default async function ActivityRoute() {
  const feed = await apiPage<ActivityPage>('/admin/activity');

  return (
    <>
      <PageHeader
        title="Activity"
        description="Every change an administrator has made, newest first. This log cannot be edited from the console."
      />
      {feed.data.length === 0 ? (
        <Empty>No administrative changes have been recorded yet.</Empty>
      ) : (
        <ActivityFeed initial={feed} />
      )}
    </>
  );
}
