import { apiRequest } from '@/services/api/client';
import { endpoints } from '@/services/api/endpoints';
import { env } from '@/app/config/env';
import type { LeaderboardPage } from '@/types/leaderboard';

/**
 * **No scope parameter**: this is Polymarket's own *global* ranking and the
 * only list it publishes, so there is nothing to scope by — the old
 * `following` scope is gone along with the Follow button on the leaderboard
 * (docs/DECISIONS.md, "Round 6: Leaderboard Is a Read-Only Polymarket
 * Ranking — No Follow, No Profile Links").
 *
 * **No dev-mock fallback with fabricated rankings** — unlike most other
 * read-only services in this codebase (`marketService`, `feedService`),
 * which fall back to plausible-but-clearly-fictional fixture content.
 * A ranking/volume figure looks exactly like real trading performance
 * data, and Sprint 10's spec repeats "never fabricate a metric" more
 * insistently than any other sprint — inventing rankings here, even
 * dev-only and logged, risks being mistaken for (or screenshotted as)
 * real community performance. On failure, this returns an honestly
 * empty page instead — same treatment as `positionService.ts` in
 * Sprint 7, for the same reason (both are trading-performance data, not
 * social flavor text) — see docs/DECISIONS.md.
 */
export async function getLeaderboard(cursor?: string): Promise<LeaderboardPage> {
  const params = new URLSearchParams();
  if (cursor) params.set('cursor', cursor);
  const query = params.toString();

  try {
    return await apiRequest<LeaderboardPage>(`${endpoints.leaderboard}${query ? `?${query}` : ''}`);
  } catch (error) {
    if (env.isDev) {
      console.warn(
        '[leaderboardService] backend unreachable — returning no ranking data (never fabricated) for development only.',
        error
      );
      return { items: [], nextCursor: null, currentUser: null };
    }
    throw error;
  }
}
