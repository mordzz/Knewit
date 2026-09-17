import { create } from 'zustand';

export type WalletStatus = 'disconnected' | 'connecting' | 'connected' | 'error';

interface WalletState {
  status: WalletStatus;
  address: string | null;
  error: string | null;
  setConnecting: () => void;
  setConnected: (address: string) => void;
  setDisconnected: () => void;
  setError: (message: string) => void;
}

/**
 * A thin, non-authoritative mirror of Privy's own embedded-wallet state
 * (`PrivySessionBridge` keeps it in sync) — kept only because a few
 * places need the current address/status synchronously outside a
 * component that can call Privy's hooks directly. Never holds a
 * private key, seed phrase, or any wallet secret — only the public
 * address and a connection-status label — see docs/WALLET.md.
 */
export const useWalletStore = create<WalletState>((set) => ({
  status: 'disconnected',
  address: null,
  error: null,
  setConnecting: () => set({ status: 'connecting', error: null }),
  setConnected: (address) => set({ status: 'connected', address, error: null }),
  setDisconnected: () => set({ status: 'disconnected', address: null, error: null }),
  setError: (message) => set({ status: 'error', error: message }),
}));
