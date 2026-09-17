import { useQuery } from '@tanstack/react-query';
import { getMarketPosition } from '@/features/portfolio/services/positionService';
import { useWallet } from '@/hooks/useWallet';

/** Market Detail's "My Position" section — the current user's position
 * (if any) in one specific market. Same wallet-gating as `usePositions`. */
export function useMarketPosition(marketId: string) {
  const { isConnected } = useWallet();

  return useQuery({
    queryKey: ['positions', marketId],
    queryFn: () => getMarketPosition(marketId),
    enabled: isConnected,
  });
}
