import { getAccessToken as getPrivyAccessToken } from '@privy-io/expo';
import { useAuthStore } from '@/store/auth/authStore';
import { useGuestStore } from '@/store/guest/guestStore';
import { isPrivyConfigured } from '@/app/config/env';

/**
 * Thin, stable hook wrapper around authStore so screens don't import the
 * store directly. `isAuthenticated`/`user`/`isReady` are kept in sync
 * with Privy's real auth state by `PrivySessionBridge` — see
 * docs/WALLET.md. `isReady` is what `RootNavigator` waits on before
 * deciding between the login gate and Main — see docs/DECISIONS.md
 * ("Hard Login Gate").
 *
 * `isGuest`/`hasHydrated` come from `guestStore` instead: a guest is
 * deliberately **not** `isAuthenticated` (that field stays "Privy says
 * so"), so `canUseApp` is the one flag screens should use for "this
 * person may use the app" gating. Guest requests never reach the real
 * backend — see `services/api/client.ts`.
 */
export function useAuth() {
  const user = useAuthStore((state) => state.user);
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const isReady = useAuthStore((state) => state.isReady);
  const setSession = useAuthStore((state) => state.setSession);
  const clearSession = useAuthStore((state) => state.clearSession);
  const isGuest = useGuestStore((state) => state.isGuest);
  const hasHydrated = useGuestStore((state) => state.hasHydrated);

  return {
    user,
    isAuthenticated,
    isGuest,
    hasHydrated,
    canUseApp: isAuthenticated || isGuest,
    isReady,
    setSession,
    clearSession,
  };
}

/**
 * For non-React call sites (the API client) that need the current
 * session token without subscribing to store updates. Reads fresh from
 * Privy every call rather than caching — Privy's own docs recommend
 * this exact pattern ("call anytime a token is needed, don't cache the
 * response"), and it means no session token is ever duplicated into
 * Zustand — see docs/DECISIONS.md.
 *
 * `getAccessToken` (Privy's top-level export) is documented as
 * deprecated in favor of a `client.getAccessToken()` instance method,
 * but remains the supported way to reach a token from outside a
 * component tree when the app only ever mounts one implicit
 * `PrivyProvider` (this app's case) — see docs/WALLET.md. Returns
 * `null` (never throws past this boundary) when Privy isn't configured
 * or there's no active session, so a missing token degrades to an
 * unauthenticated request rather than failing the whole call.
 */
export async function getSessionToken(): Promise<string | null> {
  if (!isPrivyConfigured) return null;
  try {
    return await getPrivyAccessToken();
  } catch {
    return null;
  }
}
