'use server';

import { revalidatePath } from 'next/cache';
import { api, ApiError } from '@/lib/api';
import type { Audience } from './types';

export interface ActionResult<T = undefined> {
  ok?: boolean;
  error?: string;
  message?: string;
  data?: T;
}

function failed(err: unknown): ActionResult<never> {
  return {
    error: err instanceof ApiError ? err.message : 'That did not go through. Try again.',
  };
}

async function call<T>(
  path: string,
  method: 'POST' | 'DELETE',
  body?: unknown,
): Promise<{ data?: T; error?: string }> {
  try {
    const data = await api<T>(path, {
      method,
      body: body === undefined ? undefined : JSON.stringify(body),
    });
    return { data };
  } catch (err) {
    return failed(err);
  }
}

// ── inbox ───────────────────────────────────────────────────────────────────

export async function replyToThread(
  threadId: string,
  html: string,
  cc: string[],
): Promise<ActionResult> {
  const r = await call(`/admin/email/threads/${threadId}/reply`, 'POST', { html, cc });
  if (r.error) return { error: r.error };
  revalidatePath('/inbox');
  return { ok: true, message: 'Reply sent.' };
}

export async function composeEmail(
  mailboxId: string,
  input: { to: string[]; cc: string[]; subject: string; html: string },
): Promise<ActionResult<{ threadId: string }>> {
  const r = await call<{ threadId: string }>(
    `/admin/email/inbox/${mailboxId}/compose`,
    'POST',
    input,
  );
  if (r.error) return { error: r.error };
  revalidatePath('/inbox');
  return { ok: true, message: 'Email sent.', data: r.data };
}

export async function setThreadStatus(
  threadId: string,
  status: 'open' | 'archived',
): Promise<ActionResult> {
  const r = await call(`/admin/email/threads/${threadId}/status`, 'POST', { status });
  if (r.error) return { error: r.error };
  revalidatePath('/inbox');
  return { ok: true, message: status === 'archived' ? 'Archived.' : 'Moved back to the inbox.' };
}

export async function markThreadUnread(threadId: string): Promise<ActionResult> {
  const r = await call(`/admin/email/threads/${threadId}/unread`, 'POST');
  if (r.error) return { error: r.error };
  revalidatePath('/inbox');
  return { ok: true, message: 'Marked unread.' };
}

/** A short-lived link to an attachment on a received email. */
export async function attachmentLink(
  messageId: string,
  attachmentId: string,
): Promise<ActionResult<{ url: string }>> {
  try {
    const data = await api<{ url: string }>(
      `/admin/email/messages/${messageId}/attachments/${attachmentId}`,
    );
    return { ok: true, data };
  } catch (err) {
    return failed(err);
  }
}

// ── mailboxes ───────────────────────────────────────────────────────────────

export async function saveMailbox(
  id: string | null,
  input: {
    address?: string;
    displayName?: string;
    signature?: string | null;
    memberIds?: string[];
    status?: 'active' | 'disabled';
  },
): Promise<ActionResult> {
  const r = await call(
    id ? `/admin/email/mailboxes/${id}` : '/admin/email/mailboxes',
    'POST',
    input,
  );
  if (r.error) return { error: r.error };
  revalidatePath('/admins/mailboxes');
  revalidatePath('/inbox');
  return {
    ok: true,
    message: id ? 'Mailbox updated.' : 'Mailbox created.',
  };
}

export async function removeMailbox(id: string): Promise<ActionResult> {
  const r = await call(`/admin/email/mailboxes/${id}`, 'DELETE');
  if (r.error) return { error: r.error };
  revalidatePath('/admins/mailboxes');
  revalidatePath('/inbox');
  return { ok: true, message: 'Mailbox removed. Its conversations are kept.' };
}

// ── bulk email ──────────────────────────────────────────────────────────────

export async function countAudience(
  audience: Audience,
): Promise<ActionResult<{ recipients: number; optedOut: number }>> {
  const r = await call<{ recipients: number; optedOut: number }>(
    '/admin/email/campaigns/audience',
    'POST',
    audience,
  );
  if (r.error) return { error: r.error };
  return { ok: true, data: r.data };
}

export async function previewBroadcast(
  html: string,
  includeOptedOut: boolean,
): Promise<ActionResult<{ html: string }>> {
  const r = await call<{ html: string }>('/admin/email/campaigns/preview', 'POST', {
    html,
    includeOptedOut,
  });
  if (r.error) return { error: r.error };
  return { ok: true, data: r.data };
}

export async function sendCampaign(input: {
  subject: string;
  html: string;
  audience: Audience;
  mailboxId: string | null;
}): Promise<ActionResult<{ id: string; recipients: number }>> {
  const r = await call<{ id: string; recipients: number }>(
    '/admin/email/campaigns',
    'POST',
    input,
  );
  if (r.error) return { error: r.error };
  revalidatePath('/email');
  return { ok: true, data: r.data, message: `Sending to ${r.data?.recipients ?? 0} people.` };
}

// ── delivery log ────────────────────────────────────────────────────────────

export async function loadDelivery(
  id: string,
): Promise<ActionResult<{ html: string | null; subject: string; to: string; error: string | null }>> {
  try {
    const data = await api<{ html: string | null; subject: string; to: string; error: string | null }>(
      `/admin/email/deliveries/${id}`,
    );
    return { ok: true, data };
  } catch (err) {
    return failed(err);
  }
}

export async function retryDelivery(id: string): Promise<ActionResult> {
  const r = await call(`/admin/email/deliveries/${id}/retry`, 'POST');
  if (r.error) return { error: r.error };
  revalidatePath('/email/log');
  return { ok: true, message: 'Queued to send again.' };
}
