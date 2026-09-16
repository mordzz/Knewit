/**
 * Only EXPO_PUBLIC_* variables reach the app bundle. Secrets (Polymarket
 * API keys, Privy secret key, DB credentials) live on the backend only —
 * see docs/WALLET.md and docs/API.md.
 */
export const env = {
  apiBaseUrl: process.env.EXPO_PUBLIC_API_BASE_URL ?? 'http://localhost:3000',
  privyAppId: process.env.EXPO_PUBLIC_PRIVY_APP_ID ?? '',
  /** Optional per Privy's own SDK types — some apps don't need it. Kept
   * as its own env var (not folded into `privyAppId`) since Privy's
   * dashboard issues it separately. */
  privyClientId: process.env.EXPO_PUBLIC_PRIVY_CLIENT_ID ?? '',
  isDev: __DEV__,
} as const;

/** Whether real Privy credentials are configured — gates whether the
 * app attempts real Privy auth/wallet calls at all, so a blank
 * `EXPO_PUBLIC_PRIVY_APP_ID` (the shipped default with no `.env`
 * created yet) degrades to an honest "not configured" UI instead of
 * calling Privy with an invalid app id — see docs/WALLET.md. */
export const isPrivyConfigured = env.privyAppId.length > 0;
