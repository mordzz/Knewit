import { withErrorHandling } from '@/lib/apiError';
import { requireAuth } from '@/lib/privy';
import { convertDepositForUser } from '@/lib/deposits/convertDeposit';

// Quote + execute + (indirectly) wait on a relayer-deployed Deposit
// Wallet — same budget as the other trading/wallet routes that touch the
// Polymarket relayer or a Privy wallet action.
export const maxDuration = 60;

/**
 * `POST /wallet/convert-to-collateral` — converts the caller's arrived
 * deposit (native USDC in the embedded wallet, or USDC.e already in the
 * Polymarket Deposit Wallet) into trading collateral. The logic lives in
 * `lib/deposits/convertDeposit.ts`, shared with the Alchemy deposit
 * webhook. Returns `{ status, amountUsd, errorMessage }`; 202 while an
 * on-chain step is still unresolved.
 */
export async function POST(request: Request) {
  return withErrorHandling(async () => {
    const { privyUserId } = await requireAuth(request);
    const { body, httpStatus } = await convertDepositForUser(
      privyUserId,
      request.headers.get('idempotency-key')
    );
    return Response.json(body, { status: httpStatus });
  });
}
