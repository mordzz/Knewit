import { PrivyClient } from '@privy-io/node';
import { env } from '@/lib/env';

let privyClient: PrivyClient | null = null;
function getPrivyClient(): PrivyClient {
  if (!privyClient) {
    privyClient = new PrivyClient({ appId: env.privyAppId, appSecret: env.privyAppSecret });
  }
  return privyClient;
}

/**
 * Adapts a Privy-custodied embedded wallet to `@polymarket/clob-client`'s
 * `ClobSigner` interface (`_signTypedData` + `getAddress`) so the
 * official CLOB client can sign the L1 auth message and every order
 * without this backend ever touching a private key — Privy does, via
 * its server-side wallet RPC (`eth_signTypedData_v4`).
 *
 * **Requires the wallet to have delegated signing authority to this
 * app** (Privy's "session signers"/delegated actions) — the mobile
 * app (`apps/frontend`, Sprint 6) only implemented wallet
 * creation/connection, not delegation, so this call is expected to be
 * rejected by Privy until that client-side prerequisite is added.
 * This is intentionally not silently caught: the caller (see
 * `app/api/trading/orders/route.ts`) surfaces whatever error Privy
 * returns as a real trade failure, never a fabricated success — see
 * docs/DECISIONS.md, "No Fake Trade Success."
 */
/** Structurally matches `@polymarket/clob-client`'s `ClobSigner`
 * union's `EthersSigner` variant (`_signTypedData` + `getAddress`) —
 * not declared `implements ClobSigner` since that type is a union
 * TypeScript can't check a class against directly; the CLOB client
 * accepts this by shape. */
export class PrivyClobSigner {
  constructor(
    private readonly walletId: string,
    private readonly address: string
  ) {}

  async getAddress(): Promise<string> {
    return this.address;
  }

  async _signTypedData(
    domain: Record<string, unknown>,
    types: Record<string, Array<{ name: string; type: string }>>,
    value: Record<string, unknown>
  ): Promise<string> {
    // `eth_signTypedData_v4` (and the EIP-712 JSON format it expects)
    // requires an `EIP712Domain` type entry alongside the message's own
    // types — ethers' `_signTypedData` callers (what `ClobSigner`
    // mimics) normally omit it and let the signer library add it; we
    // must add it ourselves since we're calling Privy's raw RPC.
    const domainFields = Object.keys(domain).map((name) => ({
      name,
      type: name === 'chainId' ? 'uint256' : name === 'verifyingContract' ? 'address' : 'string',
    }));

    const primaryType = Object.keys(types)[0];
    if (!primaryType) {
      throw new Error('signTypedData: no primary type found in `types`.');
    }

    const result = await getPrivyClient().wallets().ethereum().signTypedData(this.walletId, {
      params: {
        typed_data: {
          domain: domain as Record<string, string | number>,
          types: { EIP712Domain: domainFields, ...types },
          primary_type: primaryType,
          message: value,
        },
      },
    });

    return result.signature;
  }
}
