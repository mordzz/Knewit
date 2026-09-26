import { create } from 'zustand';

const MAX_RECENTS = 8;

interface RecentSearchesState {
  recent: string[];
  addRecent: (query: string) => void;
  /** Removes one past search  case-insensitive match, same rule
   * `addRecent`'s de-dupe already uses. */
  removeRecent: (query: string) => void;
  clearRecent: () => void;
}

/**
 * Genuinely client-only session state (a list of past search strings),
 * not search *results*  those stay in TanStack Query per
 * docs/DECISIONS.md (Sprint 4). In-memory only: no `AsyncStorage` (or
 * similar) dependency was added to persist this across app restarts,
 * since nothing in this app persists local state that way yet  a
 * deliberate simplification, not an oversight; see docs/DECISIONS.md.
 */
export const useRecentSearchesStore = create<RecentSearchesState>((set) => ({
  recent: [],
  addRecent: (query) =>
    set((state) => {
      const trimmed = query.trim();
      if (!trimmed) return state;

      const deduped = [
        trimmed,
        ...state.recent.filter((existing) => existing.toLowerCase() !== trimmed.toLowerCase()),
      ];
      return { recent: deduped.slice(0, MAX_RECENTS) };
    }),
  removeRecent: (query) =>
    set((state) => ({
      recent: state.recent.filter((existing) => existing.toLowerCase() !== query.toLowerCase()),
    })),
  clearRecent: () => set({ recent: [] }),
}));
