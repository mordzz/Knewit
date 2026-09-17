import { apiRequest } from '@/lib/apiClient';
import type { Paginated, CategoryOption } from '@/types/common';
import type { FeedItem, MarketDetail, MarketHolder, MarketListItem, PriceRange, PricePoint } from '@/types/social';

/** Web equivalent of `apps/mobile/src/features/markets/services/marketService.ts`
 * — real endpoint only, no dev-mock fallback (this backend is always
 * live for the web app). */
export async function getMarkets(cursor?: string, category?: string): Promise<Paginated<MarketListItem>> {
  const params = new URLSearchParams();
  if (cursor) params.set('cursor', cursor);
  if (category && category !== 'Trending') params.set('category', category);
  const query = params.toString() ? `?${params.toString()}` : '';
  return apiRequest<Paginated<MarketListItem>>(`/api/markets${query}`);
}

export async function getMarketById(id: string): Promise<MarketDetail> {
  return apiRequest<MarketDetail>(`/api/markets/${id}`);
}

/** Label + slug pairs from Polymarket's live tag taxonomy — the slug is
 * the value sent back as the `category` filter (see `CategoryOption`). */
export async function getCategories(): Promise<CategoryOption[]> {
  return apiRequest<CategoryOption[]>('/api/categories');
}

/** Market Detail's "Comments" tab — Posts/Calls referencing this market. */
export async function getMarketActivity(marketId: string): Promise<FeedItem[]> {
  return apiRequest<FeedItem[]>(`/api/markets/${marketId}/activity`);
}

/** Market Detail's "Top Holders" tab. */
export async function getTopHolders(marketId: string): Promise<MarketHolder[]> {
  return apiRequest<MarketHolder[]>(`/api/markets/${marketId}/holders`);
}

/** Market Detail's price chart — real Polymarket YES-price history,
 * proxied by `GET /markets/:id/price-history`. */
export async function getMarketPriceHistory(marketId: string, range: PriceRange): Promise<PricePoint[]> {
  return apiRequest<PricePoint[]>(`/api/markets/${marketId}/price-history?range=${range}`);
}
