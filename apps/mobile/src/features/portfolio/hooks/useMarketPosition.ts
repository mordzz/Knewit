import { useQuery } from '@tanstack/react-query';
import { usePrivy } from '@privy-io/expo';
import { getMarketPosition } from '@/features/portfolio/services/positionService';
import { useWallet } from '@/hooks/useWallet';
import { useAuth } from '@/hooks/useAuth';

/** Market Detail's "My Position" section — the current user's position
 * (if any) in one specific market. Same wallet-gating as `usePositions`. */
export function useMarketPosition(marketId: string, options?: { enabled?: boolean }) {
  const { isConnected } = useWallet();
  const { isAuthenticated } = useAuth();
  const { user } = usePrivy();
  const accountKey = isAuthenticated ? user?.id ?? null : null;

  return useQuery({
    queryKey: ['positions', accountKey, marketId],
    queryFn: () => getMarketPosition(marketId),
    enabled: isConnected && Boolean(accountKey) && (options?.enabled ?? true),
  });
}
