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
  get polymarketGammaBaseUrl() {
    return process.env.POLYMARKET_GAMMA_BASE_URL ?? 'https://gamma-api.polymarket.com';
  },
};
