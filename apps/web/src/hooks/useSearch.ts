import { useQuery } from '@tanstack/react-query';
import { search } from '@/lib/searchService';

/** Below this, a query is "still typing," not a search to run. */
export const MIN_QUERY_LENGTH = 2;

/** Web equivalent of `apps/mobile/src/features/search/hooks/useSearch.ts`
 * — callers are expected to pass an already-debounced query. */
export function useSearch(query: string) {
  const trimmed = query.trim();

  return useQuery({
    queryKey: ['search', trimmed],
    queryFn: () => search(trimmed),
    enabled: trimmed.length >= MIN_QUERY_LENGTH,
  });
}
