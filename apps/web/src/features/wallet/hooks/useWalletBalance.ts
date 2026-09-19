import { useQuery } from '@tanstack/react-query';
import { getWalletBalance } from '@/features/wallet/lib/walletService';
import { useSession } from '@/hooks/useSession';

/** Web equivalent of `apps/mobile/src/features/wallet/hooks/useWalletBalance.ts`
 * — gated on a connected wallet, same as `usePositions`. */
export function useWalletBalance() {
  const { walletConnected } = useSession();

  return useQuery({
    queryKey: ['wallet-balance'],
    queryFn: getWalletBalance,
    enabled: walletConnected,
  });
}
