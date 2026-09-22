'use client';

import { useEffect, useRef } from 'react';
import { useAddFunds } from '@privy-io/react-auth';
import { useQueryClient } from '@tanstack/react-query';
import { useWalletBalance } from '@/features/wallet/hooks/useWalletBalance';
import { useSession } from '@/hooks/useSession';
import { getDepositWallet, wrapDepositCollateral, POLYGON_CAIP2, POLYGON_USDC_E } from '@/features/wallet/lib/walletService';
import { creditGuestFunds } from '@/lib/guest/guestBackend';
import { tradingEnabled, tradingUnavailableMessage } from '@/lib/tradingAvailability';

/**
 * Opens Privy's `useAddFunds` crypto-transfer flow — send USDC.e directly
 * from another wallet or exchange — with this app's Polymarket Deposit
 * Wallet as the destination (docs/WALLET.md, "Deposit").
 *
 * **Crypto only, deliberately no `fiat` option here**: bridged USDC.e on
 * Polygon isn't purchasable via card/bank at all — confirmed live,
 * Stripe rejects it outright ("Unsupported asset for Stripe onramp:
 * 0x2791…84174 on eip155:137") regardless of Dashboard configuration, a
 * hard limitation of that token itself, not something a toggle fixes.
 * Card/bank purchases go through `useBuyWithCard` instead, which buys
 * *native* USDC (what onramp providers actually sell) and converts it to
 * USDC.e via a backend swap.
 *
 * After the flow resolves, the balance and positions queries are
 * invalidated so the new funds appear as soon as Privy reports them (Privy
 * notes funds can still take a few minutes to land).
 *
 * Requires the funding feature to be enabled in the Privy Dashboard;
 * without that, `addFunds` rejects with Privy's real error — surfaced to
 * the user, never faked as success.
 *
 * Guest mode has no Privy funding flow to open, so Deposit credits demo
 * funds in the sandbox instead (see docs/DECISIONS.md, "Guest Mode").
 */
export function useDeposit() {
  const { address, isGuest } = useSession();
  const { addFunds } = useAddFunds();
  const balance = useWalletBalance();
  const queryClient = useQueryClient();
  const activeRef = useRef(true);
  useEffect(() => {
    activeRef.current = true;
    return () => {
      activeRef.current = false;
    };
  }, []);

  const collateral = balance.data?.collateral ?? POLYGON_USDC_E;
  const canDeposit = Boolean(address);

  const deposit = async () => {
    if (isGuest) {
      // Guest mode credits demo funds in the local sandbox — it never
      // touches real trading, so the real-trading kill switch doesn't apply.
      creditGuestFunds(500);
      await queryClient.invalidateQueries({ queryKey: ['wallet-balance'] });
      await queryClient.invalidateQueries({ queryKey: ['positions'] });
      return;
    }
    if (!tradingEnabled) throw new Error(tradingUnavailableMessage);
    if (!address) throw new Error('Connect a wallet before depositing.');
    const depositWallet = await getDepositWallet();
    if (depositWallet.unavailable || !depositWallet.address) {
      throw new Error('Your trading wallet is not ready yet. Please wait a moment and try again.');
    }
    await addFunds({
      destination: { address: depositWallet.address, chain: POLYGON_CAIP2, asset: collateral },
      crypto: {},
    });
    let wrapped = false;
    for (let attempt = 0; attempt < 15; attempt += 1) {
      if (!activeRef.current) return;
      const result = await wrapDepositCollateral();
      if (result.status === 'converted') {
        wrapped = true;
        break;
      }
      if (result.status === 'failed') throw new Error(result.errorMessage ?? 'Could not convert the deposit to trading balance.');
      await new Promise((resolve) => window.setTimeout(resolve, 4000));
      if (!activeRef.current) return;
    }
    if (!wrapped) throw new Error('Your USDC.e deposit is still arriving. Tap Deposit again shortly to convert it to trading balance.');
    // The flow can resolve before the funds are actually indexed on
    // Polymarket's side (fiat: 'submitted' rather than settled; crypto:
    // on-chain confirmation + CLOB indexing lag even after 'completed'), so a
    // single invalidate right after it resolves often refetches the
    // pre-deposit balance. Keep re-invalidating for a short window, the same
    // way useAutoWalletSetup polls for signer consent, so the UI catches the
    // update once it lands instead of requiring a manual refresh.
    await queryClient.invalidateQueries({ queryKey: ['wallet-balance'] });
    await queryClient.invalidateQueries({ queryKey: ['positions'] });
    let attempts = 0;
    const pollTimer = window.setInterval(() => {
      attempts += 1;
      if (!activeRef.current) {
        window.clearInterval(pollTimer);
        return;
      }
      void queryClient.invalidateQueries({ queryKey: ['wallet-balance'] });
      void queryClient.invalidateQueries({ queryKey: ['positions'] });
      if (attempts >= 15) window.clearInterval(pollTimer);
    }, 4000);
  };

  return { deposit, canDeposit };
}
