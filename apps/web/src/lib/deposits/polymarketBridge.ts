import { env } from '@/lib/env';

const BRIDGE_URL = 'https://bridge.polymarket.com';

/** Per-wallet deposit addresses from Polymarket's bridge
 * (docs.polymarket.com/trading/bridge/deposit)  anything sent to them is
 * bridged/swapped to pUSD and delivered to the Polymarket Deposit Wallet
 * on Polygon, ready to trade (bridge/swap costs come out of the deposit). */
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

/** One transfer from `GET /status/{address}` (docs.polymarket.com/api-reference). */
export interface BridgeTransaction {
  status: BridgeDepositStatus;
  fromChainId: string | null;
  toChainId: string | null;
  /** Destination transaction hash  only once `COMPLETED`. */
  txHash: string | null;
  /** Only present once the transfer has started processing. */
  createdAtMs: number | null;
}

/** `X-Builder-Code` is defined only on `POST /deposit` and `POST /withdraw`
 * (optional; attributes the transfer to this app's builder profile). */
function headers(withBuilderCode: boolean): Record<string, string> {
  return {
    'Content-Type': 'application/json',
    Accept: 'application/json',
    'User-Agent': 'knewit-backend/1.0',
    ...(withBuilderCode && env.polymarketBuilderCode ? { 'X-Builder-Code': env.polymarketBuilderCode } : {}),
  };
}

async function bridgeFetch<T>(path: string, init?: RequestInit, withBuilderCode = false): Promise<T> {
  const response = await fetch(`${BRIDGE_URL}${path}`, { ...init, headers: headers(withBuilderCode), cache: 'no-store' });
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
    { method: 'POST', body: JSON.stringify({ address: polymarketWallet }) },
    true
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

/** Recent bridge transactions into one bridge address (`/status`), newest
 * first. `createdTimeMs` is only present once processing has started. */
export async function getBridgeTransactions(depositAddress: string): Promise<BridgeTransaction[]> {
  const data = await bridgeFetch<{ transactions?: Record<string, unknown>[] }>(
    `/status/${encodeURIComponent(depositAddress)}`
  );
  return (data.transactions ?? [])
    .map((tx) => ({
      status: String(tx.status ?? 'PROCESSING'),
      fromChainId: tx.fromChainId != null ? String(tx.fromChainId) : null,
      toChainId: tx.toChainId != null ? String(tx.toChainId) : null,
      txHash: tx.txHash != null ? String(tx.txHash) : null,
      createdAtMs: numberOrNull(tx.createdTimeMs),
    }))
    .sort((a, b) => (b.createdAtMs ?? 0) - (a.createdAtMs ?? 0));
}

function numberOrNull(value: unknown): number | null {
  const parsed = typeof value === 'string' ? Number(value) : value;
  return typeof parsed === 'number' && Number.isFinite(parsed) ? parsed : null;
}

/** Withdrawal (docs.polymarket.com/trading/bridge/withdraw): the bridge
 * returns a Polygon address; pUSD sent there is bridged/swapped to
 * `toTokenAddress` on `toChainId` and delivered to `recipient`. Only create
 * one when the user is ready to send  the bridge's own guidance is not to
 * pre-generate withdrawal addresses. */
export async function createBridgeWithdrawal(params: {
  polymarketWallet: string;
  toChainId: string;
  toTokenAddress: string;
  recipient: string;
}): Promise<string> {
  const data = await bridgeFetch<{ address?: { evm?: string } }>(
    '/withdraw',
    {
      method: 'POST',
      body: JSON.stringify({
        address: params.polymarketWallet,
        toChainId: params.toChainId,
        toTokenAddress: params.toTokenAddress,
        recipientAddr: params.recipient,
      }),
    },
    true
  );
  if (!data.address?.evm) throw new Error('Polymarket bridge returned no withdrawal address.');
  return data.address.evm;
}

export interface BridgeQuote {
  /** Destination-token amount expected (`estToTokenBaseUnit`, in whole units). */
  estimatedReceived: number;
  /** Its USD value (`estOutputUsd`). */
  estimatedReceivedUsd: number;
  /** USD value after max slippage (`estFeeBreakdown.minReceived`). */
  minReceivedUsd: number;
  /** Everything the route costs, in USD (`estFeeBreakdown.totalImpactUsd`
   * already includes gas, fill cost, swap impact and app fee). */
  totalCostUsd: number;
  estimatedSeconds: number;
}

/**
 * `POST /quote`  the cost of moving `amount` pUSD (6 decimals) from
 * Polygon to a destination token/chain. `toDecimals` is the destination
 * token's decimals (from `/supported-assets`) to read `estToTokenBaseUnit`.
 */
export async function getBridgeQuote(params: {
  amount: number;
  fromTokenAddress: string;
  toChainId: string;
  toTokenAddress: string;
  toDecimals: number;
  recipient: string;
}): Promise<BridgeQuote> {
  const data = await bridgeFetch<{
    estCheckoutTimeMs?: number;
    estOutputUsd?: number;
    estToTokenBaseUnit?: string;
    estFeeBreakdown?: { minReceived?: number; totalImpactUsd?: number };
  }>('/quote', {
    method: 'POST',
    body: JSON.stringify({
      fromAmountBaseUnit: String(Math.round(params.amount * 1e6)),
      fromChainId: '137',
      fromTokenAddress: params.fromTokenAddress,
      recipientAddress: params.recipient,
      toChainId: params.toChainId,
      toTokenAddress: params.toTokenAddress,
    }),
  });
  const fees = data.estFeeBreakdown ?? {};
  return {
    estimatedReceived: Number(data.estToTokenBaseUnit ?? 0) / 10 ** params.toDecimals,
    estimatedReceivedUsd: data.estOutputUsd ?? 0,
    minReceivedUsd: fees.minReceived ?? 0,
    totalCostUsd: fees.totalImpactUsd ?? 0,
    estimatedSeconds: Math.round((data.estCheckoutTimeMs ?? 0) / 1000),
  };
}

interface SupportedAsset {
  chainId: string;
  chainName: string;
  token: { name: string; symbol: string; address: string; decimals: number };
  minCheckoutUsd: number;
}

/** Which of the bridge's addresses a chain uses  the `/deposit` and
 * `/withdraw` responses carry one per type. */
export type BridgeAddressType = 'evm' | 'svm' | 'btc' | 'tron';

/** One token on one chain the bridge supports, from `/supported-assets`. */
export interface BridgeAsset {
  chainId: string;
  chainName: string;
  addressType: BridgeAddressType;
  symbol: string;
  name: string;
  tokenAddress: string;
  decimals: number;
  /** The bridge's minimum for this token/chain, in USD. */
  minUsd: number;
}

const NON_EVM_CHAINS: Record<string, BridgeAddressType> = { Solana: 'svm', Bitcoin: 'btc', Tron: 'tron' };
/** Chains whose deposits don't go to one of the four address types. */
const UNSUPPORTED_CHAINS = new Set(['Lightning', 'Hypercore']);

let assetsCache: { at: number; assets: BridgeAsset[] } | null = null;

/** `/supported-assets`, normalized and refreshed every 10 minutes  the
 * list and its minimums change over time, so nothing here is hardcoded.
 * One entry per symbol per chain (the list repeats a few, e.g. native SOL
 * under two addresses). */
export async function getBridgeAssets(): Promise<BridgeAsset[]> {
  if (assetsCache && Date.now() - assetsCache.at < 10 * 60 * 1000) return assetsCache.assets;
  const data = await bridgeFetch<SupportedAsset[] | { supportedAssets?: SupportedAsset[] }>('/supported-assets');
  const raw = Array.isArray(data) ? data : (data.supportedAssets ?? []);
  const seen = new Set<string>();
  const assets: BridgeAsset[] = [];
  for (const asset of raw) {
    if (UNSUPPORTED_CHAINS.has(asset.chainName)) continue;
    const key = `${asset.chainId}:${asset.token.symbol}`;
    if (seen.has(key)) continue;
    seen.add(key);
    assets.push({
      chainId: String(asset.chainId),
      chainName: asset.chainName,
      addressType: NON_EVM_CHAINS[asset.chainName] ?? 'evm',
      symbol: asset.token.symbol,
      name: asset.token.name,
      tokenAddress: asset.token.address,
      decimals: asset.token.decimals,
      minUsd: asset.minCheckoutUsd,
    });
  }
  assetsCache = { at: Date.now(), assets };
  return assets;
}

/** The supported asset for a chain/token pair, or `null` if the bridge
 * doesn't list it. */
export async function findBridgeAsset(chainId: string, tokenAddress: string): Promise<BridgeAsset | null> {
  const assets = await getBridgeAssets();
  return (
    assets.find(
      (asset) => asset.chainId === chainId && asset.tokenAddress.toLowerCase() === tokenAddress.toLowerCase()
    ) ?? null
  );
}
