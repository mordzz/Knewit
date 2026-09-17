import type { FeedItem, MarketSummary } from '@/types/social';

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

/** Binary fixture markets: choices are derived from the yes/no pair so
 * the mock shape matches a real `/markets` response. */
function feedMarket(market: Omit<MarketSummary, 'choices'>): MarketSummary {
  return {
    ...market,
    choices: [
      { index: 0, label: 'Yes', price: market.yesPrice },
      { index: 1, label: 'No', price: market.noPrice },
    ],
  };
}

const MARKETS: Record<'btc120k' | 'election' | 'finals', MarketSummary> = {
  btc120k: feedMarket({
    id: 'market-btc-120k',
    question: 'Will BTC reach $120K by end of 2026?',
    category: 'Crypto',
    yesPrice: 57,
    noPrice: 43,
    volume: 482_000,
    endDate: '2026-12-31T00:00:00.000Z',
  }),
  election: feedMarket({
    id: 'market-election-runoff',
    question: 'Will the incumbent win the runoff election?',
    category: 'Politics',
    yesPrice: 34,
    noPrice: 66,
    volume: 1_240_000,
    endDate: '2026-11-03T00:00:00.000Z',
  }),
  finals: feedMarket({
    id: 'market-finals-mvp',
    question: 'Will the reigning MVP repeat this season?',
    category: 'Sports',
    yesPrice: 48,
    noPrice: 52,
    volume: 96_000,
    endDate: '2027-06-15T00:00:00.000Z',
  }),
};

const BASE_ITEMS: Omit<FeedItem, 'id' | 'createdAt'>[] = [
  {
    author: AUTHORS.jordan,
    body: 'BTC is going to break $120K before the year is out. Feels obvious at this point.',
    market: MARKETS.btc120k,
    positionSnapshot: {
      marketId: MARKETS.btc120k.id,
      outcome: 'Yes',
      choiceIndex: 0,
      entryPrice: 42,
      size: 12.5,
      capturedAt: '2026-08-20T10:00:00.000Z',
    },
    likeCount: 24,
    commentCount: 8,
    liked: false,
    canDelete: false,
  },
  {
    author: AUTHORS.theo,
    body: 'Betting against the incumbent here. Polling momentum has clearly shifted.',
    market: MARKETS.election,
    positionSnapshot: {
      marketId: MARKETS.election.id,
      outcome: 'No',
      choiceIndex: 1,
      entryPrice: 71,
      size: 40,
      capturedAt: '2026-09-01T09:30:00.000Z',
    },
    likeCount: 56,
    commentCount: 19,
    liked: false,
    canDelete: false,
  },
  {
    author: AUTHORS.jordan,
    body: 'Taking YES on the MVP repeat — form has been undeniable all season.',
    market: MARKETS.finals,
    positionSnapshot: {
      marketId: MARKETS.finals.id,
      outcome: 'Yes',
      choiceIndex: 0,
      entryPrice: 39,
      size: 25,
      capturedAt: '2026-09-05T14:00:00.000Z',
    },
    likeCount: 18,
    commentCount: 6,
    liked: false,
    canDelete: false,
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
 * Dev-mock fallback for Profile's Calls tab (`postService.ts::getUserCalls`)
 * — every entry is already a position-backed Call. Reassigns `author` to
 * a profile matching `userId`, so the mock content visibly belongs to
 * whichever profile is being viewed rather than one of the feed's own
 * fixed sample authors; `canDelete` follows the same convention as
 * `comments.mock.ts` (`userId === 'me'`).
 */
export function buildMockUserContent(userId: string, cursor?: string): FeedItem[] {
  const filtered = BASE_ITEMS.filter((item) => item.positionSnapshot !== null);
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
        canDelete: userId === 'me',
        id: `mock-calls-${userId}-${globalIndex}`,
        createdAt: new Date(Date.now() - (globalIndex + 1) * 6 * 3_600_000).toISOString(),
      };
    }
  );
}

export function mockUserContentTotal(): number {
  return BASE_ITEMS.filter((item) => item.positionSnapshot !== null).length;
}
