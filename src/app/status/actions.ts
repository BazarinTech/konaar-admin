'use server';

import { api, ApiError } from '@/lib/api';

/**
 * Collect an address.
 *
 * A server action rather than a fetch from the browser: the API's base URL
 * is server configuration, and the status page should not need it published
 * to the client to work.
 */
export async function subscribeToStatus(
  email: string,
): Promise<{ ok?: boolean; error?: string }> {
  try {
    await api('/status/subscribe', {
      method: 'POST',
      body: JSON.stringify({ email }),
      // No session, and none wanted: this page is read by people who do not
      // have one.
      anonymous: true,
    });
  } catch (err) {
    return {
      error:
        err instanceof ApiError
          ? err.message
          : 'That did not go through. Try again in a moment.',
    };
  }
  return { ok: true };
}
