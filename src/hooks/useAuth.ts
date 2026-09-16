import { getAccessToken as getPrivyAccessToken } from '@privy-io/expo';
import { useAuthStore } from '@/store/auth/authStore';
import { isPrivyConfigured } from '@/app/config/env';

/**
 * Thin, stable hook wrapper around authStore so screens don't import the
 * store directly. `isAuthenticated`/`user` are kept in sync with Privy's
 * real auth state by `PrivySessionBridge` — see docs/WALLET.md.
 */
export function useAuth() {
  const user = useAuthStore((state) => state.user);
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const setSession = useAuthStore((state) => state.setSession);
  const clearSession = useAuthStore((state) => state.clearSession);

  return { user, isAuthenticated, setSession, clearSession };
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
