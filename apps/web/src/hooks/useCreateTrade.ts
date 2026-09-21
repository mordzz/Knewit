import { useMutation, useQueryClient } from '@tanstack/react-query';
import { createTrade } from '@/lib/tradingService';
import type { CreateTradeInput } from '@/types/trading';
import { tradingEnabled, tradingUnavailableMessage } from '@/lib/tradingAvailability';

export function useCreateTrade(marketId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: CreateTradeInput) => {
      if (!tradingEnabled) throw new Error(tradingUnavailableMessage);
      return createTrade(input);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['positions'] });
      queryClient.invalidateQueries({ queryKey: ['market', marketId] });
    },
  });
}
