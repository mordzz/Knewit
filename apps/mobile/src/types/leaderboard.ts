import type { User } from '@/types/social';

/**
 * `volume` is the **only** supported metric — see docs/DECISIONS.md
 * ("Leaderboard Metric: Volume, Not PnL"). Realized/Total PnL and ROI
 * would require tracking position closure/settlement outcomes, which
 * this app's data model (`types/market.ts::Position`) doesn't capture
 * yet — using them anyway would be exactly the fabricated-metric
 * failure mode Sprint 10's spec forbids. Kept as a union (not a bare
 * string) so adding a second real, backend-supported metric later is a
 * type-checked change, not a silent string typo.
 */
export type LeaderboardMetricName = 'volume';

export interface LeaderboardMetric {
  name: LeaderboardMetricName;
  /** USD. Always non-negative — volume is a sum of trade sizes, never
   * a signed profit/loss figure (there is no signed metric in this
   * sprint at all). */
  value: number;
}

/**
 * One row of Polymarket's **global** ranking, exactly as the backend
 * returns it — and, by request, nothing else: no scope (Polymarket's global
 * list is the only one), no `isFollowing`/`isSelf` (this app's users and
 * Polymarket's users are different populations, so nothing on this list is
 * a social relationship), and no profile link. `user.id` is Polymarket's
 * own proxy wallet address, used purely as a list key — never a `users` row
 * id, never a `/users/:id` or `/users/:id/follow` target. See
 * docs/DECISIONS.md, "Round 6: Leaderboard Is a Read-Only Polymarket
 * Ranking — No Follow, No Profile Links."
 */
export interface LeaderboardEntry {
  rank: number;
  user: Pick<User, 'id' | 'handle' | 'displayName' | 'avatarUrl'>;
  metric: LeaderboardMetric;
}

/** The authenticated viewer's own live standing in Polymarket's global
 * ranking — the one viewer-relative figure this read still carries, since
 * it describes the viewer's own wallet rather than another ranked trader.
 * `null` when signed out, or when the backend has no reliable rank for them
 * (never a client-computed guess). */
export interface LeaderboardSelf {
  rank: number;
  metric: LeaderboardMetric;
}

export interface LeaderboardPage {
  items: LeaderboardEntry[];
  nextCursor: string | null;
  /** Only meaningful on the first page — see docs/API.md. */
  currentUser: LeaderboardSelf | null;
}
