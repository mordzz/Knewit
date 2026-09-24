import { apiRequest } from '@/services/api/client';
import { endpoints } from '@/services/api/endpoints';

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
   * destination token for deposits and the token `approve` is sent to. */
  collateral?: string;
  unavailable?: boolean;
  /** Stable authenticated account identifier used to scope private query cache. */
  accountId?: string;
  address?: string;
  walletType?: number;
}

export interface DepositWallet {
  address: string | null;
  walletType: number | null;
  unavailable?: boolean;
  /** Stable authenticated account identifier used to scope private query cache. */
  accountId?: string;
}

/** Mobile client for the wallet API in `apps/web`. */
export async function getWalletBalance(): Promise<WalletBalance> {
  return apiRequest<WalletBalance>(endpoints.walletBalance);
}

/** Resolves the Polymarket wallet that holds the user's trading collateral. */
export async function getDepositWallet(): Promise<DepositWallet> {
  return apiRequest<DepositWallet>(endpoints.walletDeposit);
}

/** `GET /wallet/crypto-deposit` — where to send each token on Polygon and
 * what has already arrived there (docs/API.md). */
export interface CryptoDepositInfo {
  network: 'polygon';
  /** Native USDC → the embedded wallet (swapped on arrival). */
  usdc: { address: string; balance: number };
  /** USDC.e → the Polymarket Deposit Wallet (wrapped on arrival). */
  usdcE: { address: string; balance: number };
  /** True when arrivals convert in the background (Alchemy webhook). */
  autoConvert: boolean;
  unavailable?: boolean;
}

export async function getCryptoDepositInfo(): Promise<CryptoDepositInfo> {
  return apiRequest<CryptoDepositInfo>(endpoints.walletCryptoDeposit);
}

export interface NativeUsdcBalance {
  raw: string;
  usdc: number;
}

export async function getNativeUsdcBalance(): Promise<NativeUsdcBalance> {
  return apiRequest<NativeUsdcBalance>(endpoints.walletNativeBalance);
}

export interface ConvertToCollateralResult {
  status: 'converted' | 'pending' | 'failed';
  amountUsd: number;
  /** Check both source and trading balances before retrying after failure. */
  errorMessage: string | null;
}

export async function convertToCollateral(): Promise<ConvertToCollateralResult> {
  return apiRequest<ConvertToCollateralResult>(endpoints.walletConvertToCollateral, {
    method: 'POST',
  });
}

export interface WithdrawResult {
  status: 'confirmed' | 'pending';
  amountUsdc: number;
  transactionHash: string | null;
  transactionId: string | null;
}

/** Withdraws trading collateral through the backend's Polymarket client. */
export async function withdrawTradingBalance(input: {
  recipient: string;
  amount: string;
}): Promise<WithdrawResult> {
  return apiRequest<WithdrawResult>(endpoints.walletWithdraw, {
    method: 'POST',
    body: JSON.stringify(input),
  });
}

/** USDC.e on Polygon — the collateral the trading flow spends. Same value
 * the backend returns from the CLOB's contract config; this constant is
 * the pre-read fallback for the deposit destination. */
export const POLYGON_USDC_E = '0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174';

/** Native USDC on Polygon, the asset card on-ramps can purchase. */
export const POLYGON_USDC_NATIVE = '0x3c499c542cEF5E3811e1192ce70d8cC03d5c3359';
