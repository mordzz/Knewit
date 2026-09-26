import { useQuery, useQueryClient, type InfiniteData } from '@tanstack/react-query';
import { getMarketById } from '@/features/markets/lib/marketService';
import { ApiRequestError } from '@/lib/apiClient';
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
 *  reuses a cached Markets-list entry as `placeholderData` so opening
 * a market already visible in a list renders instantly, but always
 * re-fetches the latest data too. */
export function useMarket(marketId: string, options?: { enabled?: boolean }) {
  const queryClient = useQueryClient();

  return useQuery({
    queryKey: ['market', marketId],
    queryFn: () => getMarketById(marketId),
    placeholderData: () => findCachedMarket(marketId, queryClient),
    enabled: options?.enabled ?? true,
    // MarketDetailView (`app/(app)/markets/[id]/MarketDetailView.tsx`) tries
    // this lookup first and falls back to `useEvent` once it 404s  an id
    // that belongs to an event, not a market. A 404 here is that meaningful
    // signal, not a transient failure, but React Query's default `retry: 3`
    // keeps `status` stuck on `'pending'` through ~3 retries first, which
    // kept the page's loading skeleton showing indefinitely on remount/focus
    // refetch. Only retry on errors that aren't a plain "wrong id space" 404.
    retry: (failureCount, error) =>
      error instanceof ApiRequestError && error.status === 404 ? false : failureCount < 3,
  });
}
