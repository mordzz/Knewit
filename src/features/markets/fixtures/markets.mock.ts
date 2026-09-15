import type { MarketSummary } from '@/types/social';

/**
 * DEVELOPMENT-ONLY fixture data — same rule as
 * `features/home/fixtures/feed.mock.ts`: used solely as a local fallback
 * when the real `/markets` backend is unreachable, never presented as
 * real data. `imageUrl` is intentionally omitted on every entry (not
 * fetching from arbitrary third-party image hosts for mock data) — this
 * also exercises `MarketAttachment`'s category-icon fallback path.
 */
const BASE_MARKETS: Omit<MarketSummary, 'id'>[] = [
  {
    question: 'Will Bitcoin reach $120K before December?',
    category: 'Crypto',
    yesPrice: 57,
    noPrice: 43,
    volume: 12_400_000,
    endDate: '2026-12-01T00:00:00.000Z',
    trending: true,
  },
  {
    question: 'Will the incumbent win the runoff election?',
    category: 'Politics',
    yesPrice: 34,
    noPrice: 66,
    volume: 8_100_000,
    endDate: '2026-11-03T00:00:00.000Z',
    trending: true,
  },
  {
    question: 'Will the reigning MVP repeat this season?',
    category: 'Sports',
    yesPrice: 48,
    noPrice: 52,
    volume: 960_000,
    endDate: '2027-06-15T00:00:00.000Z',
  },
  {
    question: 'Will the Fed cut rates in December?',
    category: 'Economics',
    yesPrice: 71,
    noPrice: 29,
    volume: 3_200_000,
    endDate: '2026-12-18T00:00:00.000Z',
  },
  {
    question: 'Will Apple announce a foldable device before Q3?',
    category: 'Technology',
    yesPrice: 22,
    noPrice: 78,
    volume: 540_000,
    endDate: '2027-07-01T00:00:00.000Z',
  },
  {
    question: 'Will company X close its Series C above $2B?',
    category: 'Business',
    yesPrice: 39,
    noPrice: 61,
    volume: 410_000,
    endDate: '2027-01-20T00:00:00.000Z',
  },
  {
    question: 'Who will win Best Picture?',
    category: 'Pop Culture',
    yesPrice: 18,
    noPrice: 82,
    volume: 280_000,
    endDate: '2027-03-10T00:00:00.000Z',
  },
  {
    question: 'Will a ceasefire hold through the year?',
    category: 'World Events',
    yesPrice: 45,
    noPrice: 55,
    volume: 5_600_000,
    endDate: '2026-10-05T00:00:00.000Z',
    resolved: true,
  },
];

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
