import { useInfiniteQuery } from '@tanstack/react-query';
import { getFeed } from '@/lib/feedService';

/** Web equivalent of `apps/mobile/src/features/home/hooks/useHomeFeed.ts`. */
export function useHomeFeed(sort: 'trending' | 'latest' = 'trending') {
  return useInfiniteQuery({
    queryKey: ['feed', sort],
    queryFn: ({ pageParam }) => getFeed(pageParam, sort),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage) => lastPage.nextCursor ?? undefined,
  });
}
