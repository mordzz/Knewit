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
    await queryClient.invalidateQueries({ queryKey: ['wallet-balance'] });
    await queryClient.invalidateQueries({ queryKey: ['positions'] });
  };

  return { deposit, canDeposit };
}
