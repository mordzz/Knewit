export interface WalletConnection {
  address: string;
}

/**
 * Not implemented yet. These will wrap the Privy embedded-wallet SDK
 * once it's wired into AppProviders — see docs/WALLET.md. Kept as typed
 * stubs now so features can be built against a stable interface without
 * pulling in the SDK before it's actually used. Lives here, not in a
 * global services folder, because the only place that ever calls these
 * is the Auth flow's own connect UI (`SignInScreen`) — the *result*
 * (connection state) is what's global, via `useWallet`/`walletStore`,
 * not the action that produces it — see docs/DECISIONS.md.
 */
export async function connectWallet(): Promise<WalletConnection> {
  throw new Error('connectWallet is not implemented yet — see docs/WALLET.md');
}

export async function disconnectWallet(): Promise<void> {
  throw new Error('disconnectWallet is not implemented yet — see docs/WALLET.md');
}
