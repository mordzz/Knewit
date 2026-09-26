'use client';

import { usePrivy } from '@privy-io/react-auth';

/**
 * Web equivalent of mobile's `useAuth` + `useWallet` composition for the
 * one question every shared surface actually asks: "may this visitor use
 * the app, and whose wallet is this?" Real Privy auth keeps its own
 * meaning (`authenticated`), and only an authenticated Privy session may
 * enter the application.
 */
export function useSession() {
  const { ready, authenticated, user } = usePrivy();
  const address = user?.wallet?.address ?? null;

  return {
    ready,
    canUseApp: authenticated,
    authenticated,
    address,
    walletConnected: Boolean(address),
    privyUser: user,
  };
}
