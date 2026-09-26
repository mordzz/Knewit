import { useInfiniteQuery } from '@tanstack/react-query';
import { getFeed } from '@/features/home/services/feedService';

/**
 * Screen → useHomeFeed → feedService → apiRequest → backend  see
 * docs/ARCHITECTURE.md. Server state only; nothing here belongs in
 * Zustand.
 */
export function useHomeFeed() {
  return useInfiniteQuery({
    queryKey: ['feed', 'trending'],
    queryFn: ({ pageParam }) => getFeed(pageParam, 'trending'),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage) => lastPage.nextCursor ?? undefined,
  });
}
