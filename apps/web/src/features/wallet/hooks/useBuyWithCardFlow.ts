'use client';

import { useEffect, useRef, useState } from 'react';
import { useBuyWithCard, BuyFlowError } from '@/features/wallet/hooks/useBuyWithCard';
import { isUserCancelledFunding } from '@/features/auth/lib/privyErrors';
import { getDepositErrorMessage, logDepositFailure } from '@/features/wallet/lib/depositErrors';

/** Loading/error wrapper around the card/bank purchase flow, shared by the
 * app header, Callouts, Wallet, and Settings entry points. */
export function useBuyWithCardFlow() {
  const { buyWithCard, canBuy, stage } = useBuyWithCard();
  const [buyError, setBuyError] = useState<string | null>(null);
  const activeRef = useRef(true);
  useEffect(() => {
    activeRef.current = true;
    return () => {
      activeRef.current = false;
    };
  }, []);

  const handleBuyWithCard = async () => {
    setBuyError(null);
    try {
      await buyWithCard();
    } catch (error) {
      // `buyWithCard`'s own poll can still resolve/reject after this
      // component unmounts (its `window.setInterval` isn't tied to React's
      // lifecycle)  skip logging/surfacing a result nobody is looking at.
      if (!activeRef.current) return;
      if (isUserCancelledFunding(error)) return; // closing Privy's modal is not a failure
      if (error instanceof BuyFlowError) {
        setBuyError(error.message);
        return;
      }
      logDepositFailure(error);
      setBuyError(getDepositErrorMessage(error));
    }
  };

  return { isBuying: stage !== 'idle', stage, buyError, canBuy, handleBuyWithCard };
}
