import { useQuery } from '@tanstack/react-query';
import { getMarketPriceHistory } from '@/features/markets/services/marketService';
import type { PriceRange } from '@/types/social';

/** Market Detail's price chart data for one time range — see
 * docs/DECISIONS.md ("Market Price Chart"). `currentPriceCents` only
 * matters to the service's dev-mock fallback (see that function's own
 * comment); it's included in the query key so switching ranges while
 * the live price has also moved refetches rather than reusing a stale
 * series keyed to an old price. */
export function useMarketPriceHistory(
  marketId: string,
  range: PriceRange,
  currentPriceCents: number
) {
  return useQuery({
    queryKey: ['market-price-history', marketId, range, currentPriceCents],
    queryFn: () => getMarketPriceHistory(marketId, range, currentPriceCents),
  });
}
