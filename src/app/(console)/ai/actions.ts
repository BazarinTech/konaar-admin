'use server';

import { revalidatePath } from 'next/cache';
import { api, ApiError } from '@/lib/api';
import type { SkillDraft, SkillPreview } from './types';

export interface ActionResult {
  ok?: boolean;
  error?: string;
  message?: string;
}

function failed(err: unknown): ActionResult {
  return {
    error:
      err instanceof ApiError ? err.message : 'That did not go through. Try again.',
  };
}

// ── engine ──────────────────────────────────────────────────────────────────

export async function setEngine(
  key: string,
  value: string | number | boolean,
): Promise<ActionResult> {
  try {
    await api('/admin/ai/engine', {
      method: 'POST',
      body: JSON.stringify({ key, value }),
    });
  } catch (err) {
    return failed(err);
  }
  revalidatePath('/ai/engine');
  // The models page shows which model fills each role.
  revalidatePath('/platform/models');
  return {
    ok: true,
    message: 'Saved. Builds pick it up within ten seconds.',
  };
}

export async function resetEngine(key: string): Promise<ActionResult> {
  try {
    await api(`/admin/ai/engine/${encodeURIComponent(key)}`, {
      method: 'DELETE',
    });
  } catch (err) {
    return failed(err);
  }
  revalidatePath('/ai/engine');
  revalidatePath('/platform/models');
  return { ok: true, message: 'Back to the default.' };
}

// ── skills ──────────────────────────────────────────────────────────────────

export async function createSkill(draft: SkillDraft): Promise<ActionResult> {
  try {
    await api('/admin/ai/skills', {
      method: 'POST',
      body: JSON.stringify(draft),
    });
  } catch (err) {
    return failed(err);
  }
  revalidatePath('/ai/skills');
  return {
    ok: true,
    message: draft.enabled
      ? 'Skill created. Builds start using it within ten seconds.'
      : 'Skill saved, switched off.',
  };
}

export async function updateSkill(
  id: string,
  patch: Partial<SkillDraft>,
): Promise<ActionResult> {
  try {
    await api(`/admin/ai/skills/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(patch),
    });
  } catch (err) {
    return failed(err);
  }
  revalidatePath('/ai/skills');
  return { ok: true, message: 'Saved.' };
}

export async function deleteSkill(id: string): Promise<ActionResult> {
  try {
    await api(`/admin/ai/skills/${id}`, { method: 'DELETE' });
  } catch (err) {
    return failed(err);
  }
  revalidatePath('/ai/skills');
  return { ok: true, message: 'Skill deleted. Its text is kept in the activity log.' };
}

export async function previewSkills(input: {
  operation: string;
  siteType: string | null;
  prompt: string;
}): Promise<{ result?: SkillPreview; error?: string }> {
  try {
    const result = await api<SkillPreview>('/admin/ai/skills/preview', {
      method: 'POST',
      body: JSON.stringify(input),
    });
    return { result };
  } catch (err) {
    return { error: failed(err).error };
  }
}
