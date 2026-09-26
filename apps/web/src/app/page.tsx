'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from '@/hooks/useSession';
import { LandingPage } from '@/features/landing/components/LandingPage';

/**
 * Public entry point  the marketing landing page lives here now, not
 * the Home feed (moved to `(app)/home`, still behind the Hard Login
 * Gate). Renders immediately for signed-out visitors; an already-
 * authenticated session is bounced straight to `/home` once
 * `useSession()` confirms it, instead of holding the page back until
 * that check resolves.
 */
export default function Page() {
  const router = useRouter();
  const { ready, canUseApp } = useSession();

  useEffect(() => {
    if (ready && canUseApp) {
      router.replace('/callouts');
    }
  }, [ready, canUseApp, router]);

  return <LandingPage />;
}
