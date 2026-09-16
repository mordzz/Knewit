import { useInfiniteQuery } from '@tanstack/react-query';
import { getFollowingFeed } from '@/features/home/services/feedService';
import { useAuth } from '@/hooks/useAuth';

/** The "Following" tab — gated on real authentication, same reasoning
 * as Sprint 7/9's other viewer-relative queries: without a real
 * session there's no follow graph to resolve, so this never fires a
 * request that could only ever come back empty for that reason. */
export function useFollowingFeed() {
  const { isAuthenticated } = useAuth();

  return useInfiniteQuery({
    queryKey: ['feed-following'],
    queryFn: ({ pageParam }) => getFollowingFeed(pageParam),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage) => lastPage.nextCursor ?? undefined,
    enabled: isAuthenticated,
  });
}
