import type { FeedItem } from '@/types/social';

/**
 * DEVELOPMENT-ONLY fixture data. Used solely as a local fallback by
 * `feedService` when the real `/feed` backend is unreachable (no backend
 * exists yet — see docs/API.md). Never presented as real user/trading
 * data, and never imported by production service logic directly — see
 * docs/DECISIONS.md.
 */
const AUTHORS = {
  jordan: {
    id: 'user-jordan',
    handle: 'jordan_p',
    displayName: 'Jordan P',
    avatarUrl: null,
    walletAddress: null,
  },
  maya: {
    id: 'user-maya',
    handle: 'maya.k',
    displayName: 'Maya K',
    avatarUrl: null,
    walletAddress: null,
  },
  theo: {
    id: 'user-theo',
    handle: 'theotrades',
    displayName: 'Theo',
    avatarUrl: null,
    walletAddress: null,
  },
  aria: {
    id: 'user-aria',
    handle: 'aria_watches',
    displayName: 'Aria',
    avatarUrl: null,
    walletAddress: null,
  },
} as const;

const MARKETS = {
  btc120k: {
    id: 'market-btc-120k',
    question: 'Will BTC reach $120K by end of 2026?',
    category: 'Crypto',
    yesPrice: 57,
    noPrice: 43,
    volume: 482_000,
    endDate: '2026-12-31T00:00:00.000Z',
  },
  election: {
    id: 'market-election-runoff',
    question: 'Will the incumbent win the runoff election?',
    category: 'Politics',
    yesPrice: 34,
    noPrice: 66,
    volume: 1_240_000,
    endDate: '2026-11-03T00:00:00.000Z',
  },
  finals: {
    id: 'market-finals-mvp',
    question: 'Will the reigning MVP repeat this season?',
    category: 'Sports',
    yesPrice: 48,
    noPrice: 52,
    volume: 96_000,
    endDate: '2027-06-15T00:00:00.000Z',
  },
} as const;

const BASE_ITEMS: Omit<FeedItem, 'id' | 'createdAt'>[] = [
  {
    author: AUTHORS.jordan,
    body: 'BTC is going to break $120K before the year is out. Feels obvious at this point.',
    market: MARKETS.btc120k,
    positionSnapshot: {
      marketId: MARKETS.btc120k.id,
      outcome: 'YES',
      entryPrice: 42,
      size: 12.5,
      capturedAt: '2026-08-20T10:00:00.000Z',
    },
    likeCount: 24,
    commentCount: 8,
    liked: false,
  },
  {
    author: AUTHORS.maya,
    body: "This market looks interesting but I'm not ready to take a position yet — watching the volume.",
    market: null,
    positionSnapshot: null,
    likeCount: 3,
    commentCount: 1,
    liked: false,
  },
  {
    author: AUTHORS.theo,
    body: 'Betting against the incumbent here. Polling momentum has clearly shifted.',
    market: MARKETS.election,
    positionSnapshot: {
      marketId: MARKETS.election.id,
      outcome: 'NO',
      entryPrice: 71,
      size: 40,
      capturedAt: '2026-09-01T09:30:00.000Z',
    },
    likeCount: 56,
    commentCount: 19,
    liked: false,
  },
  {
    author: AUTHORS.aria,
    body: 'Volume on the election runoff market has tripled this week — worth a look.',
    market: MARKETS.election,
    positionSnapshot: null,
    likeCount: 11,
    commentCount: 4,
    liked: false,
  },
  {
    author: AUTHORS.jordan,
    body: 'Taking YES on the MVP repeat — form has been undeniable all season.',
    market: MARKETS.finals,
    positionSnapshot: {
      marketId: MARKETS.finals.id,
      outcome: 'YES',
      entryPrice: 39,
      size: 25,
      capturedAt: '2026-09-05T14:00:00.000Z',
    },
    likeCount: 18,
    commentCount: 6,
    liked: false,
  },
  {
    author: AUTHORS.maya,
    body: 'Prediction markets are honestly a better news source than most headlines right now.',
    market: null,
    positionSnapshot: null,
    likeCount: 41,
    commentCount: 12,
    liked: false,
  },
];

function hashString(value: string): number {
  let hash = 0;
  for (let i = 0; i < value.length; i += 1) {
    hash = (hash * 31 + value.charCodeAt(i)) | 0;
  }
  return Math.abs(hash);
}

/** Deterministic, id-unique feed built by cycling the templates above. */
export function buildMockFeed(size: number): FeedItem[] {
  return Array.from({ length: size }, (_, index) => {
    const base = BASE_ITEMS[index % BASE_ITEMS.length];
    return {
      ...base,
      id: `mock-${index}`,
      createdAt: new Date(Date.now() - index * 45 * 60_000).toISOString(),
    };
  });
}

/** Single-item lookup for `getPostById`'s dev fallback (Post/Call
 * Detail) — picks a deterministic template by id/seed, same pattern as
 * `markets.mock.ts::pickMockMarketTemplate`, so opening different mock
 * post ids shows different template content instead of always the
 * first one. */
export function pickMockFeedItem(id: string): FeedItem {
  const base = BASE_ITEMS[hashString(id) % BASE_ITEMS.length];
  return { ...base, id, createdAt: new Date(Date.now() - 3 * 60 * 60_000).toISOString() };
}

const MOCK_USER_CONTENT_PAGE_SIZE = 3;

/**
 * Dev-mock fallback for Profile's Posts/Calls tabs
 * (`postService.ts::getUserPosts`/`getUserCalls`). Filters the same
 * `BASE_ITEMS` templates by `positionSnapshot` presence (a Post has
 * none, a Call does — see docs/SOCIAL-FEATURE.md) and reassigns
 * `author` to a profile matching `userId`, so the mock content visibly
 * belongs to whichever profile is being viewed rather than one of the
 * feed's own fixed sample authors.
 */
export function buildMockUserContent(
  userId: string,
  kind: 'posts' | 'calls',
  cursor?: string
): FeedItem[] {
  const filtered = BASE_ITEMS.filter((item) =>
    kind === 'calls' ? item.positionSnapshot !== null : item.positionSnapshot === null
  );
  if (filtered.length === 0) return [];

  const start = cursor ? Number(cursor) : 0;
  const author = {
    id: userId,
    handle: userId === 'me' ? 'you' : userId,
    displayName: userId === 'me' ? 'You' : `User ${userId}`,
    avatarUrl: null,
    walletAddress: null,
  };

  return Array.from(
    { length: Math.min(MOCK_USER_CONTENT_PAGE_SIZE, filtered.length - start) },
    (_, index) => {
      const globalIndex = start + index;
      const base = filtered[globalIndex % filtered.length];
      return {
        ...base,
        author,
        id: `mock-${kind}-${userId}-${globalIndex}`,
        createdAt: new Date(Date.now() - (globalIndex + 1) * 6 * 3_600_000).toISOString(),
      };
    }
  );
}

export function mockUserContentTotal(kind: 'posts' | 'calls'): number {
  return BASE_ITEMS.filter((item) =>
    kind === 'calls' ? item.positionSnapshot !== null : item.positionSnapshot === null
  ).length;
}
