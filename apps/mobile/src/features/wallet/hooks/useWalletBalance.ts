import { useQuery } from '@tanstack/react-query';
import { getWalletBalance } from '@/features/wallet/services/walletService';
import { useWallet } from '@/hooks/useWallet';
import { useAuth } from '@/hooks/useAuth';

/** Mobile wallet balance query backed by the API in `apps/web` —
 * gated on a connected wallet, same as `usePositions`. */
export function useWalletBalance() {
  const { isConnected } = useWallet();
  const { isAuthenticated } = useAuth();

  return useQuery({
    queryKey: ['wallet-balance'],
    queryFn: getWalletBalance,
    // The backend can already know the embedded wallet while Privy's wallet
    // list is still propagating locally after login/create.
    enabled: isConnected || isAuthenticated,
  });
}
