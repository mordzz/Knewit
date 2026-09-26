import { badRequest, withErrorHandling } from '@/lib/apiError';
import { requireAuth } from '@/lib/privy';
import { findBridgeAsset, getBridgeQuote } from '@/lib/deposits/polymarketBridge';
import { isValidRecipient, recipientHint } from '@/lib/deposits/recipients';
import { POLYMARKET_PUSD } from '@/lib/trading/collateral';

/**
 * `POST /wallet/withdraw-quote` `{ chainId, tokenAddress, recipient, amount }`
 *  what the recipient will receive and what the route costs, from the
 * bridge's `/quote` (pUSD on Polygon → the chosen token/chain).
 */
export async function POST(request: Request) {
  return withErrorHandling(async () => {
    await requireAuth(request);
    const body = (await request.json().catch(() => null)) as {
      chainId?: string;
      tokenAddress?: string;
      recipient?: string;
      amount?: string;
    } | null;
    const asset = await findBridgeAsset(String(body?.chainId ?? ''), String(body?.tokenAddress ?? ''));
    if (!asset) throw badRequest('Choose a supported token and chain.');
    const recipient = (body?.recipient ?? '').trim();
    if (!isValidRecipient(asset.addressType, recipient)) throw badRequest(recipientHint(asset.addressType));
    const amount = Number(body?.amount);
    if (!Number.isFinite(amount) || amount <= 0) throw badRequest('Enter a withdrawal amount greater than zero.');

    return Response.json(
      await getBridgeQuote({
        amount,
        fromTokenAddress: POLYMARKET_PUSD,
        toChainId: asset.chainId,
        toTokenAddress: asset.tokenAddress,
        toDecimals: asset.decimals,
        recipient,
      })
    );
  });
}
