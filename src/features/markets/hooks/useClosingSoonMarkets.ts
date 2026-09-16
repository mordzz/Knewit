import { useQuery } from '@tanstack/react-query';
import { getClosingSoonMarkets } from '@/features/markets/services/marketService';

export function useClosingSoonMarkets() {
  return useQuery({
    queryKey: ['markets-closing-soon'],
    queryFn: getClosingSoonMarkets,
  });
}
