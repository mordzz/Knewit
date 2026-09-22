import { useFundWallet } from '@privy-io/expo/ui';
import { polygon } from '@privy-io/expo';
import { useQueryClient } from '@tanstack/react-query';
import { useWallet } from '@/hooks/useWallet';
import { useWalletBalance } from '@/features/wallet/hooks/useWalletBalance';
import { getDepositWallet, POLYGON_USDC_E } from '@/features/wallet/services/walletService';
import { creditGuestFunds, isGuestSession } from '@/services/guest/guestBackend';
import { env } from '@/app/config/env';

/**
 * Opens Privy's own funding flow (`useFundWallet` from
 * `@privy-io/expo/ui` — requires `<PrivyElements />`, mounted once in
 * `AppProviders`) with this app's Polymarket Deposit Wallet on Polygon as the
 * destination, in USDC.e — the collateral the trading flow spends
 * (docs/WALLET.md, "Deposit"). Mobile equivalent of the web
 * `useDeposit`. Invalidates balance + positions afterwards; Privy notes
 * funds can still take a few minutes to land.
 *
 * Requires the funding feature + payment methods to be enabled in the
 * Privy Dashboard; without that, `fundWallet` rejects with Privy's real
 * error — surfaced to the user, never faked as success.
 */
export function useDeposit() {
  const { fundWallet } = useFundWallet();
  const { isConnected, address } = useWallet();
  const balance = useWalletBalance();
  const queryClient = useQueryClient();

  const collateral = balance.data?.collateral ?? POLYGON_USDC_E;
  const canDeposit = isConnected && Boolean(address);

  const deposit = async () => {
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
    const depositWallet = await getDepositWallet();
    if (depositWallet.unavailable || !depositWallet.address) {
      throw new Error('Your trading wallet is not ready yet. Please wait a moment and try again.');
    }
    await fundWallet({
      address: depositWallet.address,
      chain: polygon,
      asset: { tokenAddress: collateral },
      // MoonPay's hosted UI has its own theme; match the app's dark +
      // brand yellow (Privy's own screens follow `<PrivyElements />`'s
      // config in `AppProviders`). Coinbase's on-ramp exposes no theme.
      moonpay: { uiConfig: { accentColor: '#FFE506', theme: 'dark' } },
    });
    await queryClient.invalidateQueries({ queryKey: ['wallet-balance'] });
    await queryClient.invalidateQueries({ queryKey: ['positions'] });
  };

  return { deposit, canDeposit };
}
