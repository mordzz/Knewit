import { useQuery } from '@tanstack/react-query';
import { getMarketActivity } from '@/features/markets/services/marketService';

/** Market Detail's "Comments" tab — Posts/Calls referencing this
 * market. Only fetches once a real `marketId` is known. */
export function useMarketActivity(marketId: string) {
  return useQuery({
    queryKey: ['market-activity', marketId],
    queryFn: () => getMarketActivity(marketId),
  });
}
