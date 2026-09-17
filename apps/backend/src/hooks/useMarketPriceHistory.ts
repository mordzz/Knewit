import { useQuery } from '@tanstack/react-query';
import { getMarketPriceHistory } from '@/lib/marketService';
import type { PriceRange } from '@/types/social';

/** Web equivalent of `apps/mobile/src/features/markets/hooks/useMarketPriceHistory.ts`
 * — Market Detail's price chart data for one time range. */
export function useMarketPriceHistory(marketId: string, range: PriceRange) {
  return useQuery({
    queryKey: ['market-price-history', marketId, range],
    queryFn: () => getMarketPriceHistory(marketId, range),
  });
}
