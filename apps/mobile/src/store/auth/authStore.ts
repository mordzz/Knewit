import { create } from 'zustand';
import type { User } from '@/types/social';

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  /** `false` until Privy has finished checking for an existing session
   * on cold start (`usePrivy().isReady`, mirrored here by
   * `PrivySessionBridge`). The root navigator waits for this before
   * deciding "show the login gate" vs "go straight to Main" — deciding
   * from `isAuthenticated` alone, before Privy has actually resolved,
   * would flash the login screen even for an already-logged-in user —
   * see docs/DECISIONS.md ("Hard Login Gate"). */
  isReady: boolean;
  setSession: (user: User | null) => void;
  clearSession: () => void;
  setReady: () => void;
}

/**
 * Session state only — market/social/portfolio data is server state and
 * belongs in TanStack Query, not here — see docs/ARCHITECTURE.md.
 *
 * No `sessionToken` field: that would duplicate Privy's own
 * authoritative session, which the app should always read fresh via
 * Privy's own `getAccessToken()` (see `src/hooks/useAuth.ts`) rather
 * than caching — Privy's own docs recommend against caching this value,
 * and Sprint 6 removed the earlier stub token field for exactly that
 * reason — see docs/DECISIONS.md.
 *
 * `user` is our *own backend's* application-user record (handle,
 * displayName, avatar) — distinct from Privy's own `User` object
 * (identity/linked-accounts only, no social profile fields). No backend
 * exists yet, so this stays `null` even once Privy authentication
 * succeeds — `isAuthenticated` reflects Privy's real auth state
 * independently (see `PrivySessionBridge`), it doesn't require `user`
 * to be populated.
 */
export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isAuthenticated: false,
  isReady: false,
  setSession: (user) => set({ user, isAuthenticated: true }),
  clearSession: () => set({ user: null, isAuthenticated: false }),
  setReady: () => set({ isReady: true }),
}));
