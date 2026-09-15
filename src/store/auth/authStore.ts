import { create } from 'zustand';
import type { User } from '@/types/social';

interface AuthState {
  user: User | null;
  sessionToken: string | null;
  isAuthenticated: boolean;
  setSession: (user: User, sessionToken: string) => void;
  clearSession: () => void;
}

/**
 * Session state only. Market/social/portfolio data is server state and
 * belongs in TanStack Query, not here — see docs/ARCHITECTURE.md.
 *
 * `sessionToken` is read outside React (by the API client, via
 * `useAuthStore.getState()`) to attach the Authorization header. Not
 * populated yet — no auth backend exists — see docs/API.md.
 */
export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  sessionToken: null,
  isAuthenticated: false,
  setSession: (user, sessionToken) => set({ user, sessionToken, isAuthenticated: true }),
  clearSession: () => set({ user: null, sessionToken: null, isAuthenticated: false }),
}));
