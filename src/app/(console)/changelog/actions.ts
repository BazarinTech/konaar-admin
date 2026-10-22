'use server';

import { revalidatePath } from 'next/cache';
import { api, ApiError } from '@/lib/api';
import type { ChangelogEntry } from './types';

export interface ActionResult<T = undefined> {
  ok?: boolean;
  error?: string;
  message?: string;
  data?: T;
}

async function call<T>(path: string, method: 'POST' | 'DELETE', body?: unknown): Promise<ActionResult<T>> {
  try {
    const data = await api<T>(path, {
      method,
      body: body === undefined ? undefined : JSON.stringify(body),
    });
    revalidatePath('/changelog');
    return { ok: true, data };
  } catch (err) {
    return { error: err instanceof ApiError ? err.message : 'That did not go through. Try again.' };
  }
}

export async function saveEntry(
  id: string | null,
  input: Record<string, unknown>,
): Promise<ActionResult<ChangelogEntry>> {
  const r = await call<ChangelogEntry>(id ? `/admin/changelog/${id}` : '/admin/changelog', 'POST', input);
  if (r.ok && id) revalidatePath(`/changelog/${id}`);
  return { ...r, message: r.ok ? 'Saved.' : undefined };
}

export async function publishEntry(
  id: string,
  announce: boolean,
): Promise<ActionResult<ChangelogEntry & { announced: { recipients: number } | null }>> {
  const r = await call<ChangelogEntry & { announced: { recipients: number } | null }>(
    `/admin/changelog/${id}/publish`,
    'POST',
    { announce },
  );
  revalidatePath(`/changelog/${id}`);
  if (!r.ok) return r;
  return {
    ...r,
    message: r.data?.announced
      ? `Published, and emailing ${r.data.announced.recipients} people.`
      : 'Published.',
  };
}

export async function unpublishEntry(id: string): Promise<ActionResult> {
  const r = await call(`/admin/changelog/${id}/unpublish`, 'POST');
  revalidatePath(`/changelog/${id}`);
  return { ...r, data: undefined, message: r.ok ? 'Moved back to drafts.' : undefined };
}

export async function deleteEntry(id: string): Promise<ActionResult> {
  const r = await call(`/admin/changelog/${id}`, 'DELETE');
  return { ...r, data: undefined, message: r.ok ? 'Deleted.' : undefined };
}
