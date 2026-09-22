import { useQuery } from '@tanstack/react-query';
import { getUserPositions } from '@/features/wallet/lib/positionService';
import { useSession } from '@/hooks/useSession';

/** Web equivalent of `apps/mobile/src/features/portfolio/hooks/usePositions.ts`
 * — gated on a connected wallet, which guest mode's sandbox wallet also
 * satisfies. */
export function usePositions() {
  const { walletConnected, authenticated, privyUser, isGuest, address } = useSession();
  const accountKey = authenticated ? privyUser?.id ?? null : isGuest ? `guest:${address ?? 'unknown'}` : null;

  return useQuery({
    queryKey: ['positions', accountKey],
    queryFn: getUserPositions,
    enabled: walletConnected && Boolean(accountKey),
  });
}
