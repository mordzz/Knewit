import { useQuery } from '@tanstack/react-query';
import { getMarketActivity } from '@/lib/marketService';

export function useMarketActivity(marketId: string) {
  return useQuery({
    queryKey: ['market-activity', marketId],
    queryFn: () => getMarketActivity(marketId),
  });
}
