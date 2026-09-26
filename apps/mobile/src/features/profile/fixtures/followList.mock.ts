import type { FollowListItem } from '@/types/social';

/** DEVELOPMENT-ONLY  see `home/fixtures/feed.mock.ts`. `isFollowing`/
 * `isSelf` are always `false`: no real session to compute either
 * against in mock mode. */
const MOCK_TOTAL = 12;

function hashString(value: string): number {
  let hash = 0;
  for (let i = 0; i < value.length; i += 1) {
    hash = (hash * 31 + value.charCodeAt(i)) | 0;
  }
  return Math.abs(hash);
}

export function buildMockFollowList(userId: string, cursor?: string): FollowListItem[] {
  const start = cursor ? Number(cursor) : 0;
  const seed = hashString(userId);

  return Array.from({ length: Math.min(6, MOCK_TOTAL - start) }, (_, index) => {
    const globalIndex = start + index;
    const id = `mock-follow-${seed}-${globalIndex}`;
    return {
      user: {
        id,
        handle: `user${globalIndex}`,
        displayName: `User ${globalIndex}`,
        avatarUrl: null,
      },
      isFollowing: false,
      isSelf: false,
    };
  });
}

export const MOCK_FOLLOW_LIST_TOTAL = MOCK_TOTAL;
