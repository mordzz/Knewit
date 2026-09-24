import { badRequest, withErrorHandling } from '@/lib/apiError';
import { requireAuth } from '@/lib/privy';
import { getBridgeTransactions } from '@/lib/deposits/polymarketBridge';

/**
 * `GET /wallet/withdraw-status?address=` — the Polymarket bridge's status
 * for a bridge withdrawal (the `bridgeAddress` a withdrawal returned):
 * newest transaction first, `status` from DEPOSIT_DETECTED … COMPLETED /
 * FAILED.
 */
export async function GET(request: Request) {
  return withErrorHandling(async () => {
    await requireAuth(request);
    const address = new URL(request.url).searchParams.get('address') ?? '';
    if (!/^0x[a-fA-F0-9]{40}$/.test(address)) throw badRequest('Expected ?address= (a bridge withdrawal address).');
    return Response.json({ transactions: await getBridgeTransactions(address) });
  });
}
