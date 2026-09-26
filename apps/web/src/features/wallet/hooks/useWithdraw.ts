'use client';

import { useEffect, useRef } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useSession } from '@/hooks/useSession';
import { withdrawTradingBalance, type WithdrawInput } from '@/features/wallet/lib/walletService';

export function useWithdraw() {
  const { address } = useSession();
  const queryClient = useQueryClient();
  const activeRef = useRef(true);
  useEffect(() => {
    activeRef.current = true;
    return () => {
      activeRef.current = false;
    };
  }, []);

  const withdraw = async ({ recipient, amount, chainId, tokenAddress }: WithdrawInput) => {
    if (!address) throw new Error('Connect a wallet before withdrawing.');
    if (!/^\d+(?:\.\d{1,6})?$/.test(amount.trim()) || Number(amount) <= 0) {
      throw new Error('Enter a valid amount with up to 6 decimal places.');
    }
    const result = await withdrawTradingBalance({ recipient: recipient.trim(), amount: amount.trim(), chainId, tokenAddress });
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

  return { withdraw, canWithdraw: Boolean(address) };
}
