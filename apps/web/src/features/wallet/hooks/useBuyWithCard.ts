'use client';

import { useEffect, useRef, useState } from 'react';
import { useAddFunds } from '@privy-io/react-auth';
import { useQueryClient } from '@tanstack/react-query';
import { useSession } from '@/hooks/useSession';
import {
  convertToCollateral,
  getCryptoDepositInfo,
  POLYGON_CAIP2,
  POLYGON_USDC_NATIVE,
} from '@/features/wallet/lib/walletService';
import { creditGuestFunds } from '@/lib/guest/guestBackend';
import { tradingEnabled, tradingUnavailableMessage } from '@/lib/tradingAvailability';
import { cardDepositEnabled } from '@/lib/cardDeposit';

export type BuyWithCardStage = 'idle' | 'buying' | 'waiting' | 'converting';

/** Thrown for this hook's own honest, already-user-facing messages (the
 * purchase landed but conversion is still pending, etc.) — distinguished
 * from `ApiRequestError`/raw Privy errors so `useBuyWithCardFlow` can show
 * this message verbatim instead of running it through `depositErrors.ts`'s
 * generic Privy-quote-failure copy, which would be misleading here. */
export class BuyFlowError extends Error {}

const POLL_INTERVAL_MS = 4000;
const POLL_ATTEMPTS = 15;
/** Card purchase + bridge usually land within a few minutes. */
const LANDING_POLL_MS = 10_000;
const LANDING_POLL_ATTEMPTS = 36;
/** Below this, USDC.e in the Deposit Wallet is dust — not worth a wrap. */
const MIN_CONVERTIBLE_USDC = 0.01;

/**
 * `isActive` is checked on every tick so a poll started before the
 * triggering component unmounts (navigation, sign-out, switching
 * accounts) stops cleanly instead of running to completion in the
 * background — a plain `window.setInterval` has no idea a React component
 * went away, and calling back into it later re-enters stale closures
 * (`setStage`/error handlers) and fires their side effects, like a
 * `console.error`, for a session that's no longer on screen.
 */
function pollUntil(
  check: () => Promise<boolean>,
  isActive: () => boolean,
  intervalMs = POLL_INTERVAL_MS,
  maxAttempts = POLL_ATTEMPTS
): Promise<boolean> {
  return new Promise((resolve) => {
    let attempts = 0;
    const timer = window.setInterval(async () => {
      if (!isActive()) {
        window.clearInterval(timer);
        resolve(false);
        return;
      }
      attempts += 1;
      const done = await check().catch(() => false);
      if (!isActive()) {
        window.clearInterval(timer);
        resolve(false);
        return;
      }
      if (done || attempts >= maxAttempts) {
        window.clearInterval(timer);
        resolve(done);
      }
    }, intervalMs);
  });
}

/**
 * Buys **native** USDC on Polygon via Privy's card/bank onramp (the only
 * asset Stripe/MoonPay actually sell — bridged USDC.e is rejected outright)
 * into the user's embedded wallet. The backend then forwards it to their
 * Polymarket bridge address (Privy-sponsored gas), the bridge delivers
 * USDC.e to the Deposit Wallet, and that's wrapped into pUSD — all through
 * `POST /api/wallet/convert-to-collateral`. The forward needs gas, so this
 * only runs with `NEXT_PUBLIC_CARD_DEPOSIT_ENABLED=true` (and Privy gas
 * sponsorship on). `stage` and the thrown error reflect exactly where
 * things stopped, never a fabricated "done".
 */
export function useBuyWithCard() {
  const { address, isGuest } = useSession();
  const { addFunds } = useAddFunds();
  const queryClient = useQueryClient();
  const [stage, setStage] = useState<BuyWithCardStage>('idle');
  const activeRef = useRef(true);
  useEffect(() => {
    activeRef.current = true;
    return () => {
      activeRef.current = false;
    };
  }, []);

  const canBuy = Boolean(address);

  const buyWithCard = async () => {
    // This is the app's one "Deposit" entry point (Settings, Wallet,
    // TopHeader, Callouts all call it), so guest mode has to be handled
    // here too, not just in `useDeposit`'s crypto path — otherwise guest
    // demo accounts can never add funds at all. Guest mode never touches
    // real trading, so the real-trading kill switch doesn't apply to it.
    if (isGuest) {
      setStage('buying');
      try {
        creditGuestFunds(500);
        await refreshTradingBalance();
      } finally {
        setStage('idle');
      }
      return;
    }
    if (!tradingEnabled) throw new BuyFlowError(tradingUnavailableMessage);
    if (!cardDepositEnabled) throw new BuyFlowError('Card deposits are not available yet.');
    if (!address) throw new BuyFlowError('Connect a wallet before buying.');

    setStage('buying');
    try {
      const info = await getCryptoDepositInfo();
      if (info.unavailable) {
        throw new BuyFlowError('Your trading wallet is not ready yet. Please wait a moment and try again.');
      }
      // Funds from an earlier purchase are still on their way (in the
      // embedded wallet or already in the Deposit Wallet) — move them on
      // instead of opening another onramp and risking a duplicate.
      const startingUsdcE = info.usdcE.balance;
      if (startingUsdcE >= MIN_CONVERTIBLE_USDC || info.usdc.balance >= MIN_CONVERTIBLE_USDC) {
        setStage('converting');
        const result = await convertToCollateral();
        if (result.status !== 'converted') {
          throw new BuyFlowError(result.errorMessage ?? 'Conversion could not be confirmed. Check your wallet and trading balance before trying again.');
        }
        await refreshTradingBalance();
        return;
      }

      await addFunds({
        destination: { address, chain: POLYGON_CAIP2, asset: POLYGON_USDC_NATIVE },
        fiat: { source: { defaultAsset: 'usd' } },
      });

      // Once native USDC is in the embedded wallet, ask the backend to
      // forward it to the bridge; once USDC.e reaches the Deposit Wallet,
      // it's ready to wrap.
      setStage('waiting');
      const landed = await pollUntil(
        async () => {
          const current = await getCryptoDepositInfo();
          if (current.usdc.balance >= MIN_CONVERTIBLE_USDC) await convertToCollateral().catch(() => null);
          return current.usdcE.balance > startingUsdcE;
        },
        () => activeRef.current,
        LANDING_POLL_MS,
        LANDING_POLL_ATTEMPTS
      );
      if (!activeRef.current) return;
      if (!landed) {
        throw new BuyFlowError(
          info.autoConvert
            ? 'Your purchase is still processing. It will be added to your trading balance automatically when it arrives.'
            : 'Your purchase is still processing. When it arrives, tap Deposit again to add it to your trading balance.'
        );
      }

      setStage('converting');
      const result = await convertToCollateral();
      if (result.status !== 'converted') {
        throw new BuyFlowError(result.errorMessage ?? 'Conversion could not be confirmed. Check your wallet and trading balance before trying again.');
      }

      await refreshTradingBalance();
    } finally {
      if (activeRef.current) setStage('idle');
    }
  };

  const refreshTradingBalance = async () => {
    // The swap can execute before it is indexed by the CLOB, so keep
    // refreshing briefly instead of requiring users to reload the screen.
    await queryClient.invalidateQueries({ queryKey: ['wallet-balance'] });
    await queryClient.invalidateQueries({ queryKey: ['positions'] });
    let attempts = 0;
    const balancePoll = window.setInterval(() => {
      attempts += 1;
      if (!activeRef.current) {
        window.clearInterval(balancePoll);
        return;
      }
      void queryClient.invalidateQueries({ queryKey: ['wallet-balance'] });
      void queryClient.invalidateQueries({ queryKey: ['positions'] });
      if (attempts >= POLL_ATTEMPTS) window.clearInterval(balancePoll);
    }, POLL_INTERVAL_MS);
  };

  return { buyWithCard, canBuy, stage };
}
