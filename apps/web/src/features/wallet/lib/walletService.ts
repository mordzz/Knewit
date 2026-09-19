import { apiRequest } from '@/lib/apiClient';

export interface WalletBalance {
  /** USDC collateral available to trade, or `null` when the read is
   * unavailable (no embedded wallet yet, or CLOB auth rejected — most
   * likely missing delegated signing; docs/WALLET.md). */
  usdc: number | null;
  /** Raw on-chain allowance per spender contract (6-decimals strings) the
   * CLOB currently sees for the collateral token, when the read
   * succeeded. A `'0'` value means that spender still needs an `approve`
   * (docs/WALLET.md, "Approve USDC for Trading"); the map's keys are the
   * exact spenders the CLOB checks, so they're used as-is. */
  allowances?: Record<string, string>;
  /** Polymarket's collateral token address on Polygon (USDC.e) — the
   * destination token for deposits and the token `approve` is sent to.
   * Sourced from the CLOB's own `getContractConfig`, never hardcoded. */
  collateral?: string;
  unavailable?: boolean;
}

/** Web equivalent of `apps/mobile/src/features/wallet/services/walletService.ts`. */
export async function getWalletBalance(): Promise<WalletBalance> {
  return apiRequest<WalletBalance>('/api/wallet/balance');
}

/** Polygon mainnet, CAIP-2 — the deposit destination chain. */
export const POLYGON_CAIP2 = 'eip155:137';

/** USDC.e on Polygon (`docs/WALLET.md`, "Deposit"). The backend returns
 * this address from the CLOB's contract config; this constant is only the
 * pre-read fallback for building the deposit destination before a
 * successful balance read, and is the same value. */
export const POLYGON_USDC_E = '0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174';
