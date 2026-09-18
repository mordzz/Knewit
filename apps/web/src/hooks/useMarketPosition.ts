import { useQuery } from '@tanstack/react-query';
import { getMarketPosition } from '@/lib/positionService';
import { useSession } from '@/hooks/useSession';

/** Web equivalent of `apps/mobile/src/features/portfolio/hooks/useMarketPosition.ts`
 * — the current user's position (if any) in one specific market. */
export function useMarketPosition(marketId: string, options?: { enabled?: boolean }) {
  const { walletConnected } = useSession();

  return useQuery({
    queryKey: ['positions', marketId],
    queryFn: () => getMarketPosition(marketId),
    enabled: walletConnected && (options?.enabled ?? true),
  });
}
