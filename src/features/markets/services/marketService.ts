import { apiRequest } from '@/services/api/client';
import { endpoints } from '@/services/api/endpoints';
import { env } from '@/app/config/env';
import {
  buildMockMarketList,
  buildMockTrendingMarkets,
  buildMockClosingSoon,
  pickMockMarketTemplate,
} from '@/features/markets/fixtures/markets.mock';
import {
  buildMockRules,
  buildMockHolders,
  buildMockMarketActivity,
} from '@/features/markets/fixtures/marketDetail.mock';
import type { Paginated } from '@/types/common';
import type {
  FeedItem,
  MarketDetail,
  MarketHolder,
  MarketListItem,
  MarketSummary,
} from '@/types/social';

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

const TRENDING_MARKETS_LIMIT = 8;
const CLOSING_SOON_LIMIT = 6;

/**
 * A small, non-paginated set of currently-trending markets for Home's
 * horizontal "Trending Markets" strip. Ranking (volume, liquidity,
 * recent activity) is a backend responsibility — see docs/DECISIONS.md
 * ("Feed Ranking Is a Backend Responsibility"); this call never
 * reorders what it receives. Dev-mock fallback filters to the same
 * `trending: true`-flagged fixture templates `MarketCard` already
 * renders a badge from — a real field, not an invented score.
 */
export async function getTrendingMarkets(): Promise<MarketSummary[]> {
  try {
    return await apiRequest<MarketSummary[]>(
      `${endpoints.marketsTrending}?limit=${TRENDING_MARKETS_LIMIT}`
    );
  } catch (error) {
    if (env.isDev) {
      console.warn(
        '[marketService] backend unreachable — using local mock trending markets for development only.',
        error
      );
      return buildMockTrendingMarkets(TRENDING_MARKETS_LIMIT);
    }
    throw error;
  }
}

/**
 * Markets whose real `endDate` falls within a near-term window the
 * backend defines — never a client-invented "closing soon" flag.
 * Closed/resolved markets are excluded server-side (and by the dev-mock
 * fallback) — a market that already stopped trading isn't "closing
 * soon," it's already closed.
 */
export async function getClosingSoonMarkets(): Promise<MarketSummary[]> {
  try {
    return await apiRequest<MarketSummary[]>(
      `${endpoints.marketsClosingSoon}?limit=${CLOSING_SOON_LIMIT}`
    );
  } catch (error) {
    if (env.isDev) {
      console.warn(
        '[marketService] backend unreachable — using local mock closing-soon markets for development only.',
        error
      );
      return buildMockClosingSoon(CLOSING_SOON_LIMIT);
    }
    throw error;
  }
}
