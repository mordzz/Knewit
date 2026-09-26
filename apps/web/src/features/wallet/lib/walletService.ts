import { apiRequest } from '@/lib/apiClient';

export interface WalletBalance {
  /** USDC collateral available to trade, or `null` when the read is
   * unavailable (no embedded wallet yet, or CLOB auth rejected  most
   * likely missing delegated signing; docs/WALLET.md). */
  usdc: number | null;
  /** Raw on-chain allowance per spender contract (6-decimals strings) the
   * CLOB currently sees for the collateral token, when the read
   * succeeded. A `'0'` value means that spender still needs an `approve`
   * (docs/WALLET.md, "Approve USDC for Trading"); the map's keys are the
   * exact spenders the CLOB checks, so they're used as-is. */
  allowances?: Record<string, string>;
  /** Polymarket's collateral token (pUSD) on Polygon, from the CLOB's own
   * contract config. */
  collateral?: string;
  unavailable?: boolean;
  /** Stable authenticated account identifier used to scope private query cache. */
  accountId?: string;
  address?: string;
  walletType?: number;
}

/** Web equivalent of `apps/mobile/src/features/wallet/services/walletService.ts`. */
export async function getWalletBalance(): Promise<WalletBalance> {
  return apiRequest<WalletBalance>('/api/wallet/balance');
}

/** Polygon mainnet, CAIP-2  where card purchases land. */
export const POLYGON_CAIP2 = 'eip155:137';

/** Native (Circle-issued) USDC on Polygon  what card/bank onramps
 * (Stripe, MoonPay) sell into the embedded wallet. */
export const POLYGON_USDC_NATIVE = '0x3c499c542cEF5E3811e1192ce70d8cC03d5c3359';

/** Which bridge address a chain uses. */
export type BridgeAddressType = 'evm' | 'svm' | 'btc' | 'tron';

/** One token on one chain the Polymarket bridge supports (`/supported-assets`). */
export interface BridgeAsset {
  chainId: string;
  chainName: string;
  addressType: BridgeAddressType;
  symbol: string;
  name: string;
  tokenAddress: string;
  decimals: number;
  minUsd: number;
}

export interface BridgeTransaction {
  status: string;
  fromChainId: string | null;
  toChainId: string | null;
  txHash: string | null;
  createdAtMs: number | null;
}

/** `GET /api/wallet/crypto-deposit`  the user's bridge deposit addresses,
 * the token/chain catalog and recent transfers. Deposits arrive as pUSD. */
export interface CryptoDepositInfo {
  addresses: Record<BridgeAddressType, string | null>;
  assets: BridgeAsset[];
  transactions: BridgeTransaction[];
  unavailable?: boolean;
}

export async function getCryptoDepositInfo(): Promise<CryptoDepositInfo> {
  return apiRequest<CryptoDepositInfo>('/api/wallet/crypto-deposit');
}

/** `GET /api/wallet/card-deposit`  native USDC waiting in the embedded
 * wallet after a card purchase (card deposits only). */
export async function getCardDepositState(): Promise<{ address: string; usdcBalance: number; unavailable?: boolean }> {
  return apiRequest('/api/wallet/card-deposit');
}

/** Forwards that USDC to the user's bridge deposit address (→ pUSD). */
export async function forwardCardDeposit(): Promise<{ status: 'forwarded' | 'nothing'; amountUsd: number }> {
  return apiRequest('/api/wallet/card-deposit', { method: 'POST' });
}

export interface WithdrawResult {
  status: 'confirmed' | 'pending';
  amountUsdc: number;
  transactionHash: string | null;
  transactionId: string | null;
  /** The bridge withdrawal address  track delivery with `getWithdrawStatus`. */
  bridgeAddress?: string | null;
}

/** The destination picked in the withdraw form: a `BridgeAsset`'s chain
 * and token, plus who receives it and how much (USD, pUSD). */
export interface WithdrawInput {
  chainId: string;
  tokenAddress: string;
  recipient: string;
  amount: string;
}

/** Withdraws pUSD through the Polymarket bridge to the chosen token/chain. */
export async function withdrawTradingBalance(input: WithdrawInput): Promise<WithdrawResult> {
  return apiRequest<WithdrawResult>('/api/wallet/withdraw', { method: 'POST', body: JSON.stringify(input) });
}

export async function getWithdrawAssets(): Promise<BridgeAsset[]> {
  const data = await apiRequest<{ assets: BridgeAsset[] }>('/api/wallet/withdraw-options');
  return data.assets;
}

export interface WithdrawQuote {
  /** Destination-token amount expected. */
  estimatedReceived: number;
  estimatedReceivedUsd: number;
  /** USD value after max slippage. */
  minReceivedUsd: number;
  totalCostUsd: number;
  estimatedSeconds: number;
}

export async function getWithdrawQuote(input: WithdrawInput): Promise<WithdrawQuote> {
  return apiRequest<WithdrawQuote>('/api/wallet/withdraw-quote', { method: 'POST', body: JSON.stringify(input) });
}

export async function getWithdrawStatus(bridgeAddress: string): Promise<{ status: string }[]> {
  const data = await apiRequest<{ transactions: { status: string }[] }>(
    `/api/wallet/withdraw-status?address=${encodeURIComponent(bridgeAddress)}`
  );
  return data.transactions;
}
