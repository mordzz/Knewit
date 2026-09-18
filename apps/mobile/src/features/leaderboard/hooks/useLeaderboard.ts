import { useInfiniteQuery } from '@tanstack/react-query';
import { getLeaderboard } from '@/features/leaderboard/services/leaderboardService';

/**
 * One query, one list: Polymarket's global ranking. No scope argument and
 * no auth gate — the ranking is a public, viewer-independent read with no
 * viewer-relative fields at all (the old `currentUser`/"Your Rank" self
 * standing was removed; docs/DECISIONS.md, "Your Rank Removed From the
 * Leaderboard").
 */
export function useLeaderboard() {
  return useInfiniteQuery({
    queryKey: ['leaderboard'],
    queryFn: ({ pageParam }) => getLeaderboard(pageParam),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage) => lastPage.nextCursor ?? undefined,
  });
}
