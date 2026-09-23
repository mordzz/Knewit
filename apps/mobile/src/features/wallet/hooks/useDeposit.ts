import { useFundWallet } from '@privy-io/expo/ui';
import { polygon } from '@/app/config/chains';
import { useQueryClient } from '@tanstack/react-query';
import { useEffect, useRef, useState } from 'react';
import { useWallet } from '@/hooks/useWallet';
import {
  convertToCollateral,
  getNativeUsdcBalance,
  POLYGON_USDC_NATIVE,
} from '@/features/wallet/services/walletService';
import { creditGuestFunds, isGuestSession } from '@/services/guest/guestBackend';
import { env } from '@/app/config/env';

/**
 * Opens Privy's own funding flow (`useFundWallet` from
 * `@privy-io/expo/ui` — requires `<PrivyElements />`, mounted once in
 * `AppProviders`) with card as the payment method and MoonPay as the preferred
 * provider. It buys native USDC into the embedded wallet, then converts it to
 * USDC.e in the Polymarket Deposit Wallet, matching the web card flow.
 *
 * Requires the funding feature + payment methods to be enabled in the
 * Privy Dashboard; without that, `fundWallet` rejects with Privy's real
 * error — surfaced to the user, never faked as success.
 */
export function useDeposit() {
  const { fundWallet } = useFundWallet();
  const { isConnected, address } = useWallet();
  const queryClient = useQueryClient();
  const [stage, setStage] = useState<'idle' | 'buying' | 'waiting' | 'converting'>('idle');
  const activeRef = useRef(true);
  useEffect(() => {
    activeRef.current = true;
    return () => {
      activeRef.current = false;
    };
  }, []);

  const canDeposit = isConnected && Boolean(address);

  const deposit = async () => {
    if (stage !== 'idle') return;
    setStage('buying');
    try {
    if (!env.tradingEnabled) throw new Error('Trading is temporarily unavailable.');
    // No Privy funding flow exists for a guest account — Deposit credits
    // demo funds so the trade → position → callout loop stays testable.
    if (isGuestSession()) {
      creditGuestFunds(500);
      await queryClient.invalidateQueries({ queryKey: ['wallet-balance'] });
      await queryClient.invalidateQueries({ queryKey: ['positions'] });
      return;
    }
    if (!address) throw new Error('Connect a wallet before depositing.');
    const startingBalance = await getNativeUsdcBalance();
    if (startingBalance.usdc > 0) {
      // Reuse Deposit for a purchase that arrived after the previous wait
      // ended. Converting first also prevents accidentally starting a second
      // card purchase while funds are already waiting in the embedded wallet.
      setStage('converting');
      const conversion = await convertToCollateral();
      if (conversion.status !== 'converted') {
        throw new Error(conversion.errorMessage ?? 'Conversion could not be confirmed. Check your wallet and trading balance before trying again.');
      }
      await refreshBalances();
      return;
    }

    await fundWallet({
      address,
      chain: polygon,
      asset: { tokenAddress: POLYGON_USDC_NATIVE },
      defaultPaymentMethod: 'card',
      card: { preferredProvider: 'moonpay' },
      moonpay: { uiConfig: { accentColor: '#FFE506', theme: 'dark' } },
    });

    setStage('waiting');
    let attempts = 0;
    const landed = await new Promise<boolean>((resolve) => {
      const pollTimer = setInterval(async () => {
        if (!activeRef.current) {
          clearInterval(pollTimer);
          resolve(false);
          return;
        }
        attempts += 1;
        const currentBalance = await getNativeUsdcBalance().catch(() => null);
        if (!activeRef.current) {
          clearInterval(pollTimer);
          resolve(false);
          return;
        }
        if ((currentBalance?.usdc ?? 0) > startingBalance.usdc || attempts >= 15) {
          clearInterval(pollTimer);
          resolve((currentBalance?.usdc ?? 0) > startingBalance.usdc);
        }
      }, 4000);
    });
    if (!activeRef.current) return;
    if (!landed) {
      throw new Error(
        'Your purchase is still processing. When USDC arrives, tap Deposit again to add it to your trading balance.'
      );
    }

    setStage('converting');
    const conversion = await convertToCollateral();
    if (conversion.status !== 'converted') {
      throw new Error(conversion.errorMessage ?? 'Conversion could not be confirmed. Check your wallet and trading balance before trying again.');
    }

    await refreshBalances();
    } finally {
      if (activeRef.current) setStage('idle');
    }
  };

  const refreshBalances = async () => {
    // Funding and conversion can resolve before their respective balance
    // indexes update, so refresh balance and positions for a short window.
    await queryClient.invalidateQueries({ queryKey: ['wallet-balance'] });
    await queryClient.invalidateQueries({ queryKey: ['positions'] });
    let refreshAttempts = 0;
    const refreshTimer = setInterval(() => {
      refreshAttempts += 1;
      if (!activeRef.current) {
        clearInterval(refreshTimer);
        return;
      }
      void queryClient.invalidateQueries({ queryKey: ['wallet-balance'] });
      void queryClient.invalidateQueries({ queryKey: ['positions'] });
      if (refreshAttempts >= 15) clearInterval(refreshTimer);
    }, 4000);
  };

  return { deposit, canDeposit, stage };
}
