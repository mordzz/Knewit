import { useFundWallet } from '@privy-io/expo/ui';
import { polygon } from '@/app/config/chains';
import { useQueryClient } from '@tanstack/react-query';
import { useEffect, useRef, useState } from 'react';
import { useWallet } from '@/hooks/useWallet';
import {
  forwardCardDeposit,
  getCardDepositState,
  POLYGON_USDC_NATIVE,
} from '@/features/wallet/services/walletService';
import { creditGuestFunds, isGuestSession } from '@/services/guest/guestBackend';
import { env } from '@/app/config/env';

/** Pre-filled card purchase — just above MoonPay's minimum order; the
 * user can still change it on MoonPay's screen. */
const DEFAULT_CARD_DEPOSIT_USDC = '20';
/** A MoonPay purchase usually lands within a few minutes. */
const LANDING_POLL_MS = 10_000;
const LANDING_POLL_ATTEMPTS = 36;

/**
 * Opens Privy's own funding flow (`useFundWallet` from
 * `@privy-io/expo/ui` — requires `<PrivyElements />`, mounted once in
 * `AppProviders`) with card as the payment method and MoonPay as the preferred
 * provider. The route is: card → MoonPay → native USDC in the user's
 * embedded wallet → sent to their Polymarket bridge deposit address for
 * that chain (backend, Privy-sponsored gas) → pUSD in the Deposit Wallet.
 * The transfer needs gas, so card deposits only run with
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
      const state = await getCardDepositState();
      if (state.unavailable) {
        throw new Error('Your wallet is not ready yet. Please wait a moment and try again.');
      }
      // USDC from an earlier purchase is still in the embedded wallet —
      // send it on instead of opening another card purchase.
      if (state.usdcBalance > 0) {
        setStage('converting');
        await forwardOrThrow();
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

      setStage('waiting');
      let landed = false;
      for (let attempt = 0; attempt < LANDING_POLL_ATTEMPTS && !landed; attempt += 1) {
        await new Promise((resolve) => setTimeout(resolve, LANDING_POLL_MS));
        if (!activeRef.current) return;
        const current = await getCardDepositState().catch(() => null);
        landed = Boolean(current && current.usdcBalance > 0);
      }
      if (!activeRef.current) return;
      if (!landed) {
        throw new Error('Your purchase is still processing. When it arrives, tap Deposit again to add it.');
      }

      setStage('converting');
      await forwardOrThrow();
      await refreshBalances();
    } finally {
      if (activeRef.current) setStage('idle');
    }
  };

  const forwardOrThrow = async () => {
    const result = await forwardCardDeposit();
    if (result.status !== 'forwarded') {
      throw new Error('The purchase is below the bridge minimum, so it stays in your wallet for now.');
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
