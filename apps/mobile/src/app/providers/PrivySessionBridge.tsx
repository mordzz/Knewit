import { useEffect, useRef } from 'react';
import { usePrivy, useEmbeddedEthereumWallet } from '@privy-io/expo';
import { useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '@/store/auth/authStore';
import { useWalletStore } from '@/store/wallet/walletStore';
import { isPrivyConfigured } from '@/app/config/env';

/**
 * Mounted once, inside `PrivyProvider` — pushes Privy's real
 * authentication/embedded-wallet state into `authStore`/`walletStore`
 * so the handful of call sites that need it synchronously outside a
 * component (or just prefer the existing `useAuth`/`useWallet` hooks)
 * stay correct, without those stores ever becoming a second source of
 * truth. Renders nothing.
 *
 * Also mirrors Privy's own `isReady` (cold-start "have we finished
 * checking for an existing session yet" flag) into `authStore.isReady`
 * — `RootNavigator` waits on that before choosing between the login
 * gate and Main, see docs/DECISIONS.md ("Hard Login Gate").
 *
 * Deliberately does **not** call `useEmbeddedEthereumWallet().create()`
 * itself — wallet creation is a real, deliberate action, triggered by
 * `SignInScreen` right after a fresh login and by `WalletScreen`'s own
 * "Connect Wallet" button for an already-authenticated visitor who
 * still has none (the login-time call only ever fires once, at login
 * — it can't retroactively cover a returning session); this bridge
 * only ever mirrors state, never mutates Privy's side — see
 * docs/DECISIONS.md.
 */
export function PrivySessionBridge() {
  const { user, isReady, error } = usePrivy();
  const { wallets } = useEmbeddedEthereumWallet();
  const queryClient = useQueryClient();
  const setSession = useAuthStore((state) => state.setSession);
  const clearSession = useAuthStore((state) => state.clearSession);
  const setReady = useAuthStore((state) => state.setReady);
  const setConnecting = useWalletStore((state) => state.setConnecting);
  const setConnected = useWalletStore((state) => state.setConnected);
  const setDisconnected = useWalletStore((state) => state.setDisconnected);
  const setWalletError = useWalletStore((state) => state.setError);
  const previousAddress = useRef<string | null>(null);

  useEffect(() => {
    // Gated on Privy's own `isReady`: before Privy has finished checking
    // for an existing session, `user` is just falsy-by-default, not
    // "confirmed logged out" — syncing `clearSession()` from that would
    // tell `RootNavigator` to show the login gate for an instant even
    // when the person is actually already signed in. See
    // docs/DECISIONS.md ("Hard Login Gate"). Skipped entirely when Privy
    // isn't configured (`PrivyProvider` is still mounted with a blank
    // `appId` in that case, per `AppProviders`' own doc comment) — its
    // `isReady` has no real session to resolve and shouldn't gate
    // anything; `authStore.isReady` flips true immediately so the login
    // gate shows its honest "not configured" state instead of hanging.
    if (!isReady && isPrivyConfigured) return;

    if (user) {
      // Our own backend's `User` record (handle/displayName/avatar)
      // doesn't exist yet — see docs/WALLET.md — so `authStore.user`
      // stays `null`; only `isAuthenticated` reflects the real Privy
      // session. `setSession(null)` still flips `isAuthenticated` true.
      setSession(null);
    } else {
      clearSession();
    }
    setReady();
  }, [isReady, user, setSession, clearSession, setReady]);

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
