import { badRequest, withErrorHandling } from '@/lib/apiError';
import { requireAuth } from '@/lib/privy';
import { getBridgeQuote } from '@/lib/deposits/polymarketBridge';
import { POLYGON_USDC_E } from '@/lib/trading/collateral';
import { findWithdrawDestination, isValidRecipient, recipientHint } from '@/lib/deposits/withdrawDestinations';

/**
 * `POST /wallet/withdraw-quote` `{ destination, recipient, amount }` — what
 * the recipient will receive and what the route costs, before the user
 * confirms. The direct USDC.e route costs nothing; bridge routes use the
 * Polymarket bridge's own quote (fees vary a lot by network).
 */
export async function POST(request: Request) {
  return withErrorHandling(async () => {
    await requireAuth(request);
    const body = (await request.json().catch(() => null)) as {
      destination?: string;
      recipient?: string;
      amount?: string;
    } | null;
    const destination = findWithdrawDestination(body?.destination);
    if (!destination) throw badRequest('Choose a supported withdrawal network.');
    const recipient = (body?.recipient ?? '').trim();
    if (!isValidRecipient(destination.recipientKind, recipient)) {
      throw badRequest(recipientHint(destination.recipientKind));
    }
    const amount = Number(body?.amount);
    if (!Number.isFinite(amount) || amount <= 0) throw badRequest('Enter a withdrawal amount greater than zero.');

    if (!destination.viaBridge) {
      return Response.json({ estimatedReceived: amount, minReceived: amount, totalCostUsd: 0, estimatedSeconds: 10 });
    }
    return Response.json(
      await getBridgeQuote({
        amountUsdcE: amount,
        fromTokenAddress: POLYGON_USDC_E,
        toChainId: destination.chainId,
        toTokenAddress: destination.tokenAddress,
        recipient,
      })
    );
  });
}
