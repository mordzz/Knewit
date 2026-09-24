import { env } from '@/lib/env';

const BRIDGE_URL = 'https://bridge.polymarket.com';

/** Per-wallet deposit addresses from Polymarket's bridge — anything sent
 * to them is bridged/swapped to USDC.e and delivered to the Polymarket
 * Deposit Wallet on Polygon (Polymarket pays the gas; bridge/swap costs
 * come out of the deposit itself). */
export interface BridgeDepositAddresses {
  evm: string;
  svm: string | null;
  btc: string | null;
  tron: string | null;
}

export type BridgeDepositStatus =
  | 'DEPOSIT_DETECTED'
  | 'PROCESSING'
  | 'ORIGIN_TX_CONFIRMED'
  | 'SUBMITTED'
  | 'COMPLETED'
  | 'FAILED'
  | string;

export interface BridgeTransaction {
  status: BridgeDepositStatus;
  fromChainId: string | null;
  fromAmountUsd: number | null;
  createdAtMs: number | null;
}

function headers(): Record<string, string> {
  return {
    'Content-Type': 'application/json',
    Accept: 'application/json',
    'User-Agent': 'knewit-backend/1.0',
    // Attributes deposits to this app's Polymarket builder profile.
    ...(env.polymarketBuilderCode ? { 'X-Builder-Code': env.polymarketBuilderCode } : {}),
  };
}

async function bridgeFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${BRIDGE_URL}${path}`, { ...init, headers: headers(), cache: 'no-store' });
  if (!response.ok) {
    const detail = await response.text().catch(() => '');
    throw new Error(`Polymarket bridge ${path} failed: ${response.status} ${detail.slice(0, 200)}`);
  }
  return (await response.json()) as T;
}

/** The addresses are stable per Polymarket wallet, so they're cached for
 * the life of the server instance. */
const addressCache = new Map<string, BridgeDepositAddresses>();

export async function getBridgeDepositAddresses(polymarketWallet: string): Promise<BridgeDepositAddresses> {
  const key = polymarketWallet.toLowerCase();
  const cached = addressCache.get(key);
  if (cached) return cached;

  const data = await bridgeFetch<{ address?: Partial<Record<'evm' | 'svm' | 'btc' | 'tron', string>> }>(
    '/deposit',
    { method: 'POST', body: JSON.stringify({ address: polymarketWallet }) }
  );
  if (!data.address?.evm) throw new Error('Polymarket bridge returned no EVM deposit address.');
  const addresses: BridgeDepositAddresses = {
    evm: data.address.evm,
    svm: data.address.svm ?? null,
    btc: data.address.btc ?? null,
    tron: data.address.tron ?? null,
  };
  addressCache.set(key, addresses);
  return addresses;
}

/** Recent bridge transactions into one deposit address, newest first.
 * Field names beyond `status` are read defensively — the bridge's payload
 * isn't fully documented. */
export async function getBridgeTransactions(depositAddress: string): Promise<BridgeTransaction[]> {
  const data = await bridgeFetch<{ transactions?: Record<string, unknown>[] }>(
    `/status/${encodeURIComponent(depositAddress)}`
  );
  return (data.transactions ?? [])
    .map((tx) => ({
      status: String(tx.status ?? 'PROCESSING'),
      fromChainId: tx.fromChainId != null ? String(tx.fromChainId) : null,
      fromAmountUsd: numberOrNull(tx.fromAmountUsd ?? tx.estInputUsd),
      createdAtMs: numberOrNull(tx.createdTimeMs ?? tx.createdAtMs ?? tx.createdAt),
    }))
    .sort((a, b) => (b.createdAtMs ?? 0) - (a.createdAtMs ?? 0));
}

function numberOrNull(value: unknown): number | null {
  const parsed = typeof value === 'string' ? Number(value) : value;
  return typeof parsed === 'number' && Number.isFinite(parsed) ? parsed : null;
}

/** Withdrawal: the bridge returns a Polygon address; USDC.e sent there is
 * bridged/swapped to `toTokenAddress` on `toChainId` and delivered to
 * `recipient`. Only create one when the user is ready to send — the
 * bridge's own guidance is not to pre-generate withdrawal addresses. */
export async function createBridgeWithdrawal(params: {
  polymarketWallet: string;
  toChainId: string;
  toTokenAddress: string;
  recipient: string;
}): Promise<string> {
  const data = await bridgeFetch<{ address?: { evm?: string } }>('/withdraw', {
    method: 'POST',
    body: JSON.stringify({
      address: params.polymarketWallet,
      toChainId: params.toChainId,
      toTokenAddress: params.toTokenAddress,
      recipientAddr: params.recipient,
    }),
  });
  if (!data.address?.evm) throw new Error('Polymarket bridge returned no withdrawal address.');
  return data.address.evm;
}

export interface BridgeQuote {
  /** What the recipient should get, at least (in the destination token). */
  minReceived: number;
  estimatedReceived: number;
  /** Everything the route costs: gas, fill cost, swap impact. */
  totalCostUsd: number;
  estimatedSeconds: number;
}

/** Indicative cost of moving `amountUsdcE` USDC.e from Polygon to a
 * destination token/chain. */
export async function getBridgeQuote(params: {
  amountUsdcE: number;
  fromTokenAddress: string;
  toChainId: string;
  toTokenAddress: string;
  recipient: string;
}): Promise<BridgeQuote> {
  const data = await bridgeFetch<{
    estCheckoutTimeMs?: number;
    estOutputUsd?: number;
    estFeeBreakdown?: { minReceived?: number; totalImpactUsd?: number; gasUsd?: number; appFeeUsd?: number };
  }>('/quote', {
    method: 'POST',
    body: JSON.stringify({
      fromAmountBaseUnit: String(Math.round(params.amountUsdcE * 1e6)),
      fromChainId: '137',
      fromTokenAddress: params.fromTokenAddress,
      recipientAddress: params.recipient,
      toChainId: params.toChainId,
      toTokenAddress: params.toTokenAddress,
    }),
  });
  const fees = data.estFeeBreakdown ?? {};
  return {
    minReceived: fees.minReceived ?? 0,
    estimatedReceived: data.estOutputUsd ?? fees.minReceived ?? 0,
    totalCostUsd: (fees.totalImpactUsd ?? 0) + (fees.gasUsd ?? 0) + (fees.appFeeUsd ?? 0),
    estimatedSeconds: Math.round((data.estCheckoutTimeMs ?? 0) / 1000),
  };
}

interface SupportedAsset {
  chainId: string;
  token: { address: string };
  minCheckoutUsd: number;
}

let supportedAssetsCache: { at: number; assets: SupportedAsset[] } | null = null;

/** The bridge's own minimum (USD) for a chain/token, refreshed every 10
 * minutes; `null` when the pair isn't listed (i.e. not supported). */
export async function getBridgeMinimumUsd(chainId: string, tokenAddress: string): Promise<number | null> {
  if (!supportedAssetsCache || Date.now() - supportedAssetsCache.at > 10 * 60 * 1000) {
    const data = await bridgeFetch<SupportedAsset[] | { supportedAssets?: SupportedAsset[] }>('/supported-assets');
    const assets = Array.isArray(data) ? data : (data.supportedAssets ?? []);
    supportedAssetsCache = { at: Date.now(), assets };
  }
  const match = supportedAssetsCache.assets.find(
    (asset) => asset.chainId === chainId && asset.token.address.toLowerCase() === tokenAddress.toLowerCase()
  );
  return match ? match.minCheckoutUsd : null;
}
