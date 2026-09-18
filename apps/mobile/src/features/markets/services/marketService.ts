import { apiRequest } from '@/services/api/client';
import { endpoints } from '@/services/api/endpoints';
import { env } from '@/app/config/env';
import {
  buildMockMarketList,
  pickMockMarketTemplate,
} from '@/features/markets/fixtures/markets.mock';
import {
  buildMockRules,
  buildMockHolders,
  buildMockMarketActivity,
  buildMockPriceHistory,
} from '@/features/markets/fixtures/marketDetail.mock';
import type { Paginated } from '@/types/common';
import type {
  FeedItem,
  MarketDetail,
  MarketHolder,
  MarketListItem,
  PricePoint,
  PriceRange,
} from '@/types/social';
import type { TradeEstimate } from '@/types/trading';

function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * `MarketDetail` — every `MarketSummary` field plus detail-only ones
 * (`rules`, `openedAt`); not `Market` (`types/market.ts`), which stays
 * the DB-normalized documentation type — see docs/DATABASE.md. Used for
 * a single market lookup (Market Detail), never a grouped one — a
 * group's individual outcome rows are each still an ordinary market
 * with their own id, so this works the same way whether the id came
 * from a plain market card or a group's row.
 *
 * Real endpoint first — falls back to a mock fixture only in dev, only
 * on failure, same pattern as `getMarkets` below. Calls OUR backend,
 * never Polymarket directly — see docs/ARCHITECTURE.md.
 */
export async function getMarketById(id: string): Promise<MarketDetail> {
  try {
    return await apiRequest<MarketDetail>(endpoints.market(id));
  } catch (error) {
    if (env.isDev) {
      console.warn(
        '[marketService] backend unreachable — using a local mock market fixture for development only.',
        error
      );
      const fallback = pickMockMarketTemplate(id);
      return {
        ...fallback,
        id,
        rules: buildMockRules(fallback.question),
        openedAt: new Date(Date.now() - 30 * 86_400_000).toISOString(),
        resolvedOutcome: fallback.resolved
          ? fallback.yesPrice >= fallback.noPrice
            ? 'YES'
            : 'NO'
          : null,
      };
    }
    throw error;
  }
}

/**
 * Posts/Calls referencing this market — Market Detail's "Comments" tab.
 * Not paginated in this pass (a fixed, reasonably small batch) — see
 * docs/DECISIONS.md (Market Detail rebuild) for why infinite scroll
 * wasn't added here.
 */
export async function getMarketActivity(marketId: string): Promise<FeedItem[]> {
  try {
    return await apiRequest<FeedItem[]>(endpoints.marketActivity(marketId));
  } catch (error) {
    if (env.isDev) {
      console.warn(
        '[marketService] backend unreachable — using local mock market activity for development only.',
        error
      );
      await delay(300);
      return buildMockMarketActivity(marketId);
    }
    throw error;
  }
}

/** Market Detail's "Top Holders" tab — see `MarketHolder` in
 * `types/social.ts` for why this isn't the same as `Position`. */
export async function getTopHolders(marketId: string): Promise<MarketHolder[]> {
  try {
    return await apiRequest<MarketHolder[]>(endpoints.marketHolders(marketId));
  } catch (error) {
    if (env.isDev) {
      console.warn(
        '[marketService] backend unreachable — using local mock holder data for development only.',
        error
      );
      await delay(300);
      return buildMockHolders(marketId);
    }
    throw error;
  }
}

/**
 * Market Detail's price chart (see docs/DECISIONS.md, "Market Price
 * Chart"). `currentPriceCents` is only used by the dev-mock fallback —
 * to seed a series that ends exactly at the market's own live YES price
 * rather than a disagreeing number — and is never sent to the real
 * endpoint, which is the actual source of truth for historical prices.
 */
export async function getMarketPriceHistory(
  marketId: string,
  range: PriceRange,
  currentPriceCents: number,
  choiceIndex: number
): Promise<PricePoint[]> {
  try {
    return await apiRequest<PricePoint[]>(
      `${endpoints.marketPriceHistory(marketId)}?range=${range}&choice=${choiceIndex}`
    );
  } catch (error) {
    if (env.isDev) {
      console.warn(
        '[marketService] backend unreachable — using local mock price history for development only.',
        error
      );
      await delay(200);
      return buildMockPriceHistory(marketId, range, currentPriceCents, choiceIndex);
    }
    throw error;
  }
}

const MOCK_PAGE_SIZE = 6;
const MOCK_LIST_SIZE = 18;

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

/**
 * What a FAK BUY of `usdAmount` would fill at right now, from
 * Polymarket's own order book (`GET /markets/:id/trade-estimate`).
 * **No dev-mock fallback**: a fabricated fill price would be exactly the
 * kind of invented money math this project forbids (docs/DECISIONS.md,
 * "No Fake Trade Success") — the trade UI just omits the estimate when
 * this fails.
 */
export async function getTradeEstimate(
  marketId: string,
  choiceIndex: number,
  usdAmount: number
): Promise<TradeEstimate> {
  const params = new URLSearchParams({
    choiceIndex: String(choiceIndex),
    usdAmount: String(usdAmount),
  });
  return apiRequest<TradeEstimate>(`${endpoints.marketTradeEstimate(marketId)}?${params.toString()}`);
}
