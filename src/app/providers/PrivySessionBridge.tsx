import { useEffect, useRef } from 'react';
import { usePrivy, useEmbeddedEthereumWallet } from '@privy-io/expo';
import { useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '@/store/auth/authStore';
import { useWalletStore } from '@/store/wallet/walletStore';

/**
 * Mounted once, inside `PrivyProvider` — pushes Privy's real
 * authentication/embedded-wallet state into `authStore`/`walletStore`
 * so the handful of call sites that need it synchronously outside a
 * component (or just prefer the existing `useAuth`/`useWallet` hooks)
 * stay correct, without those stores ever becoming a second source of
 * truth. Renders nothing.
 *
 * Deliberately does **not** call `useEmbeddedEthereumWallet().create()`
 * itself — wallet creation is a real, deliberate action.
 * `useWalletConnect` and `WalletScreen` trigger creation when the
 * screens that need it are actually opened; this bridge only ever
 * mirrors state, never mutates Privy's side — see docs/DECISIONS.md.
 */
export function PrivySessionBridge() {
  const { user, isReady, error } = usePrivy();
  const { wallets } = useEmbeddedEthereumWallet();
  const queryClient = useQueryClient();
  const setSession = useAuthStore((state) => state.setSession);
  const clearSession = useAuthStore((state) => state.clearSession);
  const setConnecting = useWalletStore((state) => state.setConnecting);
  const setConnected = useWalletStore((state) => state.setConnected);
  const setDisconnected = useWalletStore((state) => state.setDisconnected);
  const setWalletError = useWalletStore((state) => state.setError);
  const previousAddress = useRef<string | null>(null);

  useEffect(() => {
    if (user) {
      // Our own backend's `User` record (handle/displayName/avatar)
      // doesn't exist yet — see docs/WALLET.md — so `authStore.user`
      // stays `null`; only `isAuthenticated` reflects the real Privy
      // session. `setSession(null)` still flips `isAuthenticated` true.
      setSession(null);
    } else {
      clearSession();
    }
  }, [user, setSession, clearSession]);

  useEffect(() => {
    if (!isReady) return;
    if (error) {
      setWalletError(error.message);
      return;
    }

    const address = user ? (wallets[0]?.address ?? null) : null;

    // A wallet identity change (including connect and disconnect) means
    // any cached position/trade data was fetched under a *different*
    // wallet context — invalidate it rather than risk a trade or
    // position display silently using stale data from a previous
    // session (Sprint 7: "user must not trade against a stale wallet
    // context"). Skipped on the very first resolution (mount) so this
    // doesn't invalidate a cache that was never populated.
    if (previousAddress.current !== null && previousAddress.current !== address) {
      queryClient.invalidateQueries({ queryKey: ['positions'] });
    }
    previousAddress.current = address;

    if (!user) {
      setDisconnected();
      return;
    }
    if (address) {
      setConnected(address);
    } else {
      // Authenticated, but no embedded wallet created yet — a real,
      // valid state (creation is explicit, see the component doc
      // above), distinct from "disconnected."
      setConnecting();
    }
  }, [
    isReady,
    error,
    user,
    wallets,
    queryClient,
    setConnected,
    setConnecting,
    setDisconnected,
    setWalletError,
  ]);

  return null;
}
