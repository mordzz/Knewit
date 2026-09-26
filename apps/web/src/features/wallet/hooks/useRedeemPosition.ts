import { useMutation, useQueryClient } from '@tanstack/react-query';
import { redeemPosition } from '@/lib/tradingService';

/** Redeems a resolved position (by market condition id) and refreshes the
 * portfolio and balance  same invalidation as `useSellPosition`. */
export function useRedeemPosition() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (conditionId: string) => {
      return redeemPosition(conditionId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['positions'] });
      queryClient.invalidateQueries({ queryKey: ['wallet-balance'] });
    },
  });
}
