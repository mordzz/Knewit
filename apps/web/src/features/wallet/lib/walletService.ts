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
  /** Stable authenticated account identifier used to scope private query cache. */
  accountId?: string;
  address?: string;
  walletType?: number;
}

export interface DepositWallet {
  address: string | null;
  walletType: number | null;
  unavailable?: boolean;
}

/** Web equivalent of `apps/mobile/src/features/wallet/services/walletService.ts`. */
export async function getWalletBalance(): Promise<WalletBalance> {
  return apiRequest<WalletBalance>('/api/wallet/balance');
}

/** Resolves the Polymarket account that actually holds trading collateral. */
export async function getDepositWallet(): Promise<DepositWallet> {
  return apiRequest<DepositWallet>('/api/wallet/deposit-wallet');
}

/** Polygon mainnet, CAIP-2 — the deposit destination chain. */
export const POLYGON_CAIP2 = 'eip155:137';

/** USDC.e on Polygon (`docs/WALLET.md`, "Deposit"). The backend returns
 * this address from the CLOB's contract config; this constant is only the
 * pre-read fallback for building the deposit destination before a
 * successful balance read, and is the same value. */
export const POLYGON_USDC_E = '0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174';

/** Native (Circle-issued) USDC on Polygon — a different token from
 * `POLYGON_USDC_E`. Card/bank onramp providers (Stripe, MoonPay) only sell
 * this one; they reject `POLYGON_USDC_E` outright ("Unsupported asset for
 * Stripe onramp"), confirmed against a real response. The "Buy with card
 * or bank" flow lands funds here in the user's own embedded wallet, then
 * a backend swap (`/api/wallet/convert-to-collateral`) converts to
 * `POLYGON_USDC_E` in the Deposit Wallet. */
export const POLYGON_USDC_NATIVE = '0x3c499c542cEF5E3811e1192ce70d8cC03d5c3359';

export interface NativeUsdcBalance {
  /** Raw base units (6 decimals), as a decimal string to avoid float
   * precision loss for large balances. */
  raw: string;
  /** Decimal USDC amount. */
  usdc: number;
}

/** Reads the caller's embedded-wallet native USDC balance on Polygon —
 * the "Buy with card or bank" flow polls this after the onramp resolves,
 * since funds can take a few minutes to land. */
export async function getNativeUsdcBalance(): Promise<NativeUsdcBalance> {
  return apiRequest<NativeUsdcBalance>('/api/wallet/native-balance');
}

export interface ConvertToCollateralResult {
  status: 'converted' | 'pending' | 'failed';
  /** USDC.e amount that landed in the Deposit Wallet, when converted. */
  amountUsd: number;
  /** Present when `status === 'failed'`; inspect both source and trading
   * balances before retrying because a prior on-chain step may have landed. */
  errorMessage: string | null;
}

/** Swaps the caller's embedded-wallet native USDC balance to USDC.e and
 * sends it directly to their Polymarket Deposit Wallet, via Privy's
 * Uniswap-backed swap resource, signed by the same delegated backend
 * signer that already signs trading orders. */
export async function convertToCollateral(): Promise<ConvertToCollateralResult> {
  return apiRequest<ConvertToCollateralResult>('/api/wallet/convert-to-collateral', {
    method: 'POST',
  });
}

export async function wrapDepositCollateral(): Promise<ConvertToCollateralResult> {
  return apiRequest<ConvertToCollateralResult>('/api/wallet/wrap-collateral', { method: 'POST' });
}

export interface WithdrawResult {
  status: 'confirmed' | 'pending';
  amountUsdc: number;
  transactionHash: string | null;
  transactionId: string | null;
}

/** Withdraws collateral from the Polymarket Deposit Wallet via our backend. */
export async function withdrawTradingBalance(input: {
  recipient: string;
  amount: string;
}): Promise<WithdrawResult> {
  return apiRequest<WithdrawResult>('/api/wallet/withdraw', {
    method: 'POST',
    body: JSON.stringify(input),
  });
}
