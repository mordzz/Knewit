import { useInfiniteQuery } from '@tanstack/react-query';
import { getLeaderboard } from '@/lib/leaderboardService';

/** Web equivalent of `apps/mobile/src/features/leaderboard/hooks/useLeaderboard.ts`
 *  one query, one list: Polymarket's global ranking, no scope. */
export function useLeaderboard() {
  return useInfiniteQuery({
    queryKey: ['leaderboard'],
    queryFn: ({ pageParam }) => getLeaderboard(pageParam),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage) => lastPage.nextCursor ?? undefined,
  });
}
