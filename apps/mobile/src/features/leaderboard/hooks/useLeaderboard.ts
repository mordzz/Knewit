import { useInfiniteQuery } from '@tanstack/react-query';
import { getLeaderboard } from '@/features/leaderboard/services/leaderboardService';
import { useAuth } from '@/hooks/useAuth';
import type { LeaderboardScope } from '@/types/leaderboard';

/** `following` scope needs a real authenticated identity to resolve
 * "who do I follow" — gated the same way Sprint 7/9's viewer-relative
 * queries are, rather than firing a request that could only ever come
 * back empty for that reason. `global` is public, always enabled. */
export function useLeaderboard(scope: LeaderboardScope) {
  const { isAuthenticated } = useAuth();

  return useInfiniteQuery({
    queryKey: ['leaderboard', scope],
    queryFn: ({ pageParam }) => getLeaderboard(scope, pageParam),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage) => lastPage.nextCursor ?? undefined,
    enabled: scope === 'global' || isAuthenticated,
  });
}
