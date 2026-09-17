import { useInfiniteQuery } from '@tanstack/react-query';
import { getLeaderboard } from '@/features/leaderboard/services/leaderboardService';

/**
 * One query, one list: Polymarket's global ranking. No scope argument and
 * no auth gate — the ranking is a public, viewer-independent read, and the
 * only viewer-relative field (`currentUser`, the viewer's own standing) is
 * simply absent when the caller is signed out or unranked
 * (docs/DECISIONS.md, "Round 6: Leaderboard Is a Read-Only Polymarket
 * Ranking — No Follow, No Profile Links").
 */
export function useLeaderboard() {
  return useInfiniteQuery({
    queryKey: ['leaderboard'],
    queryFn: ({ pageParam }) => getLeaderboard(pageParam),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage) => lastPage.nextCursor ?? undefined,
  });
}
