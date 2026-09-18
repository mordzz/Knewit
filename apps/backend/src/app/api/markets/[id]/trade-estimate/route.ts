import { OrderSide } from '@polymarket/client';
import { ApiError, badRequest, notFound, withErrorHandling } from '@/lib/apiError';
import { requireAuth } from '@/lib/privy';
import { getPrimaryEthereumWallet } from '@/lib/users';
import { fetchMarketById } from '@/lib/polymarket/gammaClient';
import { getChoiceTokenId, parseChoices } from '@/lib/polymarket/normalize';
import { buildSecureClientForUser } from '@/lib/trading/client';

// Live order-book read through the authenticated client.
export const maxDuration = 60;

interface TradeEstimate {
  /** Depth-aware average fill price for a market BUY, in cents (2dp). */
  estimatedPrice: number;
  /** Shares that amount would buy at that average price, 2dp. */
  estimatedShares: number;
}

/**
 * `GET /markets/:id/trade-estimate?choiceIndex=&usdAmount=` — what a
 * market BUY of `usdAmount` would fill at right now, using Polymarket's
 * own `estimateMarketPrice` (walks the live order book, so it accounts
 * for depth). Auth-required because the official client resolves the
 * account's Deposit Wallet and authenticates the request; the trade
 * panel only shows this while signed in. A thin/empty book is a clean
 * `400 no_liquidity`, never a fabricated estimate (docs/API.md).
 */
export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  return withErrorHandling(async () => {
    const { id } = await params;
    const url = new URL(request.url);
    const rawChoice = url.searchParams.get('choiceIndex');
    const rawAmount = url.searchParams.get('usdAmount');

    if (!/^\d+$/.test(id)) {
      throw notFound(`Market ${id} not found.`);
    }
    const choiceIndex = rawChoice === null ? 0 : Number(rawChoice);
    if (!Number.isInteger(choiceIndex) || choiceIndex < 0) {
      throw badRequest('Expected ?choiceIndex=<non-negative integer>.');
    }
    const usdAmount = Number(rawAmount);
    if (!Number.isFinite(usdAmount) || usdAmount <= 0) {
      throw badRequest('Expected ?usdAmount=<number greater than 0>.');
    }

    const { privyUserId } = await requireAuth(request);
    const wallet = await getPrimaryEthereumWallet(privyUserId);
    if (!wallet) {
      throw badRequest('No embedded wallet found for this account.');
    }

    const market = await fetchMarketById(id);
    if (!market) {
      throw notFound(`Market ${id} not found.`);
    }
    const choice = parseChoices(market)[choiceIndex];
    if (!choice) {
      throw notFound(`Market ${id} has no choice at index ${choiceIndex}.`);
    }
    const tokenId = getChoiceTokenId(market, choiceIndex);
    if (!tokenId) {
      throw notFound(`Market ${id} has no tradable token for choice "${choice.label}".`);
    }

    const client = await buildSecureClientForUser(wallet.id);

    let price: number;
    try {
      price = await client.estimateMarketPrice({ assetId: tokenId, amount: usdAmount, side: OrderSide.BUY });
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      if (/no orderbook|no match|not enough|liquidity/i.test(message)) {
        throw new ApiError(
          400,
          'no_liquidity',
          'This market has no resting orders to fill against right now — nothing to trade.'
        );
      }
      throw error;
    }

    if (!Number.isFinite(price) || price <= 0) {
      throw new ApiError(502, 'upstream_error', `No usable price is available for market ${id} right now.`);
    }

    const estimate: TradeEstimate = {
      // Decimal cents (up to 4 dp) — same unit as `MarketChoice.price`;
      // a sub-cent price renders as e.g. 0.1000, never rounded to 0.
      estimatedPrice: Number((price * 100).toFixed(4)),
      estimatedShares: Number((usdAmount / price).toFixed(4)),
    };
    return Response.json(estimate);
  });
}
