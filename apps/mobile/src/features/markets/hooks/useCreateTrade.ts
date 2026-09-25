import { useMutation, useQueryClient } from '@tanstack/react-query';
import { createTrade } from '@/features/markets/services/tradingService';
import type { CreateTradeInput } from '@/types/trading';

/**
 * On success, invalidates every query a fill could have changed: this
 * market's own data (price/volume move), every position query —
 * `['positions']` alone also covers the more specific `['positions',
 * marketId]` cache entry, since TanStack Query matches invalidation keys
 * by prefix — the trading-wallet balance a fill spends from, and the
 * profile Activity feed, which reports a filled Order as a TRADE event
 * (mirrors `useSellPosition`'s invalidation for the opposite side). See
 * docs/DECISIONS.md ("Query Invalidation Foundation").
 */
export function useCreateTrade(marketId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: CreateTradeInput) => {
      return createTrade(input);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['positions'] });
      queryClient.invalidateQueries({ queryKey: ['market', marketId] });
      queryClient.invalidateQueries({ queryKey: ['wallet-balance'] });
      queryClient.invalidateQueries({ queryKey: ['profile-activity'] });
    },
  });
}
