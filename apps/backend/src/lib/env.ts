function required(name: string, value: string | undefined): string {
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

export const env = {
  get supabaseUrl() {
    return required('SUPABASE_URL', process.env.SUPABASE_URL);
  },
  get supabaseServiceRoleKey() {
    return required('SUPABASE_SERVICE_ROLE_KEY', process.env.SUPABASE_SERVICE_ROLE_KEY);
  },
  get privyAppId() {
    return required('PRIVY_APP_ID', process.env.PRIVY_APP_ID);
  },
  get privyAppSecret() {
    return required('PRIVY_APP_SECRET', process.env.PRIVY_APP_SECRET);
  },
  /** P-256 authorization key (base64 PKCS8, no PEM headers) whose public
   * half the Privy Dashboard registered as a signer on this app's user
   * embedded wallets. Lets the backend sign L1/L2 auth and orders on a
   * user's behalf (`privyClobSigner.ts`). Optional at boot — read-only
   * browsing works without it; signing fails with a clear error instead
   * (docs/WALLET.md, "Backend Signing"). */
  get privyAuthorizationPrivateKey() {
    return process.env.PRIVY_AUTHORIZATION_PRIVATE_KEY;
  },
  get polymarketGammaBaseUrl() {
    return process.env.POLYMARKET_GAMMA_BASE_URL ?? 'https://gamma-api.polymarket.com';
  },
  get polymarketDataBaseUrl() {
    return process.env.POLYMARKET_DATA_BASE_URL ?? 'https://data-api.polymarket.com';
  },
  get polymarketClobBaseUrl() {
    return process.env.POLYMARKET_CLOB_BASE_URL ?? 'https://clob.polymarket.com';
  },
};
