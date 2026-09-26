import { useQuery } from '@tanstack/react-query';
import { getUserPositions } from '@/features/wallet/lib/positionService';
import { useSession } from '@/hooks/useSession';

/** Web equivalent of `apps/mobile/src/features/portfolio/hooks/usePositions.ts`. */
export function usePositions() {
  const { walletConnected, authenticated, privyUser } = useSession();
  const accountKey = authenticated ? privyUser?.id ?? null : null;

  return useQuery({
    queryKey: ['positions', accountKey],
    queryFn: getUserPositions,
    enabled: walletConnected && Boolean(accountKey),
  });
}
