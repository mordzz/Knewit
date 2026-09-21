import { useQuery } from '@tanstack/react-query';
import { getWalletBalance } from '@/features/wallet/services/walletService';
import { useWallet } from '@/hooks/useWallet';

/** Mobile wallet balance query backed by the API in `apps/web` —
 * gated on a connected wallet, same as `usePositions`. */
export function useWalletBalance() {
  const { isConnected } = useWallet();

  return useQuery({
    queryKey: ['wallet-balance'],
    queryFn: getWalletBalance,
    enabled: isConnected,
  });
}
