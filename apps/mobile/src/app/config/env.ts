/**
 * Only EXPO_PUBLIC_* variables reach the app bundle. Secrets (Polymarket
 * API keys, Privy secret key, DB credentials) live on the backend only —
 * see docs/WALLET.md and docs/API.md.
 */
// Endpoint paths (`/feed`, `/markets`, …) are relative to the API root,
// so the base URL must end in `/api` (e.g. `https://example.com/api`).
const apiBaseUrl = (process.env.EXPO_PUBLIC_API_BASE_URL ?? 'http://localhost:3000/api').replace(/\/+$/, '');

export const env = {
  apiBaseUrl,
  /** The web app's origin — for opening its pages (Terms, Privacy,
   * Settings links), which live outside `/api`. */
  webBaseUrl: apiBaseUrl.replace(/\/api$/, ''),
  privyAppId: process.env.EXPO_PUBLIC_PRIVY_APP_ID ?? '',
  /** Optional per Privy's own SDK types — some apps don't need it. Kept
   * as its own env var (not folded into `privyAppId`) since Privy's
   * dashboard issues it separately. */
  privyClientId: process.env.EXPO_PUBLIC_PRIVY_CLIENT_ID ?? '',
  /** Public key-quorum ID of the backend's authorization key — used by
   * the Wallet screen's one-time "Enable trading" button
   * (`useSigners().addSigners`) so the owner grants the backend's key
   * signing authority on their embedded wallet (docs/WALLET.md, "Backend
   * Signing"). Public by design; the private key stays on the backend. */
  privySignerId: process.env.EXPO_PUBLIC_PRIVY_SIGNER_ID ?? '',
  /** Public Polygon JSON-RPC used by Privy's client-side chain reads. */
  polygonRpcUrl: process.env.EXPO_PUBLIC_POLYGON_RPC_URL || 'https://polygon-bor-rpc.publicnode.com',
  tradingEnabled: process.env.EXPO_PUBLIC_TRADING_ENABLED === 'true',
  isDev: __DEV__,
} as const;

/** Whether real Privy credentials are configured — gates whether the
 * app attempts real Privy auth/wallet calls at all, so a blank
 * `EXPO_PUBLIC_PRIVY_APP_ID` (the shipped default with no `.env`
 * created yet) degrades to an honest "not configured" UI instead of
 * calling Privy with an invalid app id — see docs/WALLET.md. */
export const isPrivyConfigured = env.privyAppId.length > 0;
