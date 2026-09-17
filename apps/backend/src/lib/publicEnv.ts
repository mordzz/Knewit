/**
 * Client-safe env vars — Next.js only inlines `NEXT_PUBLIC_*` into the
 * browser bundle, so this is a separate surface from `lib/env.ts`
 * (server-only, throws on a missing var, used by API routes). The
 * Privy app id itself isn't a secret — it's the same public identifier
 * the mobile app ships as `EXPO_PUBLIC_PRIVY_APP_ID` — but Next.js
 * still requires its own `NEXT_PUBLIC_`-prefixed copy for the web
 * client to read it; both must be set to the same value as the
 * server-side `PRIVY_APP_ID` (see `.env.example`).
 */
export const publicEnv = {
  privyAppId: process.env.NEXT_PUBLIC_PRIVY_APP_ID ?? '',
};

export const isPrivyConfigured = publicEnv.privyAppId.length > 0;
