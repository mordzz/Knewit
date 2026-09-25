import type { BridgeAddressType, BridgeAsset } from '@/features/wallet/services/walletService';

/** Most-used first; everything else alphabetical. */
const TOKEN_ORDER = ['USDC', 'USDT', 'ETH', 'USDC.e', 'DAI', 'SOL', 'BTC', 'POL', 'BNB', 'WETH', 'WBTC'];
const CHAIN_ORDER = ['Polygon', 'Ethereum', 'Base', 'Arbitrum', 'Optimism', 'BNB Smart Chain', 'Solana', 'Tron', 'Bitcoin'];

function rank(order: string[], value: string): number {
  const index = order.indexOf(value);
  return index === -1 ? order.length : index;
}

/** Every token symbol the bridge supports, most-used first. */
export function tokenSymbols(assets: BridgeAsset[]): string[] {
  return [...new Set(assets.map((asset) => asset.symbol))].sort(
    (a, b) => rank(TOKEN_ORDER, a) - rank(TOKEN_ORDER, b) || a.localeCompare(b)
  );
}

/** The chains a token can be sent on, most-used first. */
export function chainsForToken(assets: BridgeAsset[], symbol: string): BridgeAsset[] {
  return assets
    .filter((asset) => asset.symbol === symbol)
    .sort((a, b) => rank(CHAIN_ORDER, a.chainName) - rank(CHAIN_ORDER, b.chainName) || a.chainName.localeCompare(b.chainName));
}

export function formatMinimum(minUsd: number): string {
  return `Min $${Number.isInteger(minUsd) ? minUsd : minUsd.toFixed(2)}`;
}

export function addressPlaceholder(type: BridgeAddressType, chainName: string): string {
  if (type === 'svm') return 'Solana address';
  if (type === 'tron') return 'Tron address (T…)';
  if (type === 'btc') return 'Bitcoin address';
  return `${chainName} address (0x…)`;
}

/** Light client-side format check (the backend validates strictly). */
export function looksLikeAddress(type: BridgeAddressType, address: string): boolean {
  if (type === 'evm') return /^0x[a-fA-F0-9]{40}$/.test(address) && !/^0x0{40}$/i.test(address);
  if (type === 'svm') return /^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(address);
  if (type === 'tron') return /^T[1-9A-HJ-NP-Za-km-z]{33}$/.test(address);
  return /^(bc1[02-9ac-hj-np-z]{11,71}|[13][1-9A-HJ-NP-Za-km-z]{25,34})$/.test(address);
}
