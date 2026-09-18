import { useQuery, useQueryClient, type InfiniteData } from '@tanstack/react-query';
import { getMarketById } from '@/lib/marketService';
import type { Paginated } from '@/types/common';
import type { MarketDetail, MarketListItem } from '@/types/social';

function findCachedMarket(marketId: string, queryClient: ReturnType<typeof useQueryClient>): MarketDetail | undefined {
  const cachedLists = queryClient.getQueriesData<InfiniteData<Paginated<MarketListItem>>>({ queryKey: ['markets'] });

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

/** Web equivalent of `apps/mobile/src/features/markets/hooks/useMarket.ts`
 * — reuses a cached Markets-list entry as `placeholderData` so opening
 * a market already visible in a list renders instantly, but always
 * re-fetches the latest data too. */
export function useMarket(marketId: string, options?: { enabled?: boolean }) {
  const queryClient = useQueryClient();

  return useQuery({
    queryKey: ['market', marketId],
    queryFn: () => getMarketById(marketId),
    placeholderData: () => findCachedMarket(marketId, queryClient),
    enabled: options?.enabled ?? true,
  });
}
