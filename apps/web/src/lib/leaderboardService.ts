import { apiRequest } from '@/lib/apiClient';
import type { LeaderboardPage } from '@/types/leaderboard';

/** Web equivalent of `apps/mobile/src/features/leaderboard/services/leaderboardService.ts`
 *  Polymarket's own global ranking, no scope parameter. */
export async function getLeaderboard(cursor?: string): Promise<LeaderboardPage> {
  const params = new URLSearchParams();
  if (cursor) params.set('cursor', cursor);
  const query = params.toString();
  return apiRequest<LeaderboardPage>(`/api/leaderboard${query ? `?${query}` : ''}`);
}
