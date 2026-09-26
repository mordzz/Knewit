import { useQuery, useQueryClient, InfiniteData } from '@tanstack/react-query';
import { getMarketById } from '@/features/markets/services/marketService';
import type { Paginated } from '@/types/common';
import type { MarketDetail, MarketListItem } from '@/types/social';

/**
 * Scans the Markets tab's already-cached list pages (any category) for
 * a plain (non-grouped) market matching `marketId`, so opening a market
 * from a list that already fetched it can render instantly instead of a
 * blank skeleton  see docs/DECISIONS.md (Sprint 5). Deliberately scoped
 * to `['markets', ...]` list caches only, not Search's own cache or a
 * group's individual outcome rows  a bounded optimization, not an
 * exhaustive one. Missing `MarketDetail`-only fields (`rules`,
 * `openedAt`, `resolvedOutcome`) are filled with honest "unknown"
 * defaults; the real fetch below still runs and replaces this the
 * moment it resolves.
 */
function findCachedMarket(
  marketId: string,
  queryClient: ReturnType<typeof useQueryClient>
): MarketDetail | undefined {
  const cachedLists = queryClient.getQueriesData<InfiniteData<Paginated<MarketListItem>>>({
    queryKey: ['markets'],
  });

  for (const [, data] of cachedLists) {
    if (!data) continue;
    for (const page of data.pages) {
      for (const item of page.items) {
        if (item.kind === 'market' && item.market.id === marketId) {
          return { ...item.market, rules: null, openedAt: null, resolvedOutcome: null };
        }
      }
    }
  }

  return undefined;
}

/**
 * Single-market fetch for Market Detail  always re-fetches the latest
 * data for the given id rather than trusting whatever summary a caller
 * navigated with (see docs/DECISIONS.md, Sprint 3: only the id is
 * passed through navigation, never a full market object). `placeholderData`
 * (not `initialData`) is used for the cache-reuse optimization above
 * it renders immediately without marking the query "fresh", so the real
 * fetch still runs right away rather than waiting out the default
 * staleTime.
 */
export function useMarket(marketId: string, options?: { enabled?: boolean }) {
  const queryClient = useQueryClient();

  return useQuery({
    queryKey: ['market', marketId],
    queryFn: () => getMarketById(marketId),
    placeholderData: () => findCachedMarket(marketId, queryClient),
    enabled: options?.enabled ?? true,
  });
}
