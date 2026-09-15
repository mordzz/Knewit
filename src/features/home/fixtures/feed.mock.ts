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
  },
  {
    author: AUTHORS.maya,
    body: "This market looks interesting but I'm not ready to take a position yet — watching the volume.",
    market: null,
    positionSnapshot: null,
    likeCount: 3,
    commentCount: 1,
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
  },
  {
    author: AUTHORS.aria,
    body: 'Volume on the election runoff market has tripled this week — worth a look.',
    market: MARKETS.election,
    positionSnapshot: null,
    likeCount: 11,
    commentCount: 4,
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
  },
  {
    author: AUTHORS.maya,
    body: 'Prediction markets are honestly a better news source than most headlines right now.',
    market: null,
    positionSnapshot: null,
    likeCount: 41,
    commentCount: 12,
  },
];

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
