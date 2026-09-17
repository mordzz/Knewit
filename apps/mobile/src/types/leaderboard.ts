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

/** `global` ranks every user; `following` ranks only accounts the
 * authenticated viewer follows (Sprint 9's real Follow relationships) —
 * see docs/DECISIONS.md. */
export type LeaderboardScope = 'global' | 'following';

/**
 * `isFollowing`/`isSelf` are server-computed and viewer-relative, same
 * pattern as `FeedItem.liked`/`UserProfile.isFollowing` (Sprint 9) — see
 * docs/DECISIONS.md. Carried directly on each row rather than having
 * `LeaderboardUserCard` fetch a full profile per row: a leaderboard page
 * can list dozens of users, and firing one `GET /users/:id` per row
 * would be the exact N+1 request pattern this project's performance
 * guidance warns against.
 */
export interface LeaderboardEntry {
  rank: number;
  user: Pick<User, 'id' | 'handle' | 'displayName' | 'avatarUrl'>;
  metric: LeaderboardMetric;
  isFollowing: boolean;
  isSelf: boolean;
}

/** The authenticated viewer's own rank — `null` when not authenticated
 * or when the backend has no reliable rank for them yet (never a
 * client-computed guess). */
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
