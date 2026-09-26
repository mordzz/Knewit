'use client';

import { useEffect, useRef, useState } from 'react';
import { useAddFunds } from '@privy-io/react-auth';
import { useQueryClient } from '@tanstack/react-query';
import { useSession } from '@/hooks/useSession';
import {
  forwardCardDeposit,
  getCardDepositState,
  POLYGON_CAIP2,
  POLYGON_USDC_NATIVE,
} from '@/features/wallet/lib/walletService';
import { cardDepositEnabled } from '@/lib/cardDeposit';

export type BuyWithCardStage = 'idle' | 'buying' | 'waiting' | 'converting';

/** Thrown for this hook's own honest, already-user-facing messages (the
 * purchase landed but conversion is still pending, etc.)  distinguished
 * from `ApiRequestError`/raw Privy errors so `useBuyWithCardFlow` can show
 * this message verbatim instead of running it through `depositErrors.ts`'s
 * generic Privy-quote-failure copy, which would be misleading here. */
export class BuyFlowError extends Error {}

const POLL_INTERVAL_MS = 4000;
const POLL_ATTEMPTS = 15;
/** A card purchase usually lands within a few minutes. */
const LANDING_POLL_MS = 10_000;
const LANDING_POLL_ATTEMPTS = 36;

/**
 * `isActive` is checked on every tick so a poll started before the
 * triggering component unmounts (navigation, sign-out, switching
 * accounts) stops cleanly instead of running to completion in the
 * background  a plain `window.setInterval` has no idea a React component
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
 * asset Stripe/MoonPay actually sell) into the user's embedded wallet. The
 * backend then sends it to the user's Polymarket bridge deposit address for
 * that chain (`POST /api/wallet/card-deposit`, Privy-sponsored gas), and the
 * bridge delivers it to the Deposit Wallet as pUSD. The transfer needs gas,
 * so this only runs with `NEXT_PUBLIC_CARD_DEPOSIT_ENABLED=true`. `stage`
 * and the thrown error reflect exactly where things stopped.
 */
export function useBuyWithCard() {
  const { address } = useSession();
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
    if (!cardDepositEnabled) throw new BuyFlowError('Card deposits are not available yet.');
    if (!address) throw new BuyFlowError('Connect a wallet before buying.');

    setStage('buying');
    try {
      const state = await getCardDepositState();
      if (state.unavailable) {
        throw new BuyFlowError('Your wallet is not ready yet. Please wait a moment and try again.');
      }
      // USDC from an earlier purchase is still in the embedded wallet  send
      // it on instead of opening another onramp.
      if (state.usdcBalance > 0) {
        setStage('converting');
        await forwardOrThrow();
        await refreshTradingBalance();
        return;
      }

      await addFunds({
        destination: { address, chain: POLYGON_CAIP2, asset: POLYGON_USDC_NATIVE },
        fiat: { source: { defaultAsset: 'usd' } },
      });

      setStage('waiting');
      const landed = await pollUntil(
        async () => (await getCardDepositState()).usdcBalance > 0,
        () => activeRef.current,
        LANDING_POLL_MS,
        LANDING_POLL_ATTEMPTS
      );
      if (!activeRef.current) return;
      if (!landed) {
        throw new BuyFlowError('Your purchase is still processing. When it arrives, tap Deposit again to add it.');
      }

      setStage('converting');
      await forwardOrThrow();
      await refreshTradingBalance();
    } finally {
      if (activeRef.current) setStage('idle');
    }
  };

  const forwardOrThrow = async () => {
    const result = await forwardCardDeposit();
    if (result.status !== 'forwarded') {
      throw new BuyFlowError('The purchase is below the bridge minimum, so it stays in your wallet for now.');
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
