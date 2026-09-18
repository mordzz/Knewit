import { PrivyClient } from '@privy-io/node';
import { env } from '@/lib/env';

let client: PrivyClient | null = null;

/** The one server-side Privy client — app-secret auth for API calls and
 * wallet RPC (with a per-request `authorization_context`). Used by the
 * Polymarket client's Privy signer adapter (`lib/trading/client.ts`). */
export function getPrivyClient(): PrivyClient {
  if (!client) {
    client = new PrivyClient({ appId: env.privyAppId, appSecret: env.privyAppSecret });
  }
  return client;
}
