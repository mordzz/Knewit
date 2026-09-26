import { useInfiniteQuery } from '@tanstack/react-query';
import { getMarkets } from '@/features/markets/lib/marketService';

/** Web equivalent of `apps/mobile/src/features/markets/hooks/useMarkets.ts`
 *  re-queries when `category` changes (part of the query key). */
export function useMarkets(category: string) {
  return useInfiniteQuery({
    queryKey: ['markets', category],
    queryFn: ({ pageParam }) => getMarkets(pageParam, category),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage) => lastPage.nextCursor ?? undefined,
  });
}
