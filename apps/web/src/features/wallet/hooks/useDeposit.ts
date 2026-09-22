'use client';

import { useAddFunds } from '@privy-io/react-auth';
import { useQueryClient } from '@tanstack/react-query';
import { useWalletBalance } from '@/features/wallet/hooks/useWalletBalance';
import { useSession } from '@/hooks/useSession';
import { getDepositWallet, POLYGON_CAIP2, POLYGON_USDC_E } from '@/features/wallet/lib/walletService';
import { creditGuestFunds } from '@/lib/guest/guestBackend';
import { tradingEnabled, tradingUnavailableMessage } from '@/lib/tradingAvailability';

/**
 * Opens Privy's own funding flow (`useAddFunds` — fiat card on-ramp and
 * crypto deposit in one modal) with this app's Polymarket Deposit Wallet
 * as the destination, in USDC.e — the collateral the trading flow spends
 * (docs/WALLET.md, "Deposit"). After the flow resolves, the balance and
 * positions queries are invalidated so the new funds appear as soon as
 * Privy reports them (Privy notes funds can still take a few minutes to
 * land).
 *
 * Requires the funding feature + payment methods to be enabled in the
 * Privy Dashboard; without that, `addFunds` rejects with Privy's real
 * error — surfaced to the user, never faked as success.
 *
 * Guest mode has no Privy funding flow to open, so Deposit credits demo
 * funds in the sandbox instead (see docs/DECISIONS.md, "Guest Mode").
 */
export function useDeposit() {
  const { address, isGuest } = useSession();
  const { addFunds } = useAddFunds();
  const balance = useWalletBalance();
  const queryClient = useQueryClient();

  const collateral = balance.data?.collateral ?? POLYGON_USDC_E;
  const canDeposit = Boolean(address);

  const deposit = async () => {
    if (!tradingEnabled) throw new Error(tradingUnavailableMessage);
    if (isGuest) {
      creditGuestFunds(500);
      await queryClient.invalidateQueries({ queryKey: ['wallet-balance'] });
      await queryClient.invalidateQueries({ queryKey: ['positions'] });
      return;
    }
    if (!address) throw new Error('Connect a wallet before depositing.');
    const depositWallet = await getDepositWallet();
    if (depositWallet.unavailable || !depositWallet.address) {
      throw new Error('Your trading wallet is not ready yet. Please wait a moment and try again.');
    }
    await addFunds({
      destination: { address: depositWallet.address, chain: POLYGON_CAIP2, asset: collateral },
      fiat: {},
      crypto: {},
    });
    // `addFunds` can resolve before the funds are actually indexed on
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
      void queryClient.invalidateQueries({ queryKey: ['wallet-balance'] });
      void queryClient.invalidateQueries({ queryKey: ['positions'] });
      if (attempts >= 15) window.clearInterval(pollTimer);
    }, 4000);
  };

  return { deposit, canDeposit };
}
