import { useQuery } from '@tanstack/react-query';
import { usePrivy } from '@privy-io/react-auth';
import { getMarketPosition } from '@/lib/positionService';

/** Web equivalent of `apps/mobile/src/features/portfolio/hooks/useMarketPosition.ts`
 * — the current user's position (if any) in one specific market. */
export function useMarketPosition(marketId: string, options?: { enabled?: boolean }) {
  const { user } = usePrivy();
  const isConnected = !!user?.wallet?.address;

  return useQuery({
    queryKey: ['positions', marketId],
    queryFn: () => getMarketPosition(marketId),
    enabled: isConnected && (options?.enabled ?? true),
  });
}
