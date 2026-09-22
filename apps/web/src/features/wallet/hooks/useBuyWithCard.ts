'use client';

import { useEffect, useRef, useState } from 'react';
import { useAddFunds } from '@privy-io/react-auth';
import { useQueryClient } from '@tanstack/react-query';
import { useSession } from '@/hooks/useSession';
import {
  getNativeUsdcBalance,
  convertToCollateral,
  POLYGON_CAIP2,
  POLYGON_USDC_NATIVE,
} from '@/features/wallet/lib/walletService';
import { creditGuestFunds } from '@/lib/guest/guestBackend';
import { tradingEnabled, tradingUnavailableMessage } from '@/lib/tradingAvailability';

export type BuyWithCardStage = 'idle' | 'buying' | 'waiting' | 'converting';

/** Thrown for this hook's own honest, already-user-facing messages (the
 * purchase landed but conversion is still pending, etc.) — distinguished
 * from `ApiRequestError`/raw Privy errors so `useBuyWithCardFlow` can show
 * this message verbatim instead of running it through `depositErrors.ts`'s
 * generic Privy-quote-failure copy, which would be misleading here. */
export class BuyFlowError extends Error {}

const POLL_INTERVAL_MS = 4000;
const POLL_ATTEMPTS = 15;

/**
 * `isActive` is checked on every tick so a poll started before the
 * triggering component unmounts (navigation, sign-out, switching
 * accounts) stops cleanly instead of running to completion in the
 * background — a plain `window.setInterval` has no idea a React component
 * went away, and calling back into it later re-enters stale closures
 * (`setStage`/error handlers) and fires their side effects, like a
 * `console.error`, for a session that's no longer on screen.
 */
function pollUntil(check: () => Promise<boolean>, isActive: () => boolean): Promise<boolean> {
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
      if (done || attempts >= POLL_ATTEMPTS) {
        window.clearInterval(timer);
        resolve(done);
      }
    }, POLL_INTERVAL_MS);
  });
}

/**
 * Buys **native** USDC on Polygon via Privy's card/bank onramp (the only
 * asset Stripe/MoonPay actually sell — bridged USDC.e is rejected outright,
 * see `useDeposit`'s doc comment) into the user's own embedded wallet, then
 * converts it to USDC.e in the Polymarket Deposit Wallet via a backend swap
 * (`POST /api/wallet/convert-to-collateral`). Two real steps, surfaced
 * honestly: if the conversion step fails, the native USDC is still in the
 * user's own wallet — `stage` and the thrown error reflect exactly where
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
    if (!address) throw new BuyFlowError('Connect a wallet before buying.');

    setStage('buying');
    try {
      // If a previous card purchase landed but its automatic conversion did
      // not run (or arrived after polling ended), reuse the same Deposit
      // action to convert it. Do not open another onramp and risk a duplicate.
      const pendingFunds = await getNativeUsdcBalance();
      if (pendingFunds.usdc > 0) {
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

      setStage('waiting');
      const landed = await pollUntil(async () => {
        const balance = await getNativeUsdcBalance();
        return balance.usdc > 0;
      }, () => activeRef.current);
      if (!activeRef.current) return;
      if (!landed) {
        throw new BuyFlowError(
          'Your purchase is still processing. When USDC arrives, tap Deposit again to add it to your trading balance.'
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
