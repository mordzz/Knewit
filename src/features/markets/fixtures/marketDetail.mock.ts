import type { FeedItem, MarketHolder } from '@/types/social';

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
    outcome: index % 2 === 0 ? 'YES' : 'NO',
    shares: (index + 1) * 125.5,
  }));
}

export function buildMockMarketActivity(marketId: string): FeedItem[] {
  return MOCK_COMMENT_BODIES.map((body, index) => {
    const author = MOCK_AUTHORS[index % MOCK_AUTHORS.length];
    return {
      id: `${marketId}-activity-${index}`,
      author,
      body,
      market: null,
      positionSnapshot: null,
      likeCount: (index + 1) * 3,
      commentCount: 0,
      liked: false,
      createdAt: new Date(Date.now() - (index + 1) * 3_600_000).toISOString(),
    };
  });
}
