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
 * Every write here changes what customers are told.
 *
 * Both paths are revalidated on purpose: the console shows the operator what
 * they just did, and `/status` is the page everyone else is refreshing.
 */
function refresh() {
  revalidatePath('/status');
}

export async function createGroup(
  name: string,
  sortIndex: number,
): Promise<ActionResult> {
  try {
    await api('/admin/status/groups', {
      method: 'POST',
      body: JSON.stringify({ name, sortIndex }),
    });
  } catch (err) {
    return failed(err);
  }
  refresh();
  return { ok: true, message: 'Section added.' };
}

export async function deleteGroup(id: string): Promise<ActionResult> {
  try {
    await api(`/admin/status/groups/${id}`, { method: 'DELETE' });
  } catch (err) {
    return failed(err);
  }
  refresh();
  return { ok: true, message: 'Section removed. Its services kept their history.' };
}

export async function createComponent(input: {
  name: string;
  groupId: string | null;
  description: string | null;
  sortIndex: number;
}): Promise<ActionResult> {
  try {
    await api('/admin/status/components', {
      method: 'POST',
      body: JSON.stringify(input),
    });
  } catch (err) {
    return failed(err);
  }
  refresh();
  return { ok: true, message: 'Added to the page.' };
}

/** Including the thing it is doing right now, which is the common use. */
export async function updateComponent(
  id: string,
  patch: Record<string, unknown>,
): Promise<ActionResult> {
  try {
    await api(`/admin/status/components/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(patch),
    });
  } catch (err) {
    return failed(err);
  }
  refresh();
  return { ok: true, message: 'Saved.' };
}

export async function deleteComponent(id: string): Promise<ActionResult> {
  try {
    await api(`/admin/status/components/${id}`, { method: 'DELETE' });
  } catch (err) {
    return failed(err);
  }
  refresh();
  return { ok: true, message: 'Removed from the page.' };
}

export async function openIncident(input: {
  title: string;
  impact: string;
  status: string;
  componentIds: string[];
  body: string;
  startedAt?: string;
}): Promise<ActionResult> {
  try {
    await api('/admin/status/incidents', {
      method: 'POST',
      body: JSON.stringify(input),
    });
  } catch (err) {
    return failed(err);
  }
  refresh();
  return { ok: true, message: 'Posted. It is on the status page now.' };
}

/** Append-only: the timeline is a record of what was said and when. */
export async function postUpdate(
  incidentId: string,
  status: string,
  body: string,
): Promise<ActionResult> {
  try {
    await api(`/admin/status/incidents/${incidentId}/updates`, {
      method: 'POST',
      body: JSON.stringify({ status, body }),
    });
  } catch (err) {
    return failed(err);
  }
  refresh();
  return {
    ok: true,
    message:
      status === 'resolved' ? 'Resolved, and the services are back.' : 'Posted.',
  };
}

/** For a mistake — a test, a wrong button — not for an incident that happened. */
export async function deleteIncident(id: string): Promise<ActionResult> {
  try {
    await api(`/admin/status/incidents/${id}`, { method: 'DELETE' });
  } catch (err) {
    return failed(err);
  }
  refresh();
  return { ok: true, message: 'Taken off the page.' };
}
