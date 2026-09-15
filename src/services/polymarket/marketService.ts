import { apiRequest } from '@/services/api/client';
import { endpoints } from '@/services/api/endpoints';
import type { Market } from '@/types/market';
import type { Paginated } from '@/types/common';

/**
 * Despite the folder name, this calls OUR backend's normalized market
 * endpoints — never Polymarket's API directly from the app. The backend is
 * responsible for fetching/caching from Polymarket's Gamma API. See
 * docs/ARCHITECTURE.md and docs/API.md.
 */
export function getMarkets(cursor?: string) {
  const query = cursor ? `?cursor=${encodeURIComponent(cursor)}` : '';
  return apiRequest<Paginated<Market>>(`${endpoints.markets}${query}`);
}

export function getMarketById(id: string) {
  return apiRequest<Market>(endpoints.market(id));
}
