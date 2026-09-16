import { useQuery } from '@tanstack/react-query';
import { getTopHolders } from '@/features/markets/services/marketService';

/** Market Detail's "Top Holders" tab. */
export function useTopHolders(marketId: string) {
  return useQuery({
    queryKey: ['market-holders', marketId],
    queryFn: () => getTopHolders(marketId),
  });
}
