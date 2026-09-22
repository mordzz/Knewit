import { useQuery } from '@tanstack/react-query';
import { getWalletBalance } from '@/features/wallet/lib/walletService';
import { useSession } from '@/hooks/useSession';

/** Web equivalent of `apps/mobile/src/features/wallet/hooks/useWalletBalance.ts`
 * — gated on a connected wallet, same as `usePositions`. */
export function useWalletBalance() {
  const { walletConnected, authenticated } = useSession();

  return useQuery({
    queryKey: ['wallet-balance'],
    queryFn: getWalletBalance,
    // During Privy's wallet bootstrap the authenticated user can already
    // have a server-side wallet while its address has not reached the
    // session context yet. Let the API resolve that state instead of
    // keeping account setup stuck behind a disabled query.
    enabled: walletConnected || authenticated,
  });
}
