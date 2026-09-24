import { ApiError, withErrorHandling } from '@/lib/apiError';
import { requireAuth } from '@/lib/privy';
import { convertDepositForUser } from '@/lib/deposits/convertDeposit';

// Quote + execute + (indirectly) wait on a relayer-deployed Deposit
// Wallet — same budget as the other trading/wallet routes that touch the
// Polymarket relayer or a Privy wallet action.
export const maxDuration = 60;

/**
 * `POST /wallet/convert-to-collateral` — wraps the USDC.e that has
 * arrived in the caller's Polymarket Deposit Wallet (via the Polymarket
 * bridge, a card purchase, or sent directly) into pUSD trading collateral. The logic lives in
 * `lib/deposits/convertDeposit.ts`, shared with the Alchemy deposit
 * webhook. Returns `{ status, amountUsd, errorMessage }`; 202 while an
 * on-chain step is still unresolved.
 */
export async function POST(request: Request) {
  return withErrorHandling(async () => {
    if (process.env.NEXT_PUBLIC_TRADING_ENABLED !== 'true') {
      throw new ApiError(503, 'trading_unavailable', 'Deposits are temporarily unavailable.');
    }
    const { privyUserId } = await requireAuth(request);
    const { body, httpStatus } = await convertDepositForUser(
      privyUserId,
      request.headers.get('idempotency-key')
    );
    return Response.json(body, { status: httpStatus });
  });
}
