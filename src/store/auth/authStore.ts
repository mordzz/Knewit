import { create } from 'zustand';
import type { User } from '@/types/social';

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  setSession: (user: User) => void;
  clearSession: () => void;
}

/**
 * Session state only. Market/social/portfolio data is server state and
 * belongs in TanStack Query, not here — see docs/ARCHITECTURE.md.
 */
export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isAuthenticated: false,
  setSession: (user) => set({ user, isAuthenticated: true }),
  clearSession: () => set({ user: null, isAuthenticated: false }),
}));
