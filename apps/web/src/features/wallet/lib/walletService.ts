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
 * or bank" flow buys it into the user's Polymarket bridge address, which
 * turns it into `POLYGON_USDC_E` in the Deposit Wallet. */
export const POLYGON_USDC_NATIVE = '0x3c499c542cEF5E3811e1192ce70d8cC03d5c3359';

export interface ConvertToCollateralResult {
  status: 'converted' | 'pending' | 'failed';
  /** USDC.e amount that landed in the Deposit Wallet, when converted. */
  amountUsd: number;
  /** Present when `status === 'failed'`; inspect both source and trading
   * balances before retrying because a prior on-chain step may have landed. */
  errorMessage: string | null;
}

/** `GET /api/wallet/crypto-deposit` — the user's Polymarket bridge
 * addresses and the USDC.e that has landed in their Deposit Wallet. */
export interface CryptoDepositInfo {
  bridge: {
    evm: string;
    svm: string | null;
    btc: string | null;
    tron: string | null;
    transactions: { status: string; createdAtMs: number | null }[];
  } | null;
  usdcE: { address: string; balance: number };
  /** Native USDC in the embedded wallet (a card purchase on its way). */
  usdc: { address: string; balance: number };
  autoConvert: boolean;
  unavailable?: boolean;
}

export async function getCryptoDepositInfo(): Promise<CryptoDepositInfo> {
  return apiRequest<CryptoDepositInfo>('/api/wallet/crypto-deposit');
}

/** Wraps the USDC.e that has landed in the caller's Deposit Wallet into
 * pUSD trading balance (gasless, via Polymarket's relayer). */
export async function convertToCollateral(): Promise<ConvertToCollateralResult> {
  return apiRequest<ConvertToCollateralResult>('/api/wallet/convert-to-collateral', {
    method: 'POST',
  });
}

export interface WithdrawResult {
  status: 'confirmed' | 'pending';
  amountUsdc: number;
  transactionHash: string | null;
  transactionId: string | null;
  destination?: string;
  /** Set for bridge destinations — track delivery with `getWithdrawStatus`. */
  bridgeAddress?: string | null;
}

/** Withdraws collateral from the Polymarket Deposit Wallet via our backend:
 * directly as USDC.e on Polygon, or through the Polymarket bridge to another
 * network/token (`destination`, a `WithdrawOption` id). */
export async function withdrawTradingBalance(input: {
  recipient: string;
  amount: string;
  destination?: string;
}): Promise<WithdrawResult> {
  return apiRequest<WithdrawResult>('/api/wallet/withdraw', {
    method: 'POST',
    body: JSON.stringify(input),
  });
}

export type RecipientKind = 'evm' | 'solana' | 'tron';

export interface WithdrawOption {
  id: string;
  network: string;
  token: string;
  recipientKind: RecipientKind;
  viaBridge: boolean;
  minimumUsd: number;
}

export async function getWithdrawOptions(): Promise<WithdrawOption[]> {
  const data = await apiRequest<{ options: WithdrawOption[] }>('/api/wallet/withdraw-options');
  return data.options;
}

export interface WithdrawQuote {
  estimatedReceived: number;
  minReceived: number;
  totalCostUsd: number;
  estimatedSeconds: number;
}

export async function getWithdrawQuote(input: { destination: string; recipient: string; amount: string }): Promise<WithdrawQuote> {
  return apiRequest<WithdrawQuote>('/api/wallet/withdraw-quote', { method: 'POST', body: JSON.stringify(input) });
}

export async function getWithdrawStatus(bridgeAddress: string): Promise<{ status: string }[]> {
  const data = await apiRequest<{ transactions: { status: string }[] }>(
    `/api/wallet/withdraw-status?address=${encodeURIComponent(bridgeAddress)}`
  );
  return data.transactions;
}
