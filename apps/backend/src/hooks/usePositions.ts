import { useQuery } from '@tanstack/react-query';
import { usePrivy } from '@privy-io/react-auth';
import { getUserPositions } from '@/lib/positionService';

/** Web equivalent of `apps/mobile/src/features/portfolio/hooks/usePositions.ts`
 * — gated on a connected wallet. */
export function usePositions() {
  const { user } = usePrivy();
  const isConnected = !!user?.wallet?.address;

  return useQuery({
    queryKey: ['positions'],
    queryFn: getUserPositions,
    enabled: isConnected,
  });
}
