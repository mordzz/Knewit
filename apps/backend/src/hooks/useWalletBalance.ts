import { useQuery } from '@tanstack/react-query';
import { usePrivy } from '@privy-io/react-auth';
import { getWalletBalance } from '@/lib/walletService';

/** Web equivalent of `apps/mobile/src/features/wallet/hooks/useWalletBalance.ts`
 * — gated on a connected wallet, same as `usePositions`. */
export function useWalletBalance() {
  const { user } = usePrivy();
  const isConnected = !!user?.wallet?.address;

  return useQuery({
    queryKey: ['wallet-balance'],
    queryFn: getWalletBalance,
    enabled: isConnected,
  });
}
