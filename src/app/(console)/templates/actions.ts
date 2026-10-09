'use server';

import { revalidatePath } from 'next/cache';
import { api, ApiError } from '@/lib/api';

export interface ActionResult {
  ok?: boolean;
  error?: string;
  message?: string;
}

function failed(err: unknown): ActionResult {
  return {
    error: err instanceof ApiError ? err.message : 'That did not go through.',
  };
}

/**
 * Approve a submission, or refuse it with a reason.
 *
 * The reason is required by the API as well as here. It is the only thing the
 * author can act on, and a rejection they cannot read is one they will send
 * again unchanged.
 */
export async function reviewTemplate(
  id: string,
  decision: 'approve' | 'reject',
  reason?: string,
): Promise<ActionResult> {
  try {
    await api(`/admin/templates/${id}/review`, {
      method: 'POST',
      body: JSON.stringify({ decision, reason }),
    });
  } catch (err) {
    return failed(err);
  }
  revalidatePath('/templates');
  return {
    ok: true,
    message: decision === 'approve' ? 'Published to the showcase.' : 'Rejected.',
  };
}

/**
 * Remove something already published.
 *
 * Separate from a rejection: this is not a verdict on a submission, and the
 * two read differently in the audit log a year from now.
 */
export async function takeDownTemplate(
  id: string,
  reason: string,
): Promise<ActionResult> {
  try {
    await api(`/admin/templates/${id}/take-down`, {
      method: 'POST',
      body: JSON.stringify({ reason }),
    });
  } catch (err) {
    return failed(err);
  }
  revalidatePath('/templates');
  return { ok: true, message: 'Taken off the showcase.' };
}

/**
 * Let a person publish templates, or stop them.
 *
 * The note is required both ways. "Why is this account verified" gets asked
 * months later, usually about the one case somebody regrets — and the
 * revocation is the half that needs explaining most.
 */
export async function setTemplatePublisher(
  userId: string,
  verified: boolean,
  note: string,
): Promise<ActionResult> {
  try {
    await api(`/admin/templates/publishers/${userId}`, {
      method: 'POST',
      body: JSON.stringify({ verified, note }),
    });
  } catch (err) {
    return failed(err);
  }
  revalidatePath('/templates');
  revalidatePath('/users');
  return {
    ok: true,
    message: verified ? 'They can publish templates now.' : 'Publishing turned off.',
  };
}
