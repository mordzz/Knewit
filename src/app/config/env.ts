/**
 * Only EXPO_PUBLIC_* variables reach the app bundle. Secrets (Polymarket
 * API keys, Privy secret key, DB credentials) live on the backend only —
 * see docs/WALLET.md and docs/API.md for the security boundary.
 */
export const env = {
  apiBaseUrl: process.env.EXPO_PUBLIC_API_BASE_URL ?? 'http://localhost:3000',
  privyAppId: process.env.EXPO_PUBLIC_PRIVY_APP_ID ?? '',
} as const;
