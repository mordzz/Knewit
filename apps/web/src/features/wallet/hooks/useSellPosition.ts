import { useMutation, useQueryClient } from '@tanstack/react-query';
import { sellPosition } from '@/lib/tradingService';

/**
 * Sells one whole position and applies every cache a fill can change:
 * the position list, the trading-wallet balance, this market's data, and
 * the profile Activity feed (the sell is a filled Order row, which
 * `GET /users/:id/activity` reports as a TRADE event). Same reasoning as
 * `useCreateTrade`  invalidation by refetch, never by patching cached
 * copies from a client-side guess.
 */
export function useSellPosition() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (positionId: string) => {
      return sellPosition(positionId);
    },
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ['positions'] });
      queryClient.invalidateQueries({ queryKey: ['wallet-balance'] });
      queryClient.invalidateQueries({ queryKey: ['market', result.order.marketId] });
      queryClient.invalidateQueries({ queryKey: ['profile-activity'] });
    },
  });
}
