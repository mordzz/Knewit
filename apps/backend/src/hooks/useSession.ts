'use client';

import { usePrivy } from '@privy-io/react-auth';
import { useGuestStore } from '@/lib/guest/guestStore';

/**
 * Web equivalent of mobile's `useAuth` + `useWallet` composition for the
 * one question every shared surface actually asks: "may this visitor use
 * the app, and whose wallet is this?" Real Privy auth keeps its own
 * meaning (`authenticated`); `canUseApp` additionally accepts a guest
 * session, and `address` resolves to the sandbox's fixed demo wallet in
 * that case — see docs/DECISIONS.md, "Guest Mode".
 *
 * `ready` also waits on the persisted guest flag's hydration so a
 * returning guest isn't bounced to `/sign-in` for a frame on load.
 */
export function useSession() {
  const { ready, authenticated, user } = usePrivy();
  const isGuest = useGuestStore((state) => state.isGuest);
  const hasHydrated = useGuestStore((state) => state.hasHydrated);
  const guestAddress = useGuestStore((state) => state.walletAddress);

  const address = isGuest ? guestAddress : (user?.wallet?.address ?? null);

  return {
    ready: isGuest || (ready && hasHydrated),
    canUseApp: authenticated || isGuest,
    authenticated,
    isGuest,
    hasHydrated,
    address,
    walletConnected: Boolean(address),
    privyUser: user,
  };
}
