import { useAuthStore } from '@/store/auth/authStore';

/**
 * Thin, stable hook wrapper around authStore so screens don't import the
 * store directly. Session content (Privy-backed) isn't wired yet — see
 * docs/WALLET.md — but the shape is stable for future feature code.
 */
export function useAuth() {
  const user = useAuthStore((state) => state.user);
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const setSession = useAuthStore((state) => state.setSession);
  const clearSession = useAuthStore((state) => state.clearSession);

  return { user, isAuthenticated, setSession, clearSession };
}

/** For non-React call sites (e.g. the API client) that need the current
 * session token without subscribing to store updates. */
export function getSessionToken(): string | null {
  return useAuthStore.getState().sessionToken;
}
