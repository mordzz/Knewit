import { badRequest, withErrorHandling } from '@/lib/apiError';
import { requireAuth } from '@/lib/privy';
import { redeemMarketPositions } from '@/lib/trading/orders';

// Covers cold start plus the relayer round trip.
export const maxDuration = 60;

/**
 * `POST /trading/redeem` `{ conditionId }`  turns a resolved market's
 * winning shares into pUSD in the caller's Deposit Wallet (Polymarket's
 * `redeemPositions`, gasless). Only succeeds when Polymarket reports a
 * redeemable position for this user in that market.
 */
export async function POST(request: Request) {
  return withErrorHandling(async () => {
    const { privyUserId } = await requireAuth(request);
    const body = (await request.json().catch(() => null)) as { conditionId?: unknown } | null;
    if (!body || typeof body.conditionId !== 'string') throw badRequest('Expected { conditionId: string }.');
    return Response.json(await redeemMarketPositions({ privyUserId, conditionId: body.conditionId }));
  });
}
