import { withErrorHandling } from '@/lib/apiError';
import { requireAuth } from '@/lib/privy';
import { getOrCreateUser } from '@/lib/users';
import { getUserPortfolio } from '@/lib/trading/portfolio';

/** `GET /positions` — the authenticated user's portfolio, read live from
 * Polymarket's Data API for their Deposit Wallet (docs/API.md): open
 * positions plus resolved winners that can be redeemed. */
export async function GET(request: Request) {
  return withErrorHandling(async () => {
    const { privyUserId } = await requireAuth(request);
    const viewer = await getOrCreateUser(privyUserId);
    return Response.json(await getUserPortfolio(viewer.id, privyUserId));
  });
}
