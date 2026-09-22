import { useQuery } from '@tanstack/react-query';
import { usePrivy } from '@privy-io/expo';
import { getUserPositions } from '@/features/portfolio/services/positionService';
import { useWallet } from '@/hooks/useWallet';
import { useAuth } from '@/hooks/useAuth';

/**
 * All of the authenticated user's positions. Gated on a connected
 * wallet — positions are meaningless (and the backend has no session to
 * resolve them from) without one, so this never fires a request that
 * could only ever come back empty for that reason.
 */
export function usePositions() {
  const { isConnected } = useWallet();
  const { isAuthenticated, isGuest } = useAuth();
  const { user } = usePrivy();
  const accountKey = isAuthenticated ? user?.id ?? null : isGuest ? 'guest' : null;

  return useQuery({
    queryKey: ['positions', accountKey],
    queryFn: getUserPositions,
    enabled: isConnected && Boolean(accountKey),
  });
}
