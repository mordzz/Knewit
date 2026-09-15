import type { ISODateString } from '@/types/common';

export type WalletConnectionStatus = 'disconnected' | 'connecting' | 'connected';

/**
 * The public, non-sensitive shape of a connected wallet. Never carries key
 * material — Privy owns custody entirely, see docs/WALLET.md.
 */
export interface Wallet {
  address: string;
  connectedAt: ISODateString;
}
