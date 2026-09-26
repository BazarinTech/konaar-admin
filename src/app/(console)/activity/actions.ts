'use server';

import { api } from '@/lib/api';

export interface ActivityEntry {
  id: number;
  action: string;
  summary: string;
  targetType: string | null;
  targetId: string | null;
  createdAt: string;
  adminName: string | null;
  adminEmail: string | null;
}

export interface ActivityPage {
  data: ActivityEntry[];
  pageInfo: { nextCursor: string | null; hasMore: boolean };
}

export async function loadActivity(
  cursor: string,
): Promise<ActivityPage | null> {
  try {
    return await api<ActivityPage>(
      `/admin/activity?cursor=${encodeURIComponent(cursor)}`,
    );
  } catch {
    return null;
  }
}
