import { useInfiniteQuery } from '@tanstack/react-query';
import { getFollowingFeed } from '@/lib/feedService';
import { useSession } from '@/hooks/useSession';

/** Web equivalent of `apps/mobile/src/features/home/hooks/useFollowingFeed.ts`
 *  gated on an authenticated Privy session. */
export function useFollowingFeed() {
  const { canUseApp } = useSession();

  return useInfiniteQuery({
    queryKey: ['feed-following'],
    queryFn: ({ pageParam }) => getFollowingFeed(pageParam),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage) => lastPage.nextCursor ?? undefined,
    enabled: canUseApp,
  });
}
