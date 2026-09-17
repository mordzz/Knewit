import { OrderType, Side } from '@polymarket/clob-client';
import { ApiError, badRequest, notFound } from '@/lib/apiError';
import { getPrimaryEthereumWallet } from '@/lib/users';
import { fetchMarketById } from '@/lib/polymarket/gammaClient';
import { getOutcomeTokenId } from '@/lib/polymarket/normalize';
import { buildClobClientForUser } from '@/lib/trading/clobClient';
import type { Outcome } from '@/types/market';

export interface PlaceOrderResult {
  tokenId: string;
  status: 'filled' | 'failed';
  filledSize: number; // shares
  filledPrice: number; // cents
  polymarketOrderId: string | null;
  errorMessage: string | null;
}

/**
 * Market-price BUY only, MVP scope (docs/PRD.md — no limit orders, no
 * SELL yet). Uses `OrderType.FAK` (Fill-And-Kill) — fills against
 * whatever liquidity exists immediately and cancels the rest, the
 * correct CLOB order type for "market order" semantics (verified
 * against docs.polymarket.com; there is no literal "market order"
 * type on the CLOB itself).
 *
 * **Unverified end-to-end**: this has not been exercised against a
 * funded wallet or a real fill — see `privyClobSigner.ts`'s doc
 * comment for the missing delegated-signing prerequisite. Every
 * failure here (signing rejected, CLOB rejects the order, no
 * liquidity) surfaces as a real error / `status: 'failed'`, never a
 * fabricated fill — docs/DECISIONS.md, "No Fake Trade Success."
 */
export async function placeMarketOrder(params: {
  privyUserId: string;
  marketId: string;
  outcome: Outcome;
  usdAmount: number;
}): Promise<PlaceOrderResult> {
  const wallet = await getPrimaryEthereumWallet(params.privyUserId);
  if (!wallet) {
    throw badRequest('No embedded wallet found for this account — connect a wallet before trading.');
  }

  if (!/^\d+$/.test(params.marketId)) throw notFound(`Market ${params.marketId} not found.`);
  const market = await fetchMarketById(params.marketId);
  if (!market) throw notFound(`Market ${params.marketId} not found.`);

  const tokenId = getOutcomeTokenId(market, params.outcome);
  if (!tokenId) {
    throw badRequest(`Market ${params.marketId} has no tradable ${params.outcome} outcome (non-binary market?).`);
  }

  const clobClient = await buildClobClientForUser(wallet.id, wallet.address);

  let signedOrder;
  try {
    signedOrder = await clobClient.createMarketOrder({
      tokenID: tokenId,
      amount: params.usdAmount,
      side: Side.BUY,
      orderType: OrderType.FAK,
    });
  } catch (error) {
    throw new ApiError(
      502,
      'signing_failed',
      'Failed to sign the order with this wallet. This most likely means the wallet has not delegated ' +
        'signing authority to the app yet (see apps/backend/src/lib/trading/privyClobSigner.ts). ' +
        `Upstream error: ${error instanceof Error ? error.message : String(error)}`
    );
  }

  const response = (await clobClient.postOrder(signedOrder, OrderType.FAK)) as {
    success?: boolean;
    errorMsg?: string;
    orderID?: string;
    makingAmount?: string | number;
    takingAmount?: string | number;
  };

  // BUY: makerAmount/makingAmount is the USD actually spent,
  // takerAmount/takingAmount is the shares actually received
  // (verified against docs.polymarket.com's order field table).
  const filledUsd = Number(response.makingAmount ?? 0);
  const filledSize = Number(response.takingAmount ?? 0);

  if (!response.success || filledSize <= 0) {
    return {
      tokenId,
      status: 'failed',
      filledSize: 0,
      filledPrice: 0,
      polymarketOrderId: null,
      errorMessage: response.errorMsg || 'Order was not filled (no matching liquidity).',
    };
  }

  return {
    tokenId,
    status: 'filled',
    filledSize,
    filledPrice: Math.round((filledUsd / filledSize) * 100),
    polymarketOrderId: response.orderID ?? null,
    errorMessage: null,
  };
}
