/**
 * EVM address helpers shared by the Polymarket Data API client and
 * `lib/users.ts`'s wallet-id resolution.
 *
 * Addresses here are always 0x-prefixed 40-hex-character strings. No
 * checksum normalization is attempted: every writer of a wallet address
 * this backend compares against  Privy's linked-account API
 * (`lib/users.ts::fetchPrivyProfileHints`, `getPrimaryEthereumWallet`)
 * and Polymarket's Data API (`proxyWallet`)  returns lowercase hex, so
 * lowercase is the project's canonical comparison form. `isWalletAddress`
 * accepts either case for *input* (a client could send EIP-55 checksummed
 * text) and `normalizeWalletAddress` folds it the same way every time.
 */
const WALLET_ADDRESS_RE = /^0x[0-9a-fA-F]{40}$/;

export function isWalletAddress(value: string): boolean {
  return WALLET_ADDRESS_RE.test(value.trim());
}

export function normalizeWalletAddress(value: string): string {
  return value.trim().toLowerCase();
}

/** `0x1234…abcd`  the honest last-resort display handle for a Polymarket
 * trader who has no `userName`, never an invented one. */
export function shortenWalletAddress(value: string): string {
  const address = value.trim();
  if (address.length <= 12) return address;
  return `${address.slice(0, 6)}…${address.slice(-4)}`;
}
