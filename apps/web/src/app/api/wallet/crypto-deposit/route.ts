import { withErrorHandling } from '@/lib/apiError';
import { requireAuth } from '@/lib/privy';
import { getCryptoDepositInfo } from '@/lib/deposits/depositAddresses';

// Resolving the Deposit Wallet can deploy it through Polymarket's relayer.
export const maxDuration = 60;

/**
 * `GET /wallet/crypto-deposit` — the crypto deposit screen's data: the
 * Polygon address for native USDC (embedded wallet) and for USDC.e
 * (Polymarket Deposit Wallet), what has already arrived at each, and
 * whether arrivals convert automatically (`autoConvert`). Converting is
 * `POST /wallet/convert-to-collateral`. Returns `{ unavailable: true }`
 * when the account has no embedded wallet yet.
 */
export async function GET(request: Request) {
  return withErrorHandling(async () => {
    const { privyUserId } = await requireAuth(request);
    const info = await getCryptoDepositInfo(privyUserId);
    return Response.json(info ?? { unavailable: true });
  });
}
