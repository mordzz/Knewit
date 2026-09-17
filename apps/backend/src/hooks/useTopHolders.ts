import { useQuery } from '@tanstack/react-query';
import { getTopHolders } from '@/lib/marketService';

export function useTopHolders(marketId: string) {
  return useQuery({
    queryKey: ['market-holders', marketId],
    queryFn: () => getTopHolders(marketId),
  });
}
