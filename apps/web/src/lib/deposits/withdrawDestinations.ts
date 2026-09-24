import { isAddress } from 'viem';
import { POLYGON_USDC_E } from '@/lib/trading/collateral';
import { getBridgeMinimumUsd } from '@/lib/deposits/polymarketBridge';

export type RecipientKind = 'evm' | 'solana' | 'tron';

export interface WithdrawDestination {
  id: string;
  /** Network as people know it (shown in the picker). */
  network: string;
  token: string;
  /** Polymarket bridge chain id / token (same identifiers as /supported-assets). */
  chainId: string;
  tokenAddress: string;
  recipientKind: RecipientKind;
  /** USDC.e on Polygon is sent straight from the unwrap; everything else
   * goes through a Polymarket bridge withdrawal address. */
  viaBridge: boolean;
}

/**
 * Where a withdrawal can go. The first entry is the direct route (pUSD is
 * unwrapped straight to the recipient as USDC.e, no minimum); the rest are
 * the common exchange/wallet destinations the Polymarket bridge supports,
 * ids and tokens taken from its /supported-assets list.
 */
export const WITHDRAW_DESTINATIONS: WithdrawDestination[] = [
  { id: 'polygon-usdce', network: 'Polygon', token: 'USDC.e', chainId: '137', tokenAddress: POLYGON_USDC_E, recipientKind: 'evm', viaBridge: false },
  { id: 'polygon-usdc', network: 'Polygon', token: 'USDC', chainId: '137', tokenAddress: '0x3c499c542cEF5E3811e1192ce70d8cC03d5c3359', recipientKind: 'evm', viaBridge: true },
  { id: 'base-usdc', network: 'Base', token: 'USDC', chainId: '8453', tokenAddress: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913', recipientKind: 'evm', viaBridge: true },
  { id: 'arbitrum-usdc', network: 'Arbitrum', token: 'USDC', chainId: '42161', tokenAddress: '0xaf88d065e77c8cC2239327C5EDb3A432268e5831', recipientKind: 'evm', viaBridge: true },
  { id: 'optimism-usdc', network: 'Optimism', token: 'USDC', chainId: '10', tokenAddress: '0x0b2C639c533813f4Aa9D7837CAf62653d097Ff85', recipientKind: 'evm', viaBridge: true },
  { id: 'ethereum-usdc', network: 'Ethereum', token: 'USDC', chainId: '1', tokenAddress: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48', recipientKind: 'evm', viaBridge: true },
  { id: 'solana-usdc', network: 'Solana', token: 'USDC', chainId: '1151111081099710', tokenAddress: 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v', recipientKind: 'solana', viaBridge: true },
  { id: 'bnb-usdt', network: 'BNB Chain', token: 'USDT', chainId: '56', tokenAddress: '0x55d398326f99059fF775485246999027B3197955', recipientKind: 'evm', viaBridge: true },
  { id: 'tron-usdt', network: 'Tron', token: 'USDT', chainId: '728126428', tokenAddress: 'TR7NHqjeKQxGTCi8q8ZY4pL8otSzgjLj6t', recipientKind: 'tron', viaBridge: true },
];

export const DEFAULT_WITHDRAW_DESTINATION = WITHDRAW_DESTINATIONS[0];

export function findWithdrawDestination(id: string | undefined): WithdrawDestination | null {
  if (!id) return DEFAULT_WITHDRAW_DESTINATION;
  return WITHDRAW_DESTINATIONS.find((destination) => destination.id === id) ?? null;
}

const BASE58 = /^[1-9A-HJ-NP-Za-km-z]+$/;

/** Format check for the recipient on the destination's network. */
export function isValidRecipient(kind: RecipientKind, address: string): boolean {
  if (kind === 'evm') return isAddress(address, { strict: true }) && !/^0x0{40}$/i.test(address);
  if (kind === 'solana') return address.length >= 32 && address.length <= 44 && BASE58.test(address);
  return /^T[1-9A-HJ-NP-Za-km-z]{33}$/.test(address);
}

export function recipientHint(kind: RecipientKind): string {
  if (kind === 'solana') return 'Enter a valid Solana address.';
  if (kind === 'tron') return 'Enter a valid Tron address (starts with T).';
  return 'Enter a valid wallet address (0x…). Check the address and its checksum.';
}

/** Minimum withdrawal in USD: none for the direct route, the bridge's own
 * minimum otherwise (falls back to $3 if the bridge list can't be read). */
export async function withdrawMinimumUsd(destination: WithdrawDestination): Promise<number> {
  if (!destination.viaBridge) return 0;
  const minimum = await getBridgeMinimumUsd(destination.chainId, destination.tokenAddress).catch(() => null);
  return minimum ?? 3;
}
