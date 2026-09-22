import { useQuery } from '@tanstack/react-query';
import { getMarketPosition } from '@/features/wallet/lib/positionService';
import { useSession } from '@/hooks/useSession';

/** Web equivalent of `apps/mobile/src/features/portfolio/hooks/useMarketPosition.ts`
 * — the current user's position (if any) in one specific market. */
export function useMarketPosition(marketId: string, options?: { enabled?: boolean }) {
  const { walletConnected, authenticated, privyUser, isGuest, address } = useSession();
  const accountKey = authenticated ? privyUser?.id ?? null : isGuest ? `guest:${address ?? 'unknown'}` : null;

  return useQuery({
    queryKey: ['positions', accountKey, marketId],
    queryFn: () => getMarketPosition(marketId),
    enabled: walletConnected && Boolean(accountKey) && (options?.enabled ?? true),
  });
}
