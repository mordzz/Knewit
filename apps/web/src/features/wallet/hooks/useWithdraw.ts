'use client';

import { useEffect, useRef } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useSession } from '@/hooks/useSession';
import { withdrawTradingBalance, POLYGON_CAIP2 } from '@/features/wallet/lib/walletService';

export function useWithdraw() {
  const { address, isGuest } = useSession();
  const queryClient = useQueryClient();
  const activeRef = useRef(true);
  useEffect(() => {
    activeRef.current = true;
    return () => {
      activeRef.current = false;
    };
  }, []);

  const withdraw = async (recipient: string, amount: string, destination?: string) => {
    if (isGuest) throw new Error('Withdraw is unavailable in guest mode.');
    if (!address) throw new Error('Connect a wallet before withdrawing.');
    if (!/^\d+(?:\.\d{1,6})?$/.test(amount.trim()) || Number(amount) <= 0) {
      throw new Error('Enter a valid USDC amount with up to 6 decimal places.');
    }
    // Refetch first — the cached balance can be stale (e.g. right after a
    // deposit, or a withdrawal from another tab), and validating against it
    // without refreshing can wrongly allow or deny the withdrawal.
    const result = await withdrawTradingBalance({ recipient, amount: amount.trim(), destination });
    // On-chain confirmation lags behind `sendTransaction` resolving, the same
    // as the deposit flow — poll for a short window instead of a single
    // immediate invalidate so the balance UI catches the update.
    await queryClient.invalidateQueries({ queryKey: ['wallet-balance'] });
    let attempts = 0;
    const pollTimer = window.setInterval(() => {
      attempts += 1;
      if (!activeRef.current) {
        window.clearInterval(pollTimer);
        return;
      }
      void queryClient.invalidateQueries({ queryKey: ['wallet-balance'] });
      if (attempts >= 15) window.clearInterval(pollTimer);
    }, 4000);
    return result;
  };

  return { withdraw, canWithdraw: Boolean(address) && !isGuest, chain: POLYGON_CAIP2 };
}
