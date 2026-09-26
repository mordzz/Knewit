import { useQuery } from '@tanstack/react-query';
import { getWalletBalance } from '@/features/wallet/lib/walletService';
import { useSession } from '@/hooks/useSession';

/** Web equivalent of `apps/mobile/src/features/wallet/hooks/useWalletBalance.ts`
 * — gated on a connected wallet, same as `usePositions`. */
export function useWalletBalance() {
  const { authenticated, privyUser } = useSession();
  const accountKey = authenticated ? privyUser?.id ?? null : null;

  return useQuery({
    // Scope private financial data to the authenticated account. The fixed
    // query key could briefly show the previous user's cached balance after
    // an account switch while the new request was still loading.
    queryKey: ['wallet-balance', accountKey],
    queryFn: async () => {
      const result = await getWalletBalance();
      // Refuse an unexpected account response rather than cache/show it under
      // the active user's key (normally prevented by the authenticated API).
      if (result.accountId && result.accountId !== accountKey) {
        throw new Error('Wallet balance account mismatch. Please refresh your session.');
      }
      return result;
    },
    // During Privy's wallet bootstrap the authenticated user can already
    // have a server-side wallet while its address has not reached the
    // session context yet. Let the API resolve that state instead of
    // keeping account setup stuck behind a disabled query.
    enabled: authenticated && Boolean(accountKey),
  });
}
