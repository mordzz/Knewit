import type { ActivityItem } from '@/types/activity';

/** DEVELOPMENT-ONLY — cycles through one of each real, supported
 * `ActivityType` (see docs/DECISIONS.md, "Activity Types Limited to
 * What This App Can Actually Produce") so every rendered variant is
 * exercisable in dev without a backend. */
const MOCK_TOTAL = 9;

function hashString(value: string): number {
  let hash = 0;
  for (let i = 0; i < value.length; i += 1) {
    hash = (hash * 31 + value.charCodeAt(i)) | 0;
  }
  return Math.abs(hash);
}

/**
 * Returns a full `ActivityItem` directly (rather than an
 * `Omit<ActivityItem, 'id'|'createdAt'>` merged in afterward) —
 * `Omit`/`keyof` over a discriminated union collapses to only the
 * fields every member shares, which silently loses each variant's own
 * fields and made every case here a type error. Passing `id`/`createdAt`
 * straight through avoids that entirely.
 */
function buildTemplate(index: number, userId: string, id: string, createdAt: string): ActivityItem {
  switch (index % 4) {
    case 0:
      return {
        id,
        createdAt,
        type: 'TRADE',
        marketId: `mock-market-${userId}`,
        marketQuestion: 'Will BTC reach $120K by end of 2026?',
        outcome: 'YES',
        usdAmount: 25,
      };
    case 1:
      return {
        id,
        createdAt,
        type: 'CALL',
        postId: `mock-post-${userId}-${index}`,
        marketQuestion: 'Will the incumbent win the runoff election?',
        outcome: 'NO',
      };
    case 2:
      return { id, createdAt, type: 'POST', postId: `mock-post-${userId}-${index}` };
    default:
      return {
        id,
        createdAt,
        type: 'FOLLOW',
        followedUser: {
          id: `mock-user-${index}`,
          displayName: `User ${index}`,
          handle: `user${index}`,
        },
      };
  }
}

export function buildMockActivity(userId: string, cursor?: string): ActivityItem[] {
  const start = cursor ? Number(cursor) : 0;
  const seed = hashString(userId);

  return Array.from({ length: Math.min(4, MOCK_TOTAL - start) }, (_, index) => {
    const globalIndex = start + index;
    const id = `mock-activity-${userId}-${globalIndex}`;
    const createdAt = new Date(Date.now() - (globalIndex + 1) * 3_600_000).toISOString();
    return buildTemplate(seed + globalIndex, userId, id, createdAt);
  });
}

export const MOCK_ACTIVITY_TOTAL = MOCK_TOTAL;
