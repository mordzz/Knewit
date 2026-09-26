import { notFound, withErrorHandling } from '@/lib/apiError';
import { requireAuth } from '@/lib/privy';
import { getOrCreateUser } from '@/lib/users';
import { fetchMarketById } from '@/lib/polymarket/gammaClient';
import { getUserPortfolio } from '@/lib/trading/portfolio';

/** `GET /positions/:marketId`  the authenticated user's largest holding
 * in one market (live from Polymarket's Data API), or 404 if none. */
export async function GET(request: Request, { params }: { params: Promise<{ marketId: string }> }) {
  return withErrorHandling(async () => {
    const { marketId } = await params;
    const { privyUserId } = await requireAuth(request);
    const viewer = await getOrCreateUser(privyUserId);

    const market = /^\d+$/.test(marketId) ? await fetchMarketById(marketId) : null;
    if (!market) throw notFound(`No position for market ${marketId}.`);
    const positions = await getUserPortfolio(viewer.id, privyUserId, market.conditionId);
    const position = positions.sort((a, b) => b.size - a.size)[0];
    if (!position) throw notFound(`No position for market ${marketId}.`);
    return Response.json({ ...position, marketId });
  });
}
