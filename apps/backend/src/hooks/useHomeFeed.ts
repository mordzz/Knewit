import { useInfiniteQuery } from '@tanstack/react-query';
import { getFeed } from '@/lib/feedService';

/** Web equivalent of `apps/mobile/src/features/home/hooks/useHomeFeed.ts`. */
export function useHomeFeed() {
  return useInfiniteQuery({
    queryKey: ['feed'],
    queryFn: ({ pageParam }) => getFeed(pageParam),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage) => lastPage.nextCursor ?? undefined,
  });
}
