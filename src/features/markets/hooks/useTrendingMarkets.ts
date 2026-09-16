import { useQuery } from '@tanstack/react-query';
import { getTrendingMarkets } from '@/features/markets/services/marketService';

export function useTrendingMarkets() {
  return useQuery({
    queryKey: ['markets-trending'],
    queryFn: getTrendingMarkets,
  });
}
