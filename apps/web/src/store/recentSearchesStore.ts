import { create } from 'zustand';

const MAX_RECENTS = 8;

interface RecentSearchesState {
  recent: string[];
  addRecent: (query: string) => void;
  removeRecent: (query: string) => void;
  clearRecent: () => void;
}

/**
 * Copied verbatim from `apps/mobile/src/store/search/recentSearchesStore.ts`
 *  genuinely client-only session state (a list of past search
 * strings), in-memory only (no persistence), same as mobile.
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
