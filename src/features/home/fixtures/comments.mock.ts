import type { CommentItem } from '@/types/social';

/**
 * DEVELOPMENT-ONLY fixture data — see `feed.mock.ts` for the same
 * pattern/rationale. `canDelete` is always `false`: there is no real
 * authenticated session to compare against in mock mode, so nothing is
 * honestly deletable — see docs/DECISIONS.md.
 */
const AUTHORS = [
  {
    id: 'user-priya',
    handle: 'priya.eth',
    displayName: 'Priya',
    avatarUrl: null,
    walletAddress: null,
  },
  { id: 'user-sam', handle: 'sam_bets', displayName: 'Sam', avatarUrl: null, walletAddress: null },
  {
    id: 'user-noah',
    handle: 'noahwatches',
    displayName: 'Noah',
    avatarUrl: null,
    walletAddress: null,
  },
] as const;

const BODIES = [
  'Great call, I agree with this take.',
  "Not so sure — the volume doesn't support this yet.",
  'This aged well already.',
  "What's your reasoning on the timeline here?",
];

function hashString(value: string): number {
  let hash = 0;
  for (let i = 0; i < value.length; i += 1) {
    hash = (hash * 31 + value.charCodeAt(i)) | 0;
  }
  return Math.abs(hash);
}

const MOCK_TOTAL = 14;

/** Deterministic per-`postId` page of mock comments, oldest-safe cursor
 * pagination matching the real `Paginated<CommentItem>` contract. */
export function buildMockComments(postId: string, cursor?: string): CommentItem[] {
  const start = cursor ? Number(cursor) : 0;
  const seed = hashString(postId);

  return Array.from({ length: Math.min(5, MOCK_TOTAL - start) }, (_, index) => {
    const globalIndex = start + index;
    const author = AUTHORS[(seed + globalIndex) % AUTHORS.length];
    return {
      id: `mock-comment-${postId}-${globalIndex}`,
      postId,
      author,
      body: BODIES[(seed + globalIndex) % BODIES.length],
      createdAt: new Date(Date.now() - (globalIndex + 1) * 20 * 60_000).toISOString(),
      canDelete: false,
    };
  });
}

export const MOCK_COMMENT_TOTAL = MOCK_TOTAL;
