import type { FeedItem, MarketHolder, PricePoint, PriceRange } from '@/types/social';

/**
 * DEVELOPMENT-ONLY fixture data — same rule as every other `*.mock.ts`
 * in this app: local fallback only, never presented as real data.
 *
 * Unlike `markets.mock.ts`'s fixtures (a fixed pool of templates cycled
 * by index), these are generated *for whatever `marketId` is passed in*
 * — a market opened from Markets/Search/Home has an id no fixed mock
 * template would ever coincidentally match, so matching against a
 * separate fixed pool would almost always return nothing. Synthesizing
 * against the actual id keeps the mock fallback useful for exercising
 * the UI regardless of which market was opened.
 */

const MOCK_AUTHORS = [
  {
    id: 'user-jordan',
    handle: 'jordan_p',
    displayName: 'Jordan P',
    avatarUrl: null,
    walletAddress: null,
  },
  {
    id: 'user-maya',
    handle: 'maya.k',
    displayName: 'Maya K',
    avatarUrl: null,
    walletAddress: null,
  },
  {
    id: 'user-theo',
    handle: 'theotrades',
    displayName: 'Theo',
    avatarUrl: null,
    walletAddress: null,
  },
  {
    id: 'user-aria',
    handle: 'aria_watches',
    displayName: 'Aria',
    avatarUrl: null,
    walletAddress: null,
  },
] as const;

const MOCK_COMMENT_BODIES = [
  "Volume's been climbing all week on this one — worth watching closely.",
  'Not convinced this resolves the way the crowd thinks it will.',
  'The recent news cycle should move this a fair bit by the weekend.',
  'Been holding a position here since it opened. No regrets so far.',
];

export function buildMockRules(question: string): string {
  return (
    `This market resolves based on publicly available, verifiable information ` +
    `related to: "${question}". If the outcome is ambiguous or disputed at ` +
    `resolution time, the designated resolver will determine the final outcome ` +
    `using the most reliable sources available. This is placeholder rules text ` +
    `for local development — see docs/API.md.`
  );
}

export function buildMockHolders(marketId: string): MarketHolder[] {
  return MOCK_AUTHORS.map((author, index) => ({
    id: `${marketId}-holder-${index}`,
    displayName: author.displayName,
    handle: author.handle,
    avatarUrl: author.avatarUrl,
    outcome: index % 2 === 0 ? 'Yes' : 'No',
    shares: (index + 1) * 125.5,
  }));
}

function hashSeed(value: string): number {
  let hash = 0;
  for (let i = 0; i < value.length; i += 1) {
    hash = (hash * 31 + value.charCodeAt(i)) | 0;
  }
  return Math.abs(hash) || 1;
}

/** Tiny deterministic PRNG (mulberry32) — seeded per `marketId`+`range`,
 * so the same market/range combination always renders the same series
 * within a session rather than jittering on every refetch, without
 * needing a real `Math.random` seed API. */
function mulberry32(seed: number) {
  let state = seed;
  return () => {
    state = (state + 0x6d2b79f5) | 0;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const RANGE_CONFIG: Record<PriceRange, { points: number; stepMs: number }> = {
  '1H': { points: 12, stepMs: 5 * 60_000 },
  '6H': { points: 24, stepMs: 15 * 60_000 },
  '1D': { points: 24, stepMs: 60 * 60_000 },
  '1W': { points: 14, stepMs: 12 * 60 * 60_000 },
  '1M': { points: 30, stepMs: 24 * 60 * 60_000 },
  ALL: { points: 52, stepMs: 7 * 24 * 60 * 60_000 },
};

/**
 * A deterministic random-walk series ending *exactly* at
 * `currentPriceCents` — the market's own live YES price, the same
 * number the rest of the screen shows — so the chart never disagrees
 * with itself about "what is this market's price right now" (see
 * docs/DECISIONS.md, "Market Price Chart"). Values are clamped to
 * [1, 99] cents throughout, since this models a probability.
 */
export function buildMockPriceHistory(
  marketId: string,
  range: PriceRange,
  currentPriceCents: number,
  choiceIndex = 0
): PricePoint[] {
  const { points, stepMs } = RANGE_CONFIG[range];
  const random = mulberry32(hashSeed(`${marketId}:${range}:${choiceIndex}`));
  const target = Math.max(1, Math.min(99, currentPriceCents));

  // Walk backward from the known current price so the *last* point is
  // guaranteed exact, then reverse into chronological order.
  const reversed: number[] = [target];
  let price = target;
  for (let i = 1; i < points; i += 1) {
    const drift = (random() - 0.5) * 6;
    price = Math.max(1, Math.min(99, price - drift));
    reversed.push(price);
  }
  const prices = reversed.reverse();

  const now = Date.now();
  return prices.map((value, index) => ({
    timestamp: new Date(now - (points - 1 - index) * stepMs).toISOString(),
    price: Math.round(value),
  }));
}

export function buildMockMarketActivity(marketId: string): FeedItem[] {
  return MOCK_COMMENT_BODIES.map((body, index) => {
    const author = MOCK_AUTHORS[index % MOCK_AUTHORS.length];
    const createdAt = new Date(Date.now() - (index + 1) * 3_600_000).toISOString();
    return {
      id: `${marketId}-activity-${index}`,
      author,
      body,
      market: null,
      positionSnapshot: {
        marketId,
        outcome: 'Yes',
        choiceIndex: 0,
        entryPrice: 50,
        size: 10,
        capturedAt: createdAt,
      },
      likeCount: (index + 1) * 3,
      commentCount: 0,
      liked: false,
      canDelete: false,
      createdAt,
    };
  });
}
