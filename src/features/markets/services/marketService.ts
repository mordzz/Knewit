import { apiRequest } from '@/services/api/client';
import { endpoints } from '@/services/api/endpoints';
import { env } from '@/app/config/env';
import { buildMockMarkets, buildMockMarketList } from '@/features/markets/fixtures/markets.mock';
import type { Paginated } from '@/types/common';
import type { MarketListItem, MarketSummary } from '@/types/social';

/**
 * Returns `MarketSummary` (the denormalized rendering shape — has
 * `category` directly, which the normalized `Market` entity in
 * types/market.ts does not, since category lives on `Event` there), not
 * `Market` — `Market` stays the DB-normalized documentation type — see
 * docs/DATABASE.md. Used for a single market lookup (Market Detail),
 * never a grouped one — a group's individual outcome rows are each
 * still an ordinary market with their own id, so this works the same
 * way whether the id came from a plain market card or a group's row.
 *
 * Real endpoint first — falls back to a mock fixture only in dev, only
 * on failure, same pattern as `getMarkets` below. Calls OUR backend,
 * never Polymarket directly — see docs/ARCHITECTURE.md.
 */
export async function getMarketById(id: string): Promise<MarketSummary> {
  try {
    return await apiRequest<MarketSummary>(endpoints.market(id));
  } catch (error) {
    if (env.isDev) {
      console.warn(
        '[marketService] backend unreachable — using a local mock market fixture for development only.',
        error
      );
      const [fallback] = buildMockMarkets(1);
      return { ...fallback, id };
    }
    throw error;
  }
}

const MOCK_PAGE_SIZE = 6;
const MOCK_LIST_SIZE = 18;

function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function getMockMarketsPage(
  cursor: string | undefined,
  category?: string
): Promise<Paginated<MarketListItem>> {
  await delay(400);
  const all = buildMockMarketList(MOCK_LIST_SIZE, category);
  const start = cursor ? Number(cursor) : 0;
  const items = all.slice(start, start + MOCK_PAGE_SIZE);
  const nextCursor = start + MOCK_PAGE_SIZE < all.length ? String(start + MOCK_PAGE_SIZE) : null;
  return { items, nextCursor };
}

/**
 * The Markets discovery feed — a page can mix plain single markets and
 * grouped ones (`MarketListItem`, see docs/DECISIONS.md, Markets visual
 * refresh), the same way Polymarket's own market/event data mixes
 * shapes. Real endpoint first — the shipped path. Falls back to labeled
 * mock fixtures only in dev, only on failure, same pattern as
 * `features/home/services/feedService.ts` — see docs/DECISIONS.md.
 */
export async function getMarkets(
  cursor?: string,
  category?: string
): Promise<Paginated<MarketListItem>> {
  const params = new URLSearchParams();
  if (cursor) params.set('cursor', cursor);
  if (category && category !== 'Trending') params.set('category', category);
  const query = params.toString() ? `?${params.toString()}` : '';

  try {
    return await apiRequest<Paginated<MarketListItem>>(`${endpoints.markets}${query}`);
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
