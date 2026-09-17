import { ApiKeyCreds, ClobClient, Chain, SignatureType } from '@polymarket/clob-client';
import { PrivyClobSigner } from '@/lib/trading/privyClobSigner';

const CLOB_HOST = 'https://clob.polymarket.com';

/**
 * Builds a per-request `ClobClient` for one user's wallet. `SignatureType.EOA`
 * — this app doesn't deploy Polymarket proxy/Gnosis-Safe wallets for
 * users; the Privy embedded wallet trades directly as a plain EOA,
 * which must hold its own USDC and have approved the Exchange
 * contract (verified against docs.polymarket.com — see
 * docs/WALLET.md/DECISIONS.md for what this implies about funding UX,
 * not yet built into the mobile app).
 *
 * L1 API-credential derivation (`createOrDeriveApiKey`) happens on
 * every call rather than being cached — it's idempotent (same wallet +
 * nonce returns the same credentials), so the extra round trip only
 * costs latency, not correctness, and avoids a credentials-cache
 * migration for a code path that isn't verified end-to-end yet.
 */
export async function buildClobClientForUser(walletId: string, walletAddress: string): Promise<ClobClient> {
  const signer = new PrivyClobSigner(walletId, walletAddress);

  const bootstrapClient = new ClobClient(
    CLOB_HOST,
    Chain.POLYGON,
    signer,
    undefined,
    SignatureType.EOA,
    walletAddress
  );
  const creds: ApiKeyCreds = await bootstrapClient.createOrDeriveApiKey();

  return new ClobClient(CLOB_HOST, Chain.POLYGON, signer, creds, SignatureType.EOA, walletAddress);
}
