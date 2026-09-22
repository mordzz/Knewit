import { createSecureClient } from '@polymarket/client';
import { signerFrom } from '@polymarket/client/privy';
import { builderApiKey } from '@polymarket/client/node';
import { ApiError } from '@/lib/apiError';
import { env } from '@/lib/env';
import { getPrivyClient } from '@/lib/privyClient';

export type UserSecureClient = Awaited<ReturnType<typeof createSecureClient>>;

/**
 * Builds the official Polymarket client (`@polymarket/client`) for one
 * user's wallet, signed by the Privy-custodied EOA through its own Privy
 * adapter (`signerFrom`) and authorized with the app's Builder API key.
 *
 * This is the **only** trading client now: it resolves the account's
 * wallet type (for these users: a Deposit Wallet, `walletType: 3`),
 * deploys it through Polymarket's gasless relayer when missing,
 * authenticates CLOB requests with the correct POLY_1271 binding, and
 * signs orders — all of which the older `clob-client` packages got
 * wrong (docs/DECISIONS.md, "Trading Fixed: Official @polymarket/client").
 * Builder credentials are required — without them the client can't
 * authenticate; the error says exactly which env vars to set.
 */
export async function buildSecureClientForUser(walletId: string): Promise<UserSecureClient> {
  const key = env.polymarketBuilderApiKey;
  const secret = env.polymarketBuilderSecret;
  const passphrase = env.polymarketBuilderPassphrase;
  if (!key || !secret || !passphrase) {
    throw new ApiError(
      500,
      'builder_keys_missing',
      'Polymarket Builder API credentials are not configured (POLYMARKET_BUILDER_API_KEY/SECRET/PASSPHRASE) — see docs/WALLET.md.'
    );
  }

  const signer = signerForUserWallet(walletId);

  return createSecureClient({ signer, apiKey: builderApiKey({ key, secret, passphrase }) });
}

/** The signer associated with the user's Privy EOA (owner of their deterministic Deposit Wallet). */
export function signerForUserWallet(walletId: string) {
  const authorizationContext = env.privyAuthorizationPrivateKey
    ? { authorization_private_keys: [env.privyAuthorizationPrivateKey] }
    : undefined;
  return signerFrom({ privy: getPrivyClient(), walletId, authorizationContext });
}
