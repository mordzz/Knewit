import { useInfiniteQuery } from '@tanstack/react-query';
import { getFollowingFeed } from '@/features/home/services/feedService';
import { useAuth } from '@/hooks/useAuth';

/** The "Following" tab  gated on a real session (`canUseApp`: Privy
 * auth). Without one there's no follow graph to
 * resolve, so this never fires a request that could only ever come back
 * empty for that reason. */
export function useFollowingFeed() {
  const { canUseApp } = useAuth();

  return useInfiniteQuery({
    queryKey: ['feed-following'],
    queryFn: ({ pageParam }) => getFollowingFeed(pageParam),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage) => lastPage.nextCursor ?? undefined,
    enabled: canUseApp,
  });
}
