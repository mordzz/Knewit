import { useInfiniteQuery } from '@tanstack/react-query';
import { usePrivy } from '@privy-io/react-auth';
import { getFollowingFeed } from '@/lib/feedService';

/** Web equivalent of `apps/mobile/src/features/home/hooks/useFollowingFeed.ts`
 * — gated on real authentication, same as mobile's `useAuth().isAuthenticated`
 * check (`usePrivy().authenticated` is this app's web equivalent). */
export function useFollowingFeed() {
  const { authenticated } = usePrivy();

  return useInfiniteQuery({
    queryKey: ['feed-following'],
    queryFn: ({ pageParam }) => getFollowingFeed(pageParam),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage) => lastPage.nextCursor ?? undefined,
    enabled: authenticated,
  });
}
