'use server';

import { revalidatePath } from 'next/cache';
import { api, ApiError } from '@/lib/api';
import type { UserList, UserQuery } from './types';

export interface ActionResult {
  ok?: boolean;
  error?: string;
  message?: string;
}

async function run(
  path: string,
  body: unknown,
  onDone: string,
  userId: string,
): Promise<ActionResult> {
  try {
    await api(path, { method: 'POST', body: JSON.stringify(body) });
  } catch (err) {
    return {
      error:
        err instanceof ApiError ? err.message : 'That did not go through. Try again.',
    };
  }
  // Both the detail page and the list show ban state and balances.
  revalidatePath(`/users/${userId}`);
  revalidatePath('/users');
  return { ok: true, message: onDone };
}

export async function banUser(
  userId: string,
  reason: string,
): Promise<ActionResult> {
  if (reason.trim().length < 3) {
    return { error: 'Say why. It is recorded against your name.' };
  }
  return run(
    `/admin/users/${userId}/ban`,
    { reason: reason.trim() },
    'The account is banned and its sessions are closed.',
    userId,
  );
}

export async function unbanUser(userId: string): Promise<ActionResult> {
  return run(
    `/admin/users/${userId}/unban`,
    {},
    'The ban has been lifted.',
    userId,
  );
}

export async function revokeSessions(userId: string): Promise<ActionResult> {
  return run(
    `/admin/users/${userId}/sessions/revoke`,
    {},
    'Signed out of every session.',
    userId,
  );
}

export async function grantCredits(
  userId: string,
  input: { workspaceId: string; kind: 'ai' | 'cloud'; credits: number; reason: string },
): Promise<ActionResult> {
  if (!(input.credits > 0)) return { error: 'Enter a number of credits.' };
  if (input.reason.trim().length < 3) {
    return { error: 'Say what the credits are for.' };
  }
  return run(
    `/admin/users/${userId}/credits`,
    { ...input, reason: input.reason.trim() },
    `${input.credits} ${input.kind} credits added.`,
    userId,
  );
}

/**
 * The next page of the user list.
 *
 * The filters travel with the cursor because the cursor only says "after this
 * row" — it carries no memory of what was being asked for, and a page fetched
 * under different filters would splice unrelated rows into the table.
 */
export async function loadUsers(
  query: UserQuery,
  cursor: string,
): Promise<UserList | null> {
  const search = new URLSearchParams({
    status: query.status,
    sort: query.sort,
    cursor,
  });
  if (query.query) search.set('query', query.query);
  try {
    return await api<UserList>(`/admin/users?${search}`);
  } catch {
    return null;
  }
}
