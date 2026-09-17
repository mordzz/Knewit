import { apiRequest } from '@/services/api/client';
import { endpoints } from '@/services/api/endpoints';

export interface WalletBalance {
  /** USDC collateral available to trade, or `null` when the read is
   * unavailable (no embedded wallet yet, or CLOB auth rejected — most
   * likely missing delegated signing; docs/WALLET.md). */
  usdc: number | null;
  unavailable?: boolean;
}

/** Mobile equivalent of `apps/backend/src/lib/walletService.ts`. */
export async function getWalletBalance(): Promise<WalletBalance> {
  return apiRequest<WalletBalance>(endpoints.walletBalance);
}
