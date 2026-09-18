import type { CommentItem } from '@/types/social';

/**
 * DEVELOPMENT-ONLY fixture data — see `feed.mock.ts` for the same
 * pattern/rationale. `canDelete` is always `false`: there is no real
 * authenticated session to compare against in mock mode, so nothing is
 * honestly deletable — see docs/DECISIONS.md. `liked` is always `false`
 * for the same reason (no session to be "liked by").
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

const REPLY_BODIES = [
  'Same — watching this one closely too.',
  'Source? Genuinely curious.',
  "That's fair, hadn't thought about it that way.",
  'Yeah the timing lines up.',
];

function hashString(value: string): number {
  let hash = 0;
  for (let i = 0; i < value.length; i += 1) {
    hash = (hash * 31 + value.charCodeAt(i)) | 0;
  }
  return Math.abs(hash);
}

const MOCK_TOTAL = 14;
const MOCK_REPLY_TOTAL = 3;

/** Deterministic per-`postId` page of mock top-level comments,
 * oldest-safe cursor pagination matching the real `Paginated<CommentItem>`
 * contract. Every third comment has a couple of mock replies, so the
 * thread-expand UI has something to show without a real backend. */
export function buildMockComments(postId: string, cursor?: string): CommentItem[] {
  const start = cursor ? Number(cursor) : 0;
  const seed = hashString(postId);

  return Array.from({ length: Math.min(5, MOCK_TOTAL - start) }, (_, index) => {
    const globalIndex = start + index;
    const author = AUTHORS[(seed + globalIndex) % AUTHORS.length];
    const id = `mock-comment-${postId}-${globalIndex}`;
    return {
      id,
      postId,
      author,
      body: BODIES[(seed + globalIndex) % BODIES.length],
      createdAt: new Date(Date.now() - (globalIndex + 1) * 20 * 60_000).toISOString(),
      canDelete: false,
      liked: false,
      likeCount: (seed + globalIndex * 7) % 23,
      shareCount: (seed + globalIndex * 3) % 9,
      replyCount: globalIndex % 3 === 0 ? MOCK_REPLY_TOTAL : 0,
      parentCommentId: null,
    };
  });
}

/** Deterministic mock replies for one top-level comment — see
 * `buildMockComments`'s `replyCount`, which this must stay consistent
 * with (`MOCK_REPLY_TOTAL` total, paginated 2 at a time). */
export function buildMockReplies(
  commentId: string,
  postId: string,
  cursor?: string
): CommentItem[] {
  const start = cursor ? Number(cursor) : 0;
  const seed = hashString(commentId);

  return Array.from({ length: Math.min(2, MOCK_REPLY_TOTAL - start) }, (_, index) => {
    const globalIndex = start + index;
    const author = AUTHORS[(seed + globalIndex + 1) % AUTHORS.length];
    return {
      id: `mock-reply-${commentId}-${globalIndex}`,
      postId,
      author,
      body: REPLY_BODIES[(seed + globalIndex) % REPLY_BODIES.length],
      createdAt: new Date(Date.now() - globalIndex * 5 * 60_000).toISOString(),
      canDelete: false,
      liked: false,
      likeCount: (seed + globalIndex * 5) % 11,
      shareCount: (seed + globalIndex * 2) % 4,
      replyCount: 0,
      parentCommentId: commentId,
    };
  });
}

const MOCK_USER_REPLIES_PAGE_SIZE = 3;
const MOCK_USER_REPLIES_TOTAL = 6;
/** Matches the id pattern `feed.mock.ts::buildMockFeed` generates
 * (`mock-0`, `mock-1`, …) so a mock reply's "view post" link opens a
 * real mock post via `postService.ts::getPostById` -> `pickMockFeedItem`,
 * instead of a dead id no fixture recognizes. */
const MOCK_TARGET_POST_COUNT = 5;

/** Dev-mock fallback for Profile's Replies tab
 * (`commentService.ts::getUserReplies`) — same author-reassignment
 * trick `feed.mock.ts::buildMockUserContent` uses for Posts/Calls, so
 * the mock content visibly belongs to whichever profile is being
 * viewed rather than one of the fixed sample authors above. */
export function buildMockUserReplies(userId: string, cursor?: string): CommentItem[] {
  const start = cursor ? Number(cursor) : 0;
  const author = {
    id: userId,
    handle: userId === 'me' ? 'you' : userId,
    displayName: userId === 'me' ? 'You' : `User ${userId}`,
    avatarUrl: null,
    walletAddress: null,
  };

  return Array.from(
    { length: Math.min(MOCK_USER_REPLIES_PAGE_SIZE, MOCK_USER_REPLIES_TOTAL - start) },
    (_, index) => {
      const globalIndex = start + index;
      return {
        id: `mock-reply-${userId}-${globalIndex}`,
        postId: `mock-${globalIndex % MOCK_TARGET_POST_COUNT}`,
        author,
        body: REPLY_BODIES[globalIndex % REPLY_BODIES.length],
        createdAt: new Date(Date.now() - (globalIndex + 1) * 45 * 60_000).toISOString(),
        canDelete: userId === 'me',
        liked: false,
        likeCount: (globalIndex * 3) % 17,
        shareCount: 0,
        replyCount: 0,
        parentCommentId: null,
      };
    }
  );
}

export function mockUserRepliesTotal(): number {
  return MOCK_USER_REPLIES_TOTAL;
}

export const MOCK_COMMENT_TOTAL = MOCK_TOTAL;
export const MOCK_REPLY_COMMENT_TOTAL = MOCK_REPLY_TOTAL;
