import { useQuery } from '@tanstack/react-query';
import { search } from '@/features/search/services/searchService';

/** Below this, a query is treated as "still typing," not a search to
 * run  avoids firing a request (and rendering "no results") for a
 * single stray keystroke. */
export const MIN_QUERY_LENGTH = 2;

/**
 * Screen → useSearch → searchService → apiRequest → backend  see
 * docs/ARCHITECTURE.md. Server state only; nothing here belongs in
 * Zustand. Callers are expected to pass an already-debounced query
 * this hook itself doesn't debounce, so the same debounced value can
 * also gate the "still typing" UI without a second timer.
 */
export function useSearch(query: string) {
  const trimmed = query.trim();

  return useQuery({
    queryKey: ['search', trimmed],
    queryFn: () => search(trimmed),
    enabled: trimmed.length >= MIN_QUERY_LENGTH,
  });
}
