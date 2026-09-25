import { withErrorHandling } from '@/lib/apiError';
import { requireAuth } from '@/lib/privy';
import { getOrCreateUser } from '@/lib/users';
import { getCryptoDepositInfo } from '@/lib/deposits/cryptoDeposit';

// Resolving the Deposit Wallet can deploy it through Polymarket's relayer.
export const maxDuration = 60;

/**
 * `GET /wallet/crypto-deposit` — the user's Polymarket bridge deposit
 * addresses (`evm`/`svm`/`btc`/`tron`), every supported token/chain with its
 * minimum (`/supported-assets`), and recent bridge transfers (`/status`).
 * Deposits arrive as pUSD. `{ unavailable: true }` when the account has no
 * embedded wallet yet.
 */
export async function GET(request: Request) {
  return withErrorHandling(async () => {
    const { privyUserId } = await requireAuth(request);
    const viewer = await getOrCreateUser(privyUserId);
    const info = await getCryptoDepositInfo(viewer.id, privyUserId);
    return Response.json(info ?? { unavailable: true });
  });
}
