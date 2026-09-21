import { useMutation, useQueryClient } from '@tanstack/react-query';
import { sellPosition } from '@/features/markets/services/tradingService';
import { env } from '@/app/config/env';

/**
 * Sells one whole position and invalidates every query a fill can
 * change: the position list, the trading-wallet balance, this market's
 * data, and the profile Activity feed (the sell is a filled Order row,
 * which the backend reports as a TRADE event). Same invalidation rule as
 * `useCreateTrade`.
 */
export function useSellPosition() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (positionId: string) => {
      if (!env.tradingEnabled) throw new Error('Trading is temporarily unavailable.');
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
