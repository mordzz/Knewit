import type { User } from '@/types/social';

/** Mirrors `apps/frontend/src/types/leaderboard.ts` exactly. */
export type LeaderboardMetricName = 'volume';

export interface LeaderboardMetric {
  name: LeaderboardMetricName;
  value: number;
}

/**
 * One row of Polymarket's **global** ranking, exactly as Polymarket
 * publishes it (see `lib/polymarket/dataApiClient.ts`).
 *
 * Carries no viewer-relative fields and no Knewit identity: this app's
 * users and Polymarket's users are two different populations
 * (docs/DECISIONS.md, "Round 6: Leaderboard Is a Read-Only Polymarket
 * Ranking — No Follow, No Profile Links"), so a row here is a ranked
 * Polymarket trader — not a profile this app can open, and not an account
 * anyone can follow. `user.id` is Polymarket's own `proxyWallet`, used
 * purely as a list key; it is never a `users` row id and never a
 * `/users/:id` or `/users/:id/follow` target.
 */
export interface LeaderboardEntry {
  rank: number;
  user: Pick<User, 'id' | 'handle' | 'displayName' | 'avatarUrl'>;
  metric: LeaderboardMetric;
}

/** The caller's own live standing in Polymarket's global ranking. The one
 * viewer-relative figure this read still carries — it describes *the
 * viewer's own wallet*, not another ranked trader — and it renders as the
 * separate "Your rank" line, never as a row of the ranking. */
export interface LeaderboardSelf {
  rank: number;
  metric: LeaderboardMetric;
}

export interface LeaderboardPage {
  items: LeaderboardEntry[];
  nextCursor: string | null;
  currentUser: LeaderboardSelf | null;
}
