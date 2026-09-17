import type { User } from '@/types/social';

/** Mirrors `apps/frontend/src/types/leaderboard.ts` exactly. */
export type LeaderboardMetricName = 'volume';

export interface LeaderboardMetric {
  name: LeaderboardMetricName;
  value: number;
}

export type LeaderboardScope = 'global' | 'following';

export interface LeaderboardEntry {
  rank: number;
  user: Pick<User, 'id' | 'handle' | 'displayName' | 'avatarUrl'>;
  metric: LeaderboardMetric;
  isFollowing: boolean;
  isSelf: boolean;
}

export interface LeaderboardSelf {
  rank: number;
  metric: LeaderboardMetric;
}

export interface LeaderboardPage {
  items: LeaderboardEntry[];
  nextCursor: string | null;
  currentUser: LeaderboardSelf | null;
}
