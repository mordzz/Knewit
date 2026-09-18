import type { UserProfile } from '@/types/social';

/**
 * DEVELOPMENT-ONLY — see `home/fixtures/feed.mock.ts` for the same
 * rationale. `isFollowing` is always `false` (no real session to
 * compute it against in mock mode). `isSelf` is `true` only for the
 * literal `"me"` id — the one case mock mode *can* honestly answer,
 * since `"me"` always means "the caller," by definition, with no
 * session needed to know it. `tradingVolume` is always `null` — no
 * fabricated performance data, same rule as
 * Sprint 10's leaderboard mock fallback.
 */
export function buildMockUserProfile(userId: string): UserProfile {
  const isSelf = userId === 'me';
  return {
    id: isSelf ? 'mock-me' : userId,
    handle: isSelf ? 'you' : userId,
    displayName: isSelf ? 'You' : `User ${userId}`,
    avatarUrl: null,
    walletAddress: null,
    bio: null,
    bannerUrl: null,
    followerCount: 0,
    followingCount: 0,
    callCount: 0,
    isFollowing: false,
    isSelf,
    tradingVolume: null,
  };
}
