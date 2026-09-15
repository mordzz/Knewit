import { apiRequest } from '@/services/api/client';
import { endpoints } from '@/services/api/endpoints';
import { env } from '@/app/config/env';
import { buildMockMarkets } from '@/features/markets/fixtures/markets.mock';
import type { Paginated } from '@/types/common';
import type { MarketSummary } from '@/types/social';

/**
 * Returns `MarketSummary` (the denormalized rendering shape — has
 * `category` directly, which the normalized `Market` entity in
 * types/market.ts does not, since category lives on `Event` there), not
 * `Market` — the Markets list and Home feed both render through
 * `MarketAttachment`, which needs this shape either way. `Market` stays
 * the DB-normalized documentation type — see docs/DATABASE.md.
 *
 * Calls OUR backend, never Polymarket directly — see docs/ARCHITECTURE.md.
 */
export function getMarketById(id: string) {
  return apiRequest<MarketSummary>(endpoints.market(id));
}

const MOCK_PAGE_SIZE = 6;
const MOCK_LIST_SIZE = 18;

function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function getMockMarketsPage(
  cursor: string | undefined,
  category?: string
): Promise<Paginated<MarketSummary>> {
  await delay(400);
  const all = buildMockMarkets(MOCK_LIST_SIZE, category);
  const start = cursor ? Number(cursor) : 0;
  const items = all.slice(start, start + MOCK_PAGE_SIZE);
  const nextCursor = start + MOCK_PAGE_SIZE < all.length ? String(start + MOCK_PAGE_SIZE) : null;
  return { items, nextCursor };
}

/**
 * Real endpoint first — the shipped path. Falls back to labeled mock
 * fixtures only in dev, only on failure, same pattern as
 * `features/home/services/feedService.ts` — see docs/DECISIONS.md.
 */
export async function getMarkets(
  cursor?: string,
  category?: string
): Promise<Paginated<MarketSummary>> {
  const params = new URLSearchParams();
  if (cursor) params.set('cursor', cursor);
  if (category && category !== 'Trending') params.set('category', category);
  const query = params.toString() ? `?${params.toString()}` : '';

  try {
    return await apiRequest<Paginated<MarketSummary>>(`${endpoints.markets}${query}`);
  } catch (error) {
    if (env.isDev) {
      console.warn(
        '[marketService] backend unreachable — using local mock market fixtures for development only.',
        error
      );
      return getMockMarketsPage(cursor, category);
    }
    throw error;
  }
}
