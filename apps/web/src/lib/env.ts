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
  /** Public object URL base, normalized (supabase-js itself strips the
   * trailing slash when it builds `getPublicUrl`, so every comparison
   * against a stored image URL must use this shape, not `supabaseUrl`). */
  get supabaseStoragePublicUrlBase() {
    return `${this.supabaseUrl.replace(/\/+$/, '')}/storage/v1/object/public/`;
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
   * embedded wallets. Lets the backend sign on a user's behalf through
   * the Polymarket client's Privy signer adapter (`lib/trading/client.ts`).
   * Optional at boot — read-only browsing works without it; signing fails
   * with a clear error instead (docs/WALLET.md, "Backend Signing"). */
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
  /** Polymarket **Builder API credentials** (`polymarket.com/settings →
   * Builder`). Required for the official `@polymarket/client`: it
   * authorizes the account setup (deposit-wallet deploy, trading
   * approvals) and order placement. Without them, trading endpoints fail
   * with `builder_keys_missing` (docs/WALLET.md). */
  get polymarketBuilderApiKey() {
    return process.env.POLYMARKET_BUILDER_API_KEY;
  },
  get polymarketBuilderSecret() {
    return process.env.POLYMARKET_BUILDER_SECRET;
  },
  get polymarketBuilderPassphrase() {
    return process.env.POLYMARKET_BUILDER_PASSPHRASE;
  },
  /** Builder code (Polymarket → Settings → Builders), sent as
   * `X-Builder-Code` to the bridge so deposits are attributed to this
   * app. Optional — the bridge works without it. */
  get polymarketBuilderCode() {
    return process.env.POLYMARKET_BUILDER_CODE;
  },
  /** Polygon JSON-RPC endpoint (e.g. an Alchemy/Infura app URL) used to
   * read on-chain balances directly (native USDC on a user's embedded
   * wallet — not tracked by the CLOB's own balance endpoint, which only
   * knows about the Deposit Wallet's collateral). */
  get polygonRpcUrl() {
    return required('POLYGON_RPC_URL', process.env.POLYGON_RPC_URL);
  },
  /** Alchemy "Address Activity" webhook for crypto deposits (all three
   * optional — without them, deposits still convert when the app checks,
   * just not automatically in the background). Signing key: shown on the
   * webhook in the Alchemy dashboard; used to verify `X-Alchemy-Signature`. */
  get alchemyWebhookSigningKey() {
    return process.env.ALCHEMY_WEBHOOK_SIGNING_KEY;
  },
  /** The webhook's id (e.g. `wh_...`) — addresses are added to it as users
   * open the crypto deposit screen. */
  get alchemyWebhookId() {
    return process.env.ALCHEMY_WEBHOOK_ID;
  },
  /** Alchemy "Auth Token" (Notify API, top of the webhooks dashboard) —
   * needed to add addresses to the webhook. */
  get alchemyNotifyAuthToken() {
    return process.env.ALCHEMY_NOTIFY_AUTH_TOKEN;
  },
};
