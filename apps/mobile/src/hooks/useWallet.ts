import { useWalletStore } from '@/store/wallet/walletStore';

/**
 * Thin, stable hook wrapper around walletStore — read-only by design.
 * `status`/`address`/`error` are kept in sync with Privy's real state by
 * `PrivySessionBridge`; nothing outside that bridge should call the
 * store's setters directly, so they aren't exposed here — see
 * docs/WALLET.md.
 */
export function useWallet() {
  const status = useWalletStore((state) => state.status);
  const address = useWalletStore((state) => state.address);
  const error = useWalletStore((state) => state.error);
  return {
    status,
    address,
    error,
    isConnected: status === 'connected',
  };
}
