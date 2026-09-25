import { isAddress } from 'viem';
import type { BridgeAddressType } from '@/lib/deposits/polymarketBridge';

const BASE58 = /^[1-9A-HJ-NP-Za-km-z]+$/;

/** Format check for a withdrawal recipient on the destination chain. EVM
 * uses viem's strict mode, which also verifies a mixed-case checksum. */
export function isValidRecipient(type: BridgeAddressType, address: string): boolean {
  if (type === 'evm') return isAddress(address, { strict: true }) && !/^0x0{40}$/i.test(address);
  if (type === 'svm') return address.length >= 32 && address.length <= 44 && BASE58.test(address);
  if (type === 'tron') return /^T[1-9A-HJ-NP-Za-km-z]{33}$/.test(address);
  return /^(bc1[02-9ac-hj-np-z]{11,71}|[13][1-9A-HJ-NP-Za-km-z]{25,34})$/.test(address);
}

export function recipientHint(type: BridgeAddressType): string {
  if (type === 'svm') return 'Enter a valid Solana address.';
  if (type === 'tron') return 'Enter a valid Tron address (starts with T).';
  if (type === 'btc') return 'Enter a valid Bitcoin address.';
  return 'Enter a valid wallet address (0x…). Check the address and its checksum.';
}
