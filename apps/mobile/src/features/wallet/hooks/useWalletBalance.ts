import { useQuery } from '@tanstack/react-query';
import { usePrivy } from '@privy-io/expo';
import { getWalletBalance } from '@/features/wallet/services/walletService';
import { useAuth } from '@/hooks/useAuth';

/** Mobile wallet balance query backed by the API in `apps/web` —
 * gated on a connected wallet, same as `usePositions`. */
export function useWalletBalance() {
  const { isAuthenticated, isGuest } = useAuth();
  const { user: privyUser } = usePrivy();
  const accountKey = isAuthenticated ? (privyUser?.id ?? null) : isGuest ? 'guest' : null;

  return useQuery({
    // Financial data must never be reused across authenticated accounts.
    queryKey: ['wallet-balance', accountKey],
    queryFn: async () => {
      const result = await getWalletBalance();
      if (result.accountId && result.accountId !== accountKey) {
        throw new Error('Wallet balance account mismatch. Please refresh your session.');
      }
      return result;
    },
    // The backend can already know the embedded wallet while Privy's wallet
    // list is still propagating locally after login/create.
    enabled: isGuest || (isAuthenticated && Boolean(accountKey)),
  });
}
