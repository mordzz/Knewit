import { useInfiniteQuery } from '@tanstack/react-query';
import { getMarkets } from '@/features/markets/services/marketService';

/**
 * Screen → useMarkets → marketService → apiRequest → backend — see
 * docs/ARCHITECTURE.md. Server state only; nothing here belongs in
 * Zustand. Re-queries when `category` changes (part of the query key).
 */
export function useMarkets(category: string) {
  return useInfiniteQuery({
    queryKey: ['markets', category],
    queryFn: ({ pageParam }) => getMarkets(pageParam, category),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage) => lastPage.nextCursor ?? undefined,
  });
}
