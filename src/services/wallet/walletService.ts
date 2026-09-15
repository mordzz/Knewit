export interface WalletConnection {
  address: string;
}

/**
 * Not implemented in Sprint 0. These will wrap the Privy embedded-wallet
 * SDK once it's wired into AppProviders — see docs/WALLET.md. Kept as typed
 * stubs now so features can be built against a stable interface without
 * pulling in the SDK before it's actually used.
 */
export async function connectWallet(): Promise<WalletConnection> {
  throw new Error('connectWallet is not implemented yet — see docs/WALLET.md');
}

export async function disconnectWallet(): Promise<void> {
  throw new Error('disconnectWallet is not implemented yet — see docs/WALLET.md');
}
