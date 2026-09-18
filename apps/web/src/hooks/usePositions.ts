import { useQuery } from '@tanstack/react-query';
import { getUserPositions } from '@/lib/positionService';
import { useSession } from '@/hooks/useSession';

/** Web equivalent of `apps/mobile/src/features/portfolio/hooks/usePositions.ts`
 * — gated on a connected wallet, which guest mode's sandbox wallet also
 * satisfies. */
export function usePositions() {
  const { walletConnected } = useSession();

  return useQuery({
    queryKey: ['positions'],
    queryFn: getUserPositions,
    enabled: walletConnected,
  });
}
