import { apiRequest } from '@/services/api/client';
import { endpoints } from '@/services/api/endpoints';
import { env } from '@/app/config/env';
import { searchGamma } from '@/services/polymarket/gammaClient';
import { gammaEventToListItem } from '@/services/polymarket/transform';
import { searchMockMarketList } from '@/features/markets/fixtures/markets.mock';
import { searchMockPeople } from '@/features/search/fixtures/people.mock';
import type { MarketListItem } from '@/types/social';
import type { SearchResults } from '@/types/search';

/**
 * Markets: Polymarket's own `/public-search` (see
 * docs/DECISIONS.md, "Direct Polymarket Integration for Market Data") —
 * real search results, not our own backend's `?q=` filter. No visible
 * category filtering happens on the Search screen, so every result gets
 * the same generic placeholder category — `MarketCard`/`MarketAttachment`
 * never display `category` at all (see `MarketCard`'s own docs), so this
 * never reads as inconsistent.
 */
async function searchMarkets(query: string): Promise<MarketListItem[]> {
  const response = await searchGamma(query);
  const events = response.events ?? [];
  return events
    .map((event) => gammaEventToListItem(event, 'Search'))
    .filter((item): item is MarketListItem => item !== null);
}

/**
 * People: still this app's own backend — Polymarket has no concept of
 * this app's own user base, so there's nothing to redirect here.
 */
async function searchPeople(query: string) {
  const params = new URLSearchParams({ q: query });
  return apiRequest<{ people: SearchResults['people'] }>(
    `${endpoints.search}?${params.toString()}`
  ).then((result) => result.people);
}

/**
 * Always returns both People and Markets together — the Search screen
 * shows both sections side by side, not behind a scope toggle, so
 * there's no reason to ask for just one — see docs/DECISIONS.md
 * (Sprint 4). Markets and People now come from genuinely different
 * sources (Polymarket vs. our own backend) — fetched in parallel, and
 * each degrades to its own mock fallback independently in dev, so a
 * Polymarket outage doesn't also blank out People results (or vice
 * versa).
 */
export async function search(query: string): Promise<SearchResults> {
  const [people, markets] = await Promise.all([
    searchPeople(query).catch(async (error) => {
      if (env.isDev) {
        console.warn(
          '[searchService] backend unreachable — using local mock people for development only.',
          error
        );
        return searchMockPeople(query);
      }
      throw error;
    }),
    searchMarkets(query).catch(async (error) => {
      if (env.isDev) {
        console.warn(
          '[searchService] Polymarket unreachable — using local mock markets for development only.',
          error
        );
        return searchMockMarketList(query);
      }
      throw error;
    }),
  ]);

  return { people, markets };
}
