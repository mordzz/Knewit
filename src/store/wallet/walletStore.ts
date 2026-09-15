import { create } from 'zustand';

type WalletStatus = 'disconnected' | 'connecting' | 'connected';

interface WalletState {
  status: WalletStatus;
  address: string | null;
  setConnecting: () => void;
  setConnected: (address: string) => void;
  setDisconnected: () => void;
}

export const useWalletStore = create<WalletState>((set) => ({
  status: 'disconnected',
  address: null,
  setConnecting: () => set({ status: 'connecting' }),
  setConnected: (address) => set({ status: 'connected', address }),
  setDisconnected: () => set({ status: 'disconnected', address: null }),
}));
