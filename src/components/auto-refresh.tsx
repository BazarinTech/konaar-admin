'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';

/**
 * Re-reads the page's server data every so often while it is on screen, so a
 * new email or a campaign's progress appears without a manual reload. Paused
 * in a background tab: nobody is looking, and the API need not answer.
 */
export function AutoRefresh({ seconds = 30 }: { seconds?: number }) {
  const router = useRouter();
  React.useEffect(() => {
    const tick = () => {
      if (document.visibilityState === 'visible') router.refresh();
    };
    const id = window.setInterval(tick, seconds * 1000);
    document.addEventListener('visibilitychange', tick);
    return () => {
      window.clearInterval(id);
      document.removeEventListener('visibilitychange', tick);
    };
  }, [router, seconds]);
  return null;
}
