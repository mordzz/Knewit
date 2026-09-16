import { env } from '@/app/config/env';
import {
  fetchGammaEvents,
  fetchGammaMarketById,
  fetchGammaEventById,
} from '@/services/polymarket/gammaClient';
import { fetchClobPriceHistory } from '@/services/polymarket/clobClient';
import { fetchHolders } from '@/services/polymarket/dataApiClient';
import { resolveCategoryTagId, deriveCategoryFromTags } from '@/services/polymarket/categories';
import {
  gammaEventToListItem,
  gammaMarketToDetail,
  getClobTokenIds,
  clobHistoryToPricePoints,
  dataApiHoldersToMarketHolders,
} from '@/services/polymarket/transform';
import type { GammaMarket } from '@/services/polymarket/gammaClient';
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
import { apiRequest } from '@/services/api/client';
import { endpoints } from '@/services/api/endpoints';
import type { Paginated } from '@/types/common';
import type {
  FeedItem,
  MarketDetail,
  MarketHolder,
  MarketListItem,
  PricePoint,
  PriceRange,
} from '@/types/social';

/**
 * Real market data (this file) now comes directly from Polymarket's
 * public Gamma/CLOB/Data APIs, not "our own backend" — see
 * docs/DECISIONS.md ("Direct Polymarket Integration for Market Data"),
 * which supersedes docs/ARCHITECTURE.md's "never call Polymarket
 * directly" for this specific case (read-only market data needs no
 * credentials; that decision's actual concern — never holding
 * Polymarket API secrets or signing orders client-side — still holds
 * for trading, which this file never touches: `getMarketActivity`
 * below and everything in `tradingService.ts`/`positionService.ts`
 * still go through our own backend, unchanged).
 *
 * Every function below still follows this app's standing "real source
 * first, dev-mock fallback only in dev, only on failure" convention —
 * "real source" just means Polymarket now instead of a backend that
 * doesn't exist yet.
 */

function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * A market id might actually be an *event* id — tapping a combo's
 * header (`GroupCard`) opens the event itself, not one of its
 * candidate markets, and Polymarket's `/markets/{id}` only knows
 * individual markets. Tries the market id first (the common case); only
 * on failure does it try the id as an event and use that event's first
 * market — a reasonable stand-in until Market Detail understands combo
 * groups as their own concept (see docs/DECISIONS.md).
 */
async function fetchGammaMarketOrEventFirstMarket(id: string): Promise<GammaMarket> {
  try {
    return await fetchGammaMarketById(id);
  } catch (marketError) {
    const event = await fetchGammaEventById(id);
    const first = event.markets?.[0];
    if (!first) throw marketError;
    return first;
  }
}

/**
 * `MarketDetail` — every `MarketSummary` field plus detail-only ones
 * (`rules`, `openedAt`); not `Market` (`types/market.ts`), which stays
 * the DB-normalized documentation type — see docs/DATABASE.md.
 */
export async function getMarketById(id: string): Promise<MarketDetail> {
  try {
    const raw = await fetchGammaMarketOrEventFirstMarket(id);
    const category = deriveCategoryFromTags(raw.tags);
    return gammaMarketToDetail(raw, category);
  } catch (error) {
    if (env.isDev) {
      console.warn(
        '[marketService] Polymarket unreachable — using a local mock market fixture for development only.',
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
 * This is *our own* social data, not Polymarket's — still goes through
 * our own backend, unaffected by the Polymarket integration above.
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

/** Market Detail's "Top Holders" tab — Polymarket's real current
 * holders for this market, one ranked list across both outcomes. See
 * `MarketHolder` in `types/social.ts` for why this isn't the same as
 * `Position`. */
export async function getTopHolders(marketId: string): Promise<MarketHolder[]> {
  try {
    const market = await fetchGammaMarketOrEventFirstMarket(marketId);
    if (!market.conditionId) return [];
    const entries = await fetchHolders(market.conditionId);
    return dataApiHoldersToMarketHolders(entries);
  } catch (error) {
    if (env.isDev) {
      console.warn(
        '[marketService] Polymarket unreachable — using local mock holder data for development only.',
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
 * Chart") — real history from Polymarket's CLOB now. `currentPriceCents`
 * is only used by the dev-mock fallback, to seed a series that ends
 * exactly at the market's own live YES price rather than a disagreeing
 * number — the real CLOB call never receives or needs it.
 */
export async function getMarketPriceHistory(
  marketId: string,
  range: PriceRange,
  currentPriceCents: number
): Promise<PricePoint[]> {
  try {
    const market = await fetchGammaMarketOrEventFirstMarket(marketId);
    const [yesTokenId] = getClobTokenIds(market);
    if (!yesTokenId) return [];
    const raw = await fetchClobPriceHistory(yesTokenId, range);
    return clobHistoryToPricePoints(raw);
  } catch (error) {
    if (env.isDev) {
      console.warn(
        '[marketService] Polymarket unreachable — using local mock price history for development only.',
        error
      );
      await delay(200);
      return buildMockPriceHistory(marketId, range, currentPriceCents);
    }
    throw error;
  }
}

const MOCK_PAGE_SIZE = 6;
const MOCK_LIST_SIZE = 18;
const PAGE_SIZE = 8;

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
 * The Markets discovery feed — fetches Polymarket *events*, not raw
 * markets: an event wrapping exactly one market becomes a plain
 * `MarketSummary` row, one wrapping several becomes a `MarketGroupSummary`
 * combo (`MarketListItem`, see docs/DECISIONS.md, Markets visual
 * refresh) — this is Polymarket's own real grouping, not something this
 * app invents. `category` resolves to a Polymarket tag id first
 * (`resolveCategoryTagId`); "Trending" (the default) fetches with no tag
 * filter, sorted by 24h volume instead.
 */
export async function getMarkets(
  cursor?: string,
  category?: string
): Promise<Paginated<MarketListItem>> {
  const offset = cursor ? Number(cursor) : 0;
  const resolvedCategory = category ?? 'Trending';

  try {
    const tagId = await resolveCategoryTagId(resolvedCategory);
    const events = await fetchGammaEvents({
      limit: PAGE_SIZE,
      offset,
      tagId: tagId ?? undefined,
      order: 'volume24hr',
      ascending: false,
      closed: false,
    });

    const items = events
      .map((event) => gammaEventToListItem(event, resolvedCategory))
      .filter((item): item is MarketListItem => item !== null);
    const nextCursor = events.length === PAGE_SIZE ? String(offset + PAGE_SIZE) : null;

    return { items, nextCursor };
  } catch (error) {
    if (env.isDev) {
      console.warn(
        '[marketService] Polymarket unreachable — using local mock market fixtures for development only.',
        error
      );
      return getMockMarketsPage(cursor, category);
    }
    throw error;
  }
}
