import { useGuestStore } from '@/store/guest/guestStore';
import { useWalletStore } from '@/store/wallet/walletStore';

/**
 * Thin, stable hook wrapper around walletStore — read-only by design.
 * `status`/`address`/`error` are kept in sync with Privy's real state by
 * `PrivySessionBridge`; nothing outside that bridge should call the
 * store's setters directly, so they aren't exposed here — see
 * docs/WALLET.md.
 *
 * Guest mode reports the sandbox's fixed demo address as connected, so
 * every wallet-gated surface (trading, positions, wallet balance) opens
 * against the sandbox instead of dead-ending at the login gate.
 */
export function useWallet() {
  const status = useWalletStore((state) => state.status);
  const address = useWalletStore((state) => state.address);
  const error = useWalletStore((state) => state.error);
  const isGuest = useGuestStore((state) => state.isGuest);
  const guestAddress = useGuestStore((state) => state.walletAddress);

  if (isGuest) {
    return {
      status: 'connected' as const,
      address: guestAddress,
      error: null,
      isConnected: true,
    };
  }

  return {
    status,
    address,
    error,
    isConnected: status === 'connected',
  };
}
