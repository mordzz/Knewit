import { ApiError, withErrorHandling } from '@/lib/apiError';
import { requireAuth } from '@/lib/privy';
import { getOrCreateUser } from '@/lib/users';
import { forwardCardDeposit, getCardDepositState, isCardDepositEnabled } from '@/lib/deposits/cardDeposit';

export const maxDuration = 60;

function assertEnabled() {
  if (!isCardDepositEnabled()) {
    throw new ApiError(503, 'card_deposit_unavailable', 'Card deposits are not available yet.');
  }
}

/** `GET /wallet/card-deposit`  the embedded wallet a card purchase lands
 * in and the native USDC waiting there: `{ address, usdcBalance }`. */
export async function GET(request: Request) {
  return withErrorHandling(async () => {
    assertEnabled();
    const { privyUserId } = await requireAuth(request);
    return Response.json((await getCardDepositState(privyUserId)) ?? { unavailable: true });
  });
}

/** `POST /wallet/card-deposit`  forwards that USDC to the user's bridge
 * deposit address (it arrives as pUSD). `{ status: 'forwarded' | 'nothing',
 * amountUsd, transactionHash }`. */
export async function POST(request: Request) {
  return withErrorHandling(async () => {
    assertEnabled();
    const { privyUserId } = await requireAuth(request);
    const viewer = await getOrCreateUser(privyUserId);
    return Response.json(
      await forwardCardDeposit({
        userId: viewer.id,
        privyUserId,
        idempotencyKey: request.headers.get('idempotency-key'),
      })
    );
  });
}
