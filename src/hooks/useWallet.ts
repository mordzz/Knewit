import { useWalletStore } from '@/store/wallet/walletStore';

/**
 * Thin, stable hook wrapper around walletStore. No Privy SDK is wired in
 * yet (see docs/WALLET.md) — this hook is the interface future trading/
 * Call-creation UI will consume, independent of when Privy lands.
 */
export function useWallet() {
  const status = useWalletStore((state) => state.status);
  const address = useWalletStore((state) => state.address);
  const setConnecting = useWalletStore((state) => state.setConnecting);
  const setConnected = useWalletStore((state) => state.setConnected);
  const setDisconnected = useWalletStore((state) => state.setDisconnected);

  return {
    status,
    address,
    isConnected: status === 'connected',
    setConnecting,
    setConnected,
    setDisconnected,
  };
}
