'use client';

import { useState, type ReactNode } from 'react';
import { PrivyProvider } from '@privy-io/react-auth';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { publicEnv } from '@/lib/publicEnv';

/**
 * Client-side provider tree for the web app — Privy (email-OTP +
 * Google/X OAuth, mirroring `apps/frontend`'s `AppProviders`/
 * `PrivyProvider` setup) and TanStack Query for data fetching, same
 * library the mobile app uses for the same reason: this project's
 * ESLint config enforces `react-hooks/set-state-in-effect`, which
 * flags the plain `useEffect` + `setState` fetch pattern — a query
 * library's own internal effect is what's meant to own that, not
 * page-level code (see `app/(app)/page.tsx`'s doc comment). Privy is
 * always mounted, even without a configured app id, so every page can
 * unconditionally use its hooks — pages that need it gate on
 * `isPrivyConfigured` instead, same pattern as the mobile app's
 * `SignInScreen`.
 */
export function Providers({ children }: { children: ReactNode }) {
  const [queryClient] = useState(() => new QueryClient());

  return (
    <QueryClientProvider client={queryClient}>
      <PrivyProvider
        appId={publicEnv.privyAppId}
        config={{
          appearance: { theme: 'dark', accentColor: '#FDCC03' },
          loginMethods: ['email', 'google', 'twitter'],
          embeddedWallets: { ethereum: { createOnLogin: 'users-without-wallets' } },
        }}
      >
        {children}
      </PrivyProvider>
    </QueryClientProvider>
  );
}
