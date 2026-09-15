import { useQuery } from '@tanstack/react-query';
import { getMarketById } from '@/features/markets/services/marketService';

/** Single-market fetch for Market Detail — always re-fetches the latest
 * data for the given id rather than trusting whatever summary a caller
 * navigated with (see docs/DECISIONS.md, Sprint 3: only the id is
 * passed through navigation, never a full market object). */
export function useMarket(marketId: string) {
  return useQuery({
    queryKey: ['market', marketId],
    queryFn: () => getMarketById(marketId),
  });
}
