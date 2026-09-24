import { useFundWallet } from '@privy-io/expo/ui';
import { polygon } from '@/app/config/chains';
import { useQueryClient } from '@tanstack/react-query';
import { useEffect, useRef, useState } from 'react';
import { useWallet } from '@/hooks/useWallet';
import {
  convertToCollateral,
  getCryptoDepositInfo,
  POLYGON_USDC_NATIVE,
} from '@/features/wallet/services/walletService';
import { creditGuestFunds, isGuestSession } from '@/services/guest/guestBackend';
import { env } from '@/app/config/env';

/** Pre-filled card purchase — just above MoonPay's minimum order; the
 * user can still change it on MoonPay's screen. */
const DEFAULT_CARD_DEPOSIT_USDC = '20';
/** Below this, USDC.e in the Deposit Wallet is dust — not worth a wrap. */
const MIN_CONVERTIBLE_USDC = 0.01;
/** MoonPay + the bridge usually finish within a few minutes. */
const LANDING_POLL_MS = 10_000;
const LANDING_POLL_ATTEMPTS = 36;

/**
 * Opens Privy's own funding flow (`useFundWallet` from
 * `@privy-io/expo/ui` — requires `<PrivyElements />`, mounted once in
 * `AppProviders`) with card as the payment method and MoonPay as the preferred
 * provider. The route is: card → MoonPay → native USDC in the user's
 * embedded wallet → forwarded to their Polymarket bridge address (backend,
 * Privy-sponsored gas) → USDC.e in the Deposit Wallet → wrapped into pUSD.
 * The forward needs gas, so card deposits only run with
 * `EXPO_PUBLIC_CARD_DEPOSIT_ENABLED=true` (and Privy gas sponsorship on);
 * otherwise Deposit opens crypto deposit instead (`DepositSheet`).
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
      if (!env.cardDepositEnabled) throw new Error('Card deposits are not available yet.');
      if (!address) throw new Error('Connect a wallet before depositing.');
      const info = await getCryptoDepositInfo();
      if (info.unavailable) {
        throw new Error(
          'Your trading wallet is not ready yet. Please wait a moment and try again.'
        );
      }
      const startingUsdcE = info.usdcE.balance;
      if (startingUsdcE >= MIN_CONVERTIBLE_USDC || info.usdc.balance >= MIN_CONVERTIBLE_USDC) {
        // Funds from an earlier purchase are still on their way (in the
        // embedded wallet or already in the Deposit Wallet) — move them on
        // instead of opening another card purchase.
        setStage('converting');
        await convertOrThrow();
        await refreshBalances();
        return;
      }

      await fundWallet({
        address,
        chain: polygon,
        asset: { tokenAddress: POLYGON_USDC_NATIVE },
        // Without this, Privy falls back to the dashboard's default
        // recommended amount, which MoonPay can show below its ~18 USDC minimum.
        amount: DEFAULT_CARD_DEPOSIT_USDC,
        defaultPaymentMethod: 'card',
        card: { preferredProvider: 'moonpay' },
        moonpay: { uiConfig: { accentColor: '#FFE506', theme: 'dark' } },
      });

      // Wait for the purchase: once native USDC is in the embedded wallet,
      // ask the backend to forward it to the bridge; once USDC.e reaches the
      // Deposit Wallet, it's ready to wrap.
      setStage('waiting');
      let landed = false;
      for (let attempt = 0; attempt < LANDING_POLL_ATTEMPTS && !landed; attempt += 1) {
        await new Promise((resolve) => setTimeout(resolve, LANDING_POLL_MS));
        if (!activeRef.current) return;
        const current = await getCryptoDepositInfo().catch(() => null);
        if (!current) continue;
        if (current.usdc.balance >= MIN_CONVERTIBLE_USDC) {
          await convertToCollateral().catch(() => null);
        }
        landed = current.usdcE.balance > startingUsdcE;
      }
      if (!activeRef.current) return;
      if (!landed) {
        throw new Error(
          info.autoConvert
            ? 'Your purchase is still processing. It will be added to your trading balance automatically when it arrives.'
            : 'Your purchase is still processing. When it arrives, tap Deposit again to add it to your trading balance.'
        );
      }

      setStage('converting');
      await convertOrThrow();
      await refreshBalances();
    } finally {
      if (activeRef.current) setStage('idle');
    }
  };

  const convertOrThrow = async () => {
    const conversion = await convertToCollateral();
    if (conversion.status !== 'converted') {
      throw new Error(
        conversion.errorMessage ??
          'Conversion could not be confirmed. Check your wallet and trading balance before trying again.'
      );
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
