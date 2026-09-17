import type { MarketGroupSummary, MarketListItem, MarketSummary } from '@/types/social';

/**
 * DEVELOPMENT-ONLY fixture data — same rule as
 * `features/home/fixtures/feed.mock.ts`: used solely as a local fallback
 * when the real `/markets` backend is unreachable, never presented as
 * real data. `imageUrl` is intentionally omitted on every entry (not
 * fetching from arbitrary third-party image hosts for mock data) — this
 * also exercises `MarketVisual`'s fixed-icon fallback path.
 *
 * Deliberately includes one `closed` (not yet resolved), one `resolved`,
 * one non-binary (`isBinary: false`), and one `outcomeLabels`-overridden
 * (crypto "Up/Down") single market, plus a mix of grouped markets (a
 * 2-row head-to-head and a 5-row list, to exercise the "+N more"
 * truncation) — otherwise those states would only ever be exercised
 * once a real backend returns them, which defeats the point of having
 * fixtures at all. See docs/DECISIONS.md (Sprint 3, Markets visual
 * refresh).
 */
const BASE_MARKETS: Omit<MarketSummary, 'id'>[] = [
  {
    question: 'Will Bitcoin reach $120K before December?',
    category: 'Crypto',
    yesPrice: 57,
    noPrice: 43,
    volume: 12_400_000,
    liquidity: 1_850_000,
    endDate: '2026-12-01T00:00:00.000Z',
    trending: true,
  },
  {
    question: 'BTC Up or Down (5 minutes)',
    category: 'Crypto',
    yesPrice: 51,
    noPrice: 49,
    volume: 116_000,
    liquidity: 40_000,
    endDate: '2026-09-16T00:05:00.000Z',
    trending: true,
    outcomeLabels: { yes: 'Up', no: 'Down' },
  },
  {
    question: 'Will the reigning MVP repeat this season?',
    category: 'Sports',
    yesPrice: 48,
    noPrice: 52,
    volume: 960_000,
    liquidity: 210_000,
    endDate: '2027-06-15T00:00:00.000Z',
  },
  {
    question: 'Will the Fed cut rates in December?',
    category: 'Economics',
    yesPrice: 71,
    noPrice: 29,
    volume: 3_200_000,
    liquidity: 540_000,
    endDate: '2026-12-18T00:00:00.000Z',
  },
  {
    question: 'Will Apple announce a foldable device before Q3?',
    category: 'Technology',
    yesPrice: 22,
    noPrice: 78,
    volume: 540_000,
    liquidity: 88_000,
    endDate: '2027-07-01T00:00:00.000Z',
  },
  {
    question: 'Will company X close its Series C above $2B?',
    category: 'Business',
    yesPrice: 39,
    noPrice: 61,
    volume: 410_000,
    liquidity: 62_000,
    endDate: '2027-01-20T00:00:00.000Z',
  },
  {
    question: 'Who will win Best Picture?',
    category: 'Pop Culture',
    yesPrice: 18,
    noPrice: 82,
    volume: 280_000,
    liquidity: null,
    endDate: '2027-03-10T00:00:00.000Z',
    isBinary: false,
    outcomeCount: 9,
  },
  {
    question: 'Will a ceasefire hold through the year?',
    category: 'World Events',
    yesPrice: 45,
    noPrice: 55,
    volume: 5_600_000,
    liquidity: 720_000,
    endDate: '2026-10-05T00:00:00.000Z',
    resolved: true,
  },
  {
    question: 'Will the merger be approved by regulators this quarter?',
    category: 'Business',
    yesPrice: 63,
    noPrice: 37,
    volume: 1_100_000,
    liquidity: 140_000,
    endDate: '2026-09-30T00:00:00.000Z',
    closed: true,
  },
];

type MockGroupTemplate = Omit<MarketGroupSummary, 'id' | 'outcomes'> & {
  outcomes: Omit<MarketGroupSummary['outcomes'][number], 'id'>[];
};

const BASE_GROUPS: MockGroupTemplate[] = [
  {
    title: 'Fed Decision in September?',
    category: 'Economics',
    volume: 175_000_000,
    liquidity: 4_200_000,
    endDate: '2026-09-17T18:00:00.000Z',
    trending: true,
    outcomes: [
      { label: '25 bps increase', yesPrice: 87, noPrice: 13 },
      { label: 'No change', yesPrice: 13, noPrice: 87 },
    ],
  },
  {
    title: 'Next Prime Minister of Sweden',
    category: 'Politics',
    volume: 8_000_000,
    liquidity: 610_000,
    endDate: '2026-09-13T00:00:00.000Z',
    outcomes: [
      { label: 'Magdalena Andersson', yesPrice: 88, noPrice: 12 },
      { label: 'Ulf Kristersson', yesPrice: 12, noPrice: 88 },
    ],
  },
  {
    title: 'Berlin State Election Winner',
    category: 'Politics',
    volume: 4_000_000,
    liquidity: 380_000,
    endDate: '2026-11-01T00:00:00.000Z',
    outcomes: [
      { label: 'Linke', yesPrice: 63, noPrice: 37 },
      { label: 'CDU', yesPrice: 28, noPrice: 72 },
      { label: 'SPD', yesPrice: 16, noPrice: 84 },
      { label: 'Greens', yesPrice: 9, noPrice: 91 },
      { label: 'AfD', yesPrice: 6, noPrice: 94 },
    ],
  },
  {
    title: 'FORZE Reload vs. UPGRADE — Game 2, Best of 3',
    category: 'Sports',
    volume: 224_000,
    liquidity: 51_000,
    endDate: '2026-09-15T20:00:00.000Z',
    trending: true,
    outcomes: [
      { label: 'FORZE Reload', yesPrice: 67, noPrice: 33 },
      { label: 'UPGRADE', yesPrice: 33, noPrice: 67 },
    ],
  },
];

function hashString(value: string): number {
  let hash = 0;
  for (let i = 0; i < value.length; i += 1) {
    hash = (hash * 31 + value.charCodeAt(i)) | 0;
  }
  return Math.abs(hash);
}

/**
 * Deterministically picks one of the base market templates based on the
 * given id/seed, rather than always the first one — so opening
 * different mock market ids (from a Markets/Search list) shows
 * different mock detail content, including the closed/resolved/
 * non-binary templates, instead of the same active market every time.
 * Used by `marketService.getMarketById`'s dev-only fallback — see
 * docs/DECISIONS.md (Sprint 5).
 */
export function pickMockMarketTemplate(seed: string): Omit<MarketSummary, 'id'> {
  return BASE_MARKETS[hashString(seed) % BASE_MARKETS.length];
}

/** Deterministic, id-unique list built by cycling the templates above. */
export function buildMockMarkets(size: number, category?: string): MarketSummary[] {
  const source =
    category && category !== 'Trending'
      ? BASE_MARKETS.filter((m) => m.category === category)
      : BASE_MARKETS;

  if (source.length === 0) return [];

  return Array.from({ length: size }, (_, index) => {
    const base = source[index % source.length];
    return { ...base, id: `mock-market-${category ?? 'all'}-${index}` };
  });
}

/** Same cycling pattern as `buildMockMarkets`, for grouped markets. */
export function buildMockGroups(size: number, category?: string): MarketGroupSummary[] {
  const source =
    category && category !== 'Trending'
      ? BASE_GROUPS.filter((g) => g.category === category)
      : BASE_GROUPS;

  if (source.length === 0) return [];

  return Array.from({ length: size }, (_, index) => {
    const base = source[index % source.length];
    const groupId = `mock-group-${category ?? 'all'}-${index}`;
    return {
      ...base,
      id: groupId,
      outcomes: base.outcomes.map((outcome, outcomeIndex) => ({
        ...outcome,
        id: `${groupId}-outcome-${outcomeIndex}`,
      })),
    };
  });
}

/**
 * The combined Markets discovery feed — mixes single markets and
 * grouped ones (every 3rd slot is a group) so the mock fallback
 * actually exercises both `MarketCard` layouts, the same way a real
 * `/markets` response mixing Polymarket's own market/event shapes
 * would. Deterministic and id-unique across both kinds.
 */
export function buildMockMarketList(size: number, category?: string): MarketListItem[] {
  const markets = buildMockMarkets(size, category);
  const groups = buildMockGroups(size, category);

  if (markets.length === 0 && groups.length === 0) return [];

  const items: MarketListItem[] = [];
  let marketIndex = 0;
  let groupIndex = 0;

  for (let i = 0; i < size; i += 1) {
    const useGroup = i % 3 === 2 && groups.length > 0;
    if (useGroup) {
      items.push({ kind: 'group', group: groups[groupIndex % groups.length] });
      groupIndex += 1;
    } else if (markets.length > 0) {
      items.push({ kind: 'market', market: markets[marketIndex % markets.length] });
      marketIndex += 1;
    } else {
      items.push({ kind: 'group', group: groups[groupIndex % groups.length] });
      groupIndex += 1;
    }
  }

  return items;
}

/**
 * Search's mock fallback for the markets half of `/search` — filters
 * the same base templates `buildMockMarkets`/`buildMockGroups` cycle
 * through, by a simple case-insensitive substring match against the
 * question/title, rather than maintaining a separate search-specific
 * fixture set. Deterministic ranking (source order), never a fabricated
 * relevance score — see docs/DECISIONS.md (Sprint 4).
 */
export function searchMockMarketList(query: string): MarketListItem[] {
  const needle = query.trim().toLowerCase();
  if (!needle) return [];

  const matchedMarkets = BASE_MARKETS.filter((m) => m.question.toLowerCase().includes(needle));
  const matchedGroups = BASE_GROUPS.filter((g) => g.title.toLowerCase().includes(needle));

  const marketItems: MarketListItem[] = matchedMarkets.map((market, index) => ({
    kind: 'market',
    market: { ...market, id: `search-market-${index}` },
  }));

  const groupItems: MarketListItem[] = matchedGroups.map((group, index) => {
    const groupId = `search-group-${index}`;
    return {
      kind: 'group',
      group: {
        ...group,
        id: groupId,
        outcomes: group.outcomes.map((outcome, outcomeIndex) => ({
          ...outcome,
          id: `${groupId}-outcome-${outcomeIndex}`,
        })),
      },
    };
  });

  return [...marketItems, ...groupItems];
}
