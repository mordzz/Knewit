'use client';

import { useState, type ReactNode } from 'react';
import { PrivyProvider } from '@privy-io/react-auth';
import { toSolanaWalletConnectors } from '@privy-io/react-auth/solana';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { publicEnv } from '@/lib/publicEnv';
import { ApiRequestError } from '@/lib/apiClient';

/** Module-level so the connector registry (and its wallet-standard
 * listeners, registered by Privy via `onMount`) is created once, not on
 * every `Providers` re-render. `@wallet-standard/app`'s `getWallets()` is
 * SSR-safe (it returns early without `window`), so calling it during the
 * server render of this client component is fine. */
const solanaConnectors = toSolanaWalletConnectors();

/**
 * Client-side provider tree for the web app  Privy (email-OTP +
 * Google/X OAuth, mirroring `apps/frontend`'s `AppProviders`/
 * `PrivyProvider` setup) and TanStack Query for data fetching, same
 * library the mobile app uses for the same reason: this project's
 * ESLint config enforces `react-hooks/set-state-in-effect`, which
 * flags the plain `useEffect` + `setState` fetch pattern  a query
 * library's own internal effect is what's meant to own that, not
 * page-level code (see `app/(app)/page.tsx`'s doc comment). Privy is
 * always mounted, even without a configured app id, so every page can
 * unconditionally use its hooks  pages that need it gate on
 * `publicEnv.privyAppId` instead, same pattern as the mobile app's
 * `SignInScreen`.
 */
export function Providers({ children }: { children: ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            // A 404 almost always means "this id doesn't exist in this
            // resource"  a real, meaningful answer, not a transient
            // failure  so retrying it just delays the query's `status`
            // reaching `'error'` for no benefit (observed concretely: a
            // market-detail page that tries a market id then falls back to
            // an event id got stuck on its loading skeleton for the full
            // default 3-retry backoff because `status` stayed `'pending'`
            // throughout). Every other error keeps React Query's own
            // default (3 retries).
            retry: (failureCount, error) =>
              error instanceof ApiRequestError && error.status === 404 ? false : failureCount < 3,
          },
        },
      }),
  );

  return (
    <QueryClientProvider client={queryClient}>
      <PrivyProvider
        appId={publicEnv.privyAppId}
        clientId={publicEnv.privyClientId || undefined}
        config={{
          appearance: { theme: 'dark', accentColor: '#FFE506' },
          loginMethods: ['email', 'google', 'twitter'],
          embeddedWallets: { ethereum: { createOnLogin: 'users-without-wallets' } },
          // MoonPay's hosted UI has its own theme; match the app's dark +
          // brand yellow so the deposit flow never flashes a light screen
          // (the Privy-owned part already follows `appearance` above).
          // Coinbase's on-ramp exposes no theme options.
          fundingMethodConfig: {
            moonpay: { uiConfig: { accentColor: '#FFE506', theme: 'dark' } },
          },
          // Solana wallet login is enabled in the Privy Dashboard for this
          // app, so the SDK warns unless real wallet-standard connectors
          // are passed. `toSolanaWalletConnectors()` is Privy's own helper
          // (needs the `@solana-program/*` peers installed  memo is the
          // only one that wasn't); `loginMethods` above keeps Solana out of
          // the login modal. See docs/WALLET.md.
          //
          // WalletConnect is disabled: this app never offers external
          // wallets (email/Google/X only, embedded wallet is the trading
          // wallet), and WalletConnect Core's dev-time double-init warning
          // ("Init() was called 2 times") comes from it being initialized
          // for a connector that can't surface anyway.
          externalWallets: {
            walletConnect: { enabled: false },
            solana: { connectors: solanaConnectors },
          },
        }}
      >
        {children}
      </PrivyProvider>
    </QueryClientProvider>
  );
}
