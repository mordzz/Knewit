import { apiRequest } from '@/services/api/client';
import { endpoints } from '@/services/api/endpoints';
import { env } from '@/app/config/env';
import { searchMockMarketList } from '@/features/markets/fixtures/markets.mock';
import { searchMockPeople } from '@/features/search/fixtures/people.mock';
import type { SearchResults } from '@/types/search';

function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function getMockSearchResults(query: string): Promise<SearchResults> {
  await delay(300);
  return {
    people: searchMockPeople(query),
    markets: searchMockMarketList(query),
  };
}

/**
 * Always returns both People and Markets together — the Search screen
 * shows both sections side by side, not behind a scope toggle, so
 * there's no reason to ask the backend for just one — see
 * docs/DECISIONS.md (Sprint 4). Reuses the Sprint 3 market model
 * (`MarketListItem`) as-is; no separate search-specific market schema.
 *
 * Real endpoint first — the shipped path. Falls back to labeled mock
 * fixtures only in dev, only on failure, same pattern as every other
 * service in this app (`feedService`, `marketService`) — see
 * docs/DECISIONS.md.
 */
export async function search(query: string): Promise<SearchResults> {
  const params = new URLSearchParams({ q: query });

  try {
    return await apiRequest<SearchResults>(`${endpoints.search}?${params.toString()}`);
  } catch (error) {
    if (env.isDev) {
      console.warn(
        '[searchService] backend unreachable — using local mock search fixtures for development only.',
        error
      );
      return getMockSearchResults(query);
    }
    throw error;
  }
}
