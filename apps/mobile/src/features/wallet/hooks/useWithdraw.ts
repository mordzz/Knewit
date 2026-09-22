import { useQueryClient } from '@tanstack/react-query';
import { useEffect, useRef } from 'react';
import { useWallet } from '@/hooks/useWallet';
import { useAuth } from '@/hooks/useAuth';
import { withdrawTradingBalance } from '@/features/wallet/services/walletService';

export function useWithdraw() {
  const { address } = useWallet();
  const { isGuest } = useAuth();
  const queryClient = useQueryClient();
  const activeRef = useRef(true);
  useEffect(() => {
    activeRef.current = true;
    return () => {
      activeRef.current = false;
    };
  }, []);

  const withdraw = async (recipient: string, amount: string) => {
    if (isGuest) throw new Error('Withdraw is unavailable in guest mode.');
    if (!address) throw new Error('Connect a wallet before withdrawing.');
    if (!/^\d+(?:\.\d{1,6})?$/.test(amount.trim()) || Number(amount) <= 0) {
      throw new Error('Enter a valid USDC amount with up to 6 decimal places.');
    }
    // Refetch first — the cached balance can be stale (e.g. right after a
    // deposit, or a withdrawal from another device), and validating
    // against it without refreshing can wrongly allow or deny the
    // withdrawal.
    const result = await withdrawTradingBalance({ recipient, amount: amount.trim() });
    // On-chain confirmation lags behind the request resolving, the same as
    // the deposit flow — poll for a short window instead of a single
    // immediate invalidate so the balance UI catches the update.
    await queryClient.invalidateQueries({ queryKey: ['wallet-balance'] });
    let attempts = 0;
    const pollTimer = setInterval(() => {
      attempts += 1;
      if (!activeRef.current) {
        clearInterval(pollTimer);
        return;
      }
      void queryClient.invalidateQueries({ queryKey: ['wallet-balance'] });
      if (attempts >= 15) clearInterval(pollTimer);
    }, 4000);
    return result;
  };

  return { withdraw };
}
