import { getAccessToken as getPrivyAccessToken } from '@privy-io/expo';
import { useAuthStore } from '@/store/auth/authStore';
import { isPrivyConfigured } from '@/app/config/env';

/**
 * Thin, stable hook wrapper around authStore so screens don't import the
 * store directly. `isAuthenticated`/`user`/`isReady` are kept in sync
 * with Privy's real auth state by `PrivySessionBridge` — see
 * docs/WALLET.md. `isReady` is what `RootNavigator` waits on before
 * deciding between the login gate and Main — see docs/DECISIONS.md
 * ("Hard Login Gate").
 *
 * `canUseApp` mirrors the authenticated Privy state and is the stable
 * flag screens use when deciding whether the person may use the app.
 */
export function useAuth() {
  const user = useAuthStore((state) => state.user);
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const isReady = useAuthStore((state) => state.isReady);
  const setSession = useAuthStore((state) => state.setSession);
  const clearSession = useAuthStore((state) => state.clearSession);

  return {
    user,
    isAuthenticated,
    canUseApp: isAuthenticated,
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
const TOKEN_TIMEOUT_MS = 10_000;

export async function getSessionToken(): Promise<string | null> {
  if (!isPrivyConfigured) return null;
  let timer: ReturnType<typeof setTimeout> | undefined;
  try {
    // A session refresh that never settles (e.g. right after a cold
    // start) would otherwise block every API request behind it.
    return await Promise.race([
      getPrivyAccessToken(),
      new Promise<null>((resolve) => {
        timer = setTimeout(() => resolve(null), TOKEN_TIMEOUT_MS);
      }),
    ]);
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
  }
}
