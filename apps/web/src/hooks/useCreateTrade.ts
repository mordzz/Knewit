import { useMutation, useQueryClient } from '@tanstack/react-query';
import { createTrade } from '@/lib/tradingService';
import type { CreateTradeInput } from '@/types/trading';

export function useCreateTrade(marketId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: CreateTradeInput) => {
      return createTrade(input);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['positions'] });
      queryClient.invalidateQueries({ queryKey: ['market', marketId] });
      // A fill spends the user's collateral and shows up as a TRADE row in
      // the profile Activity feed  refresh both the same way
      // useSellPosition does for the opposite side, otherwise they keep
      // showing pre-trade state until something else refetches them.
      queryClient.invalidateQueries({ queryKey: ['wallet-balance'] });
      queryClient.invalidateQueries({ queryKey: ['profile-activity'] });
    },
  });
}
