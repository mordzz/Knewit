import { apiRequest } from '@/lib/apiClient';

export interface WalletBalance {
  /** USDC collateral available to trade, or `null` when the read is
   * unavailable (no embedded wallet yet, or CLOB auth rejected — most
   * likely missing delegated signing; docs/WALLET.md). */
  usdc: number | null;
  unavailable?: boolean;
}

/** Web equivalent of `apps/mobile/src/features/wallet/services/walletService.ts`. */
export async function getWalletBalance(): Promise<WalletBalance> {
  return apiRequest<WalletBalance>('/api/wallet/balance');
}
