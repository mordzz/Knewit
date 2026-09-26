import { OrderSide, TransactionFailedError } from '@polymarket/client';
import { fetchBalanceAllowance } from '@polymarket/client/actions';
import { AssetType } from '@polymarket/bindings/clob';
import { ApiError, badRequest, notFound } from '@/lib/apiError';
import { env } from '@/lib/env';
import { getPrimaryEthereumWallet } from '@/lib/users';
import { fetchMarketById, fetchMarketsByIds } from '@/lib/polymarket/gammaClient';
import { getChoiceTokenId, parseChoices } from '@/lib/polymarket/normalize';
import { buildSecureClientForUser, type UserSecureClient } from '@/lib/trading/client';
import { listHeldPositions } from '@/lib/trading/portfolio';

export interface PlaceOrderResult {
  tokenId: string;
  /** The chosen choice's label resolved from the live market  what the
   * persisted Order row stores. */
  choiceLabel: string;
  status: 'filled' | 'failed';
  filledSize: number; // shares
  filledPrice: number; // cents
  polymarketOrderId: string | null;
  errorMessage: string | null;
}

/** Errors raised before an order is sent to the CLOB  nothing was placed,
 * so the caller can record a plain failure instead of an unknown outcome. */
export function isRejectedBeforeSubmit(error: unknown): error is ApiError {
  return error instanceof ApiError && (error.status < 500 || error.code === 'approvals_failed');
}

/** Builder attribution on every order (volume + builder fees credit the
 * app's Polymarket builder profile). */
function builderCode(): { builderCode?: string } {
  return env.polymarketBuilderCode ? { builderCode: env.polymarketBuilderCode } : {};
}

/** One-time ERC-20/ERC-1155 approvals the exchanges need, set up through
 * the SDK's own idempotent helper (gasless) whenever they're missing. */
async function ensureTradingApprovals(client: UserSecureClient) {
  try {
    const approvals = await client.fetchTradingApprovalsState();
    if (!approvals.isFullyApproved) await client.setupTradingApprovals();
  } catch (error) {
    console.error('[trading/orders] trading approvals setup failed:', error);
    throw new ApiError(
      502,
      'approvals_failed',
      "Your wallet couldn't finish its one-time trading setup  try again in a moment."
    );
  }
}

type AcceptedOrder = Extract<Awaited<ReturnType<UserSecureClient['placeMarketOrder']>>, { ok: true }>;

/**
 * Waits for the order's fills to settle on-chain (`waitForOrderFillSettlement`).
 * A fill that failed on-chain means nothing moved; any other problem
 * (timeout, transport) leaves the venue's own match as the answer  the
 * portfolio is read from Polymarket, so it corrects itself either way.
 */
async function settleFills(client: UserSecureClient, response: AcceptedOrder): Promise<'settled' | 'failed'> {
  try {
    await client.waitForOrderFillSettlement(response, { timeoutMs: 25_000 });
    return 'settled';
  } catch (error) {
    if (error instanceof TransactionFailedError) {
      console.error('[trading/orders] fill failed on-chain:', error);
      return 'failed';
    }
    console.warn('[trading/orders] fill settlement not confirmed yet:', error);
    return 'settled';
  }
}

/**
 * Market-price BUY (FAK) through the official `@polymarket/client`: the
 * SDK resolves the Deposit Wallet, tick size, neg-risk and fees, and signs
 * with the Privy embedded EOA. `maxSpend` keeps the all-in cost (market +
 * builder fees) within the amount the user entered. A preflight on the
 * pUSD balance fails with an actionable 400 before submitting. Every
 * failure is a real error or `status: 'failed'`  never a fabricated fill.
 */
export async function placeMarketOrder(params: {
  privyUserId: string;
  marketId: string;
  choiceIndex: number;
  usdAmount: number;
}): Promise<PlaceOrderResult> {
  const wallet = await getPrimaryEthereumWallet(params.privyUserId);
  if (!wallet) {
    throw badRequest('No embedded wallet found for this account  connect a wallet before trading.');
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

  const { balance } = await fetchBalanceAllowance(client, { assetType: AssetType.COLLATERAL });
  if (Number(balance) < Math.round(params.usdAmount * 1e6)) {
    throw new ApiError(
      400,
      'insufficient_balance',
      'Your trading balance is too low for this trade  add funds to your wallet and try again.'
    );
  }
  await ensureTradingApprovals(client);

  let response;
  try {
    response = await client.placeMarketOrder({
      assetId: tokenId,
      amount: params.usdAmount,
      maxSpend: params.usdAmount,
      side: OrderSide.BUY,
      ...builderCode(),
    });
  } catch (error) {
    // The upstream reason stays in the server log  it can carry venue
    // internals; the client gets a stable message.
    console.error('[trading/orders] buy rejected upstream:', error);
    throw new ApiError(502, 'trade_failed', 'The order could not be placed right now. Please try again.');
  }

  const failed = (errorMessage: string, orderId: string | null = null): PlaceOrderResult => ({
    tokenId,
    choiceLabel: choice.label,
    status: 'failed',
    filledSize: 0,
    filledPrice: 0,
    polymarketOrderId: orderId,
    errorMessage,
  });

  if (!response.ok) {
    console.error('[trading/orders] buy not accepted:', response.message);
    return failed('The order was not accepted. Please try again.');
  }

  // BUY: `makingAmount` is the pUSD spent, `takingAmount` the shares received.
  const filledUsd = Number(response.makingAmount ?? 0);
  const filledSize = Number(response.takingAmount ?? 0);
  if (!(filledSize > 0)) return failed('Order was not filled (no matching liquidity).', response.orderId ?? null);
  if ((await settleFills(client, response)) === 'failed') {
    return failed('The trade failed to settle. Your balance was not used.', response.orderId ?? null);
  }

  return {
    tokenId,
    choiceLabel: choice.label,
    status: 'filled',
    filledSize,
    // Decimal cents (up to 4 dp)  a sub-cent fill's price must not round to 0.
    filledPrice: Number(((filledUsd / filledSize) * 100).toFixed(4)),
    polymarketOrderId: response.orderId ?? null,
    errorMessage: null,
  };
}

export interface SellPositionResult {
  marketId: string;
  choiceIndex: number;
  tokenId: string;
  choiceLabel: string;
  status: 'filled' | 'failed';
  soldShares: number;
  /** Shares still held after a potentially partial FAK fill. */
  remainingShares: number;
  /** Shares-weighted average fill price in decimal cents (4dp). */
  filledPrice: number;
  proceedsUsd: number;
  polymarketOrderId: string | null;
  errorMessage: string | null;
}

/**
 * Market-price SELL (FAK) of everything held in one outcome token.
 * `positionId` is the token (asset) id from `GET /positions`. The amount
 * comes from the on-chain share balance of the caller's own Deposit Wallet
 * (so ownership is implicit and the client never sends a size); the market
 * and choice are resolved from Gamma by that token id. Proceeds stay in
 * the Deposit Wallet as pUSD.
 */
export async function sellMarketPosition(params: {
  privyUserId: string;
  positionId: string;
}): Promise<SellPositionResult> {
  const wallet = await getPrimaryEthereumWallet(params.privyUserId);
  if (!wallet) {
    throw badRequest('No embedded wallet found for this account  connect a wallet before trading.');
  }
  const tokenId = params.positionId;
  if (!/^\d+$/.test(tokenId)) throw notFound(`Position ${tokenId} not found.`);

  const [market] = await fetchMarketsByIds('clob_token_ids', [tokenId]);
  if (!market) throw notFound(`Position ${tokenId} not found.`);
  const tokenIds = JSON.parse(market.clobTokenIds || '[]') as string[];
  const choiceIndex = tokenIds.indexOf(tokenId);
  const choice = parseChoices(market)[choiceIndex];
  if (!choice) throw notFound(`Position ${tokenId} not found.`);
  const marketId = String(market.id);

  const client = await buildSecureClientForUser(wallet.id);
  const { balance } = await fetchBalanceAllowance(client, { assetId: tokenId, assetType: AssetType.CONDITIONAL });
  const shares = Math.floor(Number(balance)) / 1e6; // outcome shares have 6 decimals
  if (!(shares > 0)) {
    throw new ApiError(400, 'insufficient_shares', 'You no longer hold this position  refresh your portfolio.');
  }
  await ensureTradingApprovals(client);

  let response;
  try {
    response = await client.placeMarketOrder({
      assetId: tokenId,
      shares,
      side: OrderSide.SELL,
      ...builderCode(),
    });
  } catch (error) {
    console.error('[trading/orders] sell rejected upstream:', error);
    throw new ApiError(502, 'trade_failed', 'The sell could not be placed right now. Please try again.');
  }

  const failed = (errorMessage: string, orderId: string | null = null): SellPositionResult => ({
    marketId,
    choiceIndex,
    tokenId,
    choiceLabel: choice.label,
    status: 'failed',
    soldShares: 0,
    remainingShares: shares,
    filledPrice: 0,
    proceedsUsd: 0,
    polymarketOrderId: orderId,
    errorMessage,
  });

  if (!response.ok) {
    console.error('[trading/orders] sell not accepted:', response.message);
    return failed('The sell was not accepted. Please try again.');
  }

  // SELL: `makingAmount` is the shares given, `takingAmount` the pUSD received.
  const soldShares = Number(response.makingAmount ?? 0);
  const proceedsUsd = Number(response.takingAmount ?? 0) || 0;
  if (!(soldShares > 0)) return failed('Sell was not filled (no matching liquidity).', response.orderId ?? null);
  if ((await settleFills(client, response)) === 'failed') {
    return failed('The sell failed to settle. Your shares were not sold.', response.orderId ?? null);
  }

  return {
    marketId,
    choiceIndex,
    tokenId,
    choiceLabel: choice.label,
    status: 'filled',
    soldShares,
    remainingShares: Math.max(0, shares - soldShares),
    filledPrice: Number(((proceedsUsd / soldShares) * 100).toFixed(4)),
    proceedsUsd,
    polymarketOrderId: response.orderId ?? null,
    errorMessage: null,
  };
}

/**
 * Redeems a resolved market's winning shares into pUSD (`redeemPositions`,
 * gasless through the relayer). Only runs when Polymarket's Data API
 * reports a redeemable position in that market for this user's Deposit
 * Wallet. Redeeming is idempotent on-chain  a repeat just returns $0.
 */
export async function redeemMarketPositions(params: {
  privyUserId: string;
  conditionId: string;
}): Promise<{ amountUsd: number; transactionHash: string | null }> {
  const wallet = await getPrimaryEthereumWallet(params.privyUserId);
  if (!wallet) throw badRequest('No embedded wallet found for this account.');
  if (!/^0x[0-9a-fA-F]{64}$/.test(params.conditionId)) throw badRequest('Expected a market condition id.');

  const client = await buildSecureClientForUser(wallet.id);
  const held = await listHeldPositions(client.account.wallet, params.conditionId);
  const redeemable = held.filter((position) => position.redeemable);
  if (redeemable.length === 0) {
    throw new ApiError(400, 'nothing_to_redeem', 'There is nothing to redeem in this market yet.');
  }
  const amountUsd = redeemable.reduce((sum, position) => sum + Number(position.currentValue), 0);

  let handle;
  try {
    handle = await client.redeemPositions({ conditionId: params.conditionId });
  } catch (error) {
    console.error('[trading/redeem] redeem submission failed:', error);
    throw new ApiError(502, 'redeem_failed', "Couldn't redeem right now. Please try again.");
  }
  try {
    const outcome = await handle.wait();
    return { amountUsd, transactionHash: outcome.transactionHash ?? null };
  } catch (error) {
    if (error instanceof TransactionFailedError) {
      throw new ApiError(502, 'redeem_failed', 'The redeem transaction failed. Nothing was changed.');
    }
    // Submitted but not confirmed in time  it will land; the portfolio
    // shows the result once it does.
    console.warn('[trading/redeem] redeem confirmation pending:', error);
    return { amountUsd, transactionHash: handle.transactionHash ?? null };
  }
}
