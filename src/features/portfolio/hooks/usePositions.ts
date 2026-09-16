import { useQuery } from '@tanstack/react-query';
import { getUserPositions } from '@/features/portfolio/services/positionService';
import { useWallet } from '@/hooks/useWallet';

/**
 * All of the authenticated user's positions. Gated on a connected
 * wallet — positions are meaningless (and the backend has no session to
 * resolve them from) without one, so this never fires a request that
 * could only ever come back empty for that reason.
 */
export function usePositions() {
  const { isConnected } = useWallet();

  return useQuery({
    queryKey: ['positions'],
    queryFn: getUserPositions,
    enabled: isConnected,
  });
}
