import { OrderSide } from '@polymarket/client';
import { fetchBalanceAllowance } from '@polymarket/client/actions';
import { AssetType } from '@polymarket/bindings/clob';
import { ApiError, badRequest, notFound } from '@/lib/apiError';
import { getPrimaryEthereumWallet } from '@/lib/users';
import { fetchMarketById } from '@/lib/polymarket/gammaClient';
import { getChoiceTokenId, parseChoices } from '@/lib/polymarket/normalize';
import { buildSecureClientForUser } from '@/lib/trading/client';

export interface PlaceOrderResult {
  tokenId: string;
  /** The chosen choice's label resolved from the live market — what the
   * persisted Order/Position rows store. */
  choiceLabel: string;
  status: 'filled' | 'failed';
  filledSize: number; // shares
  filledPrice: number; // cents
  polymarketOrderId: string | null;
  errorMessage: string | null;
}

/**
 * Market-price BUY only, MVP scope (docs/PRD.md — no limit orders, no
 * SELL yet). Uses the official `@polymarket/client` (`placeMarketOrder`,
 * FAK semantics via its market-order action), which resolves the user's
 * Deposit Wallet, handles the POLY_1271 CLOB auth/order binding, and
 * signs with the Privy embedded EOA. Verified live: with $0 balance the
 * venue answers `not enough balance / allowance` — an accepted order
 * path, not a rejected signer (docs/DECISIONS.md).
 *
 * A preflight reads the same `fetchBalanceAllowance` the SDK uses and
 * fails with an actionable 400 before submitting, so the no-funds case
 * is deterministic. Every failure is a real error or `status: 'failed'`
 * — never a fabricated fill.
 */
export async function placeMarketOrder(params: {
  privyUserId: string;
  marketId: string;
  choiceIndex: number;
  usdAmount: number;
}): Promise<PlaceOrderResult> {
  const wallet = await getPrimaryEthereumWallet(params.privyUserId);
  if (!wallet) {
    throw badRequest('No embedded wallet found for this account — connect a wallet before trading.');
  }

  if (!/^\d+$/.test(params.marketId)) throw notFound(`Market ${params.marketId} not found.`);
  const market = await fetchMarketById(params.marketId);
  if (!market) throw notFound(`Market ${params.marketId} not found.`);

  const choice = parseChoices(market)[params.choiceIndex];
  if (!choice) {
    throw badRequest(`Market ${params.marketId} has no choice at index ${params.choiceIndex}.`);
  }
  const tokenId = getChoiceTokenId(market, params.choiceIndex);
  if (!tokenId) {
    throw badRequest(`Market ${params.marketId} has no tradable token for choice "${choice.label}".`);
  }

  const client = await buildSecureClientForUser(wallet.id);

  // Preflight: the CLOB rejects an underfunded order with a raw
  // balance/allowance error once submitted; check the same numbers first
  // and fail with an actionable 400 (docs/API.md, "Trade Preflight").
  const { balance, allowances } = await fetchBalanceAllowance(client, {
    assetType: AssetType.COLLATERAL,
  });
  const requiredRaw = Math.round(params.usdAmount * 1e6); // pUSD has 6 decimals
  if (Number(balance) < requiredRaw) {
    throw new ApiError(
      400,
      'insufficient_balance',
      'Your trading balance is too low for this trade — add funds to your wallet and try again.'
    );
  }
  const unapprovedSpenders = Object.entries(allowances ?? {}).filter(
    ([, amount]) => Number(amount) < requiredRaw
  );
  if (unapprovedSpenders.length > 0) {
    throw new ApiError(
      400,
      'insufficient_allowance',
      'Your wallet is still finishing its one-time trading setup — try again in a moment.'
    );
  }

  let response;
  try {
    response = await client.placeMarketOrder({
      assetId: tokenId,
      amount: params.usdAmount,
      side: OrderSide.BUY,
    });
  } catch (error) {
    throw new ApiError(
      502,
      'trade_failed',
      `The order was rejected: ${error instanceof Error ? error.message : String(error)}`
    );
  }

  if (!response.ok) {
    return {
      tokenId,
      choiceLabel: choice.label,
      status: 'failed',
      filledSize: 0,
      filledPrice: 0,
      polymarketOrderId: null,
      errorMessage: response.message || 'Order was not accepted by Polymarket.',
    };
  }

  // BUY: `makingAmount` is the pUSD actually spent, `takingAmount` is
  // the shares actually received (same convention the old client used).
  const filledUsd = Number(response.makingAmount ?? 0);
  const filledSize = Number(response.takingAmount ?? 0);

  if (filledSize <= 0) {
    return {
      tokenId,
      choiceLabel: choice.label,
      status: 'failed',
      filledSize: 0,
      filledPrice: 0,
      polymarketOrderId: response.orderId ?? null,
      errorMessage: 'Order was not filled (no matching liquidity).',
    };
  }

  return {
    tokenId,
    choiceLabel: choice.label,
    status: 'filled',
    filledSize,
    // Decimal cents (up to 4 dp) — a sub-cent fill's entry price must not
    // be rounded to 0 (docs/DECISIONS.md, "Sub-Cent Prices").
    filledPrice: Number(((filledUsd / filledSize) * 100).toFixed(4)),
    polymarketOrderId: response.orderId ?? null,
    errorMessage: null,
  };
}
