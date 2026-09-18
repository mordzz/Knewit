import { OrderSide } from '@polymarket/client';
import { fetchBalanceAllowance } from '@polymarket/client/actions';
import { AssetType } from '@polymarket/bindings/clob';
import { ApiError, badRequest, notFound } from '@/lib/apiError';
import { getOrCreateUser, getPrimaryEthereumWallet } from '@/lib/users';
import { getSupabase } from '@/lib/supabase';
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

export interface SellCashOut {
  status: 'sent' | 'failed';
  amountUsd: number;
  error: string | null;
}

/** USDC.e on Polygon — the collateral token sells pay out in. Same
 * address both clients carry as their deposit fallback
 * (`lib/walletService.ts::POLYGON_USDC_E`); this SDK version's typed
 * `environment` no longer exposes contract addresses. */
const COLLATERAL_TOKEN_ADDRESS = '0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174';

export interface SellPositionResult {
  marketId: string;
  choiceIndex: number;
  tokenId: string;
  choiceLabel: string;
  status: 'filled' | 'failed';
  soldShares: number;
  /** Shares-weighted average fill price in decimal cents (4dp). */
  filledPrice: number;
  proceedsUsd: number;
  polymarketOrderId: string | null;
  errorMessage: string | null;
  /** `null` when nothing was sold (no proceeds to move). */
  cashOut: SellCashOut | null;
}

/**
 * Market-price SELL of an entire position row, then a cash-out of the
 * proceeds from the trading wallet (Polymarket Deposit Wallet) back to
 * the caller's Privy embedded wallet — see docs/DECISIONS.md, "Selling a
 * Position Cashes Out to the Privy Wallet".
 *
 * The row must belong to the authenticated caller (never trusted from
 * the client): the backend resolves market/choice from the row itself.
 * Preflight is honest and deterministic: the on-chain share balance must
 * cover the row (a database row newer than the venue's balance fails
 * with `insufficient_shares`, not a half-executed sell), and the one-time
 * ERC-1155 operator approval selling needs is set up through the SDK's
 * own idempotent `setupTradingApprovals` when missing.
 *
 * A failed sell is a real error (or a `failed` result the route records
 * before erroring) — never a fabricated fill. A sell that fills but
 * whose cash-out transfer then fails is NOT an error: the proceeds are
 * still in the user's own trading wallet, so the result carries
 * `cashOut.status: 'failed'` instead.
 *
 * Note: the sell response's `making`/`taking` convention is mirrored from
 * the proved BUY path — for SELL the maker gives shares and takes pUSD,
 * so `makingAmount` is shares sold and `takingAmount` is the pUSD
 * proceeds. **Verify against the first real fill** (docs/WALLET.md).
 */
export async function sellMarketPosition(params: {
  privyUserId: string;
  positionId: string;
}): Promise<SellPositionResult> {
  const viewer = await getOrCreateUser(params.privyUserId);
  const wallet = await getPrimaryEthereumWallet(params.privyUserId);
  if (!wallet) {
    throw badRequest('No embedded wallet found for this account — connect a wallet before trading.');
  }

  const supabase = getSupabase();
  const { data: position } = await supabase
    .from('positions')
    .select('id, market_id, outcome, choice_index, size')
    .eq('id', params.positionId)
    .eq('user_id', viewer.id)
    .maybeSingle();
  if (!position) {
    throw notFound(`Position ${params.positionId} not found.`);
  }

  if (!/^\d+$/.test(position.market_id)) throw notFound(`Market ${position.market_id} not found.`);
  const market = await fetchMarketById(position.market_id);
  if (!market) throw notFound(`Market ${position.market_id} not found.`);

  const choice = parseChoices(market)[position.choice_index];
  if (!choice) {
    throw badRequest(`Market ${position.market_id} has no choice at index ${position.choice_index}.`);
  }
  const tokenId = getChoiceTokenId(market, position.choice_index);
  if (!tokenId) {
    throw badRequest(`Market ${position.market_id} has no tradable token for choice "${choice.label}".`);
  }

  const shares = Number(position.size);
  if (!Number.isFinite(shares) || shares <= 0) {
    throw badRequest('This position has no shares left to sell.');
  }

  const client = await buildSecureClientForUser(wallet.id);

  // Selling spends ERC-1155 outcome shares, so the account needs the
  // operator approval the SDK's own setup grants (idempotent).
  try {
    const approvals = await client.fetchTradingApprovalsState();
    if (!approvals.isFullyApproved) {
      await client.setupTradingApprovals();
    }
  } catch {
    throw new ApiError(
      502,
      'approvals_failed',
      "Your wallet couldn't finish its one-time selling setup — try again in a moment."
    );
  }

  // Preflight: fail before submitting when the venue holds fewer shares
  // than this row claims (the on-chain balance is the source of truth).
  const { balance } = await fetchBalanceAllowance(client, {
    assetId: tokenId,
    assetType: AssetType.CONDITIONAL,
  });
  const requiredSharesRaw = Math.round(shares * 1e6); // outcome shares are 6-decimals
  if (Number(balance) < requiredSharesRaw) {
    throw new ApiError(
      400,
      'insufficient_shares',
      'This position is no longer fully held in your trading wallet — refresh your positions and try again.'
    );
  }

  let response;
  try {
    response = await client.placeMarketOrder({
      assetId: tokenId,
      shares,
      side: OrderSide.SELL,
    });
  } catch (error) {
    throw new ApiError(
      502,
      'trade_failed',
      `The sell was rejected: ${error instanceof Error ? error.message : String(error)}`
    );
  }

  if (!response.ok) {
    return {
      marketId: position.market_id,
      choiceIndex: position.choice_index,
      tokenId,
      choiceLabel: choice.label,
      status: 'failed',
      soldShares: 0,
      filledPrice: 0,
      proceedsUsd: 0,
      polymarketOrderId: null,
      errorMessage: response.message || 'Sell was not accepted by Polymarket.',
      cashOut: null,
    };
  }

  // SELL: `makingAmount` is the shares sold, `takingAmount` is the pUSD
  // proceeds (mirror of the BUY path's convention).
  const soldShares = Number(response.makingAmount ?? 0);
  const rawProceeds = Number(response.takingAmount ?? 0);
  const proceedsUsd = Number.isFinite(rawProceeds) ? rawProceeds : 0;

  if (!Number.isFinite(soldShares) || soldShares <= 0) {
    return {
      marketId: position.market_id,
      choiceIndex: position.choice_index,
      tokenId,
      choiceLabel: choice.label,
      status: 'failed',
      soldShares: 0,
      filledPrice: 0,
      proceedsUsd: 0,
      polymarketOrderId: response.orderId ?? null,
      errorMessage: 'Sell was not filled (no matching liquidity).',
      cashOut: null,
    };
  }

  // Cash out the proceeds from the trading wallet to the user's Privy
  // embedded wallet (`client.account.signer` is that EOA; the deposit
  // wallet is `client.account.wallet`). A failure here is reported, not
  // hidden — the money is still in the user's own trading wallet.
  let cashOut: SellCashOut;
  try {
    const handle = await client.transferErc20({
      amount: BigInt(Math.round(proceedsUsd * 1e6)),
      recipientAddress: client.account.signer,
      tokenAddress: COLLATERAL_TOKEN_ADDRESS,
    });
    await handle.wait();
    cashOut = { status: 'sent', amountUsd: proceedsUsd, error: null };
  } catch (error) {
    cashOut = {
      status: 'failed',
      amountUsd: proceedsUsd,
      error: error instanceof Error ? error.message : String(error),
    };
  }

  return {
    marketId: position.market_id,
    choiceIndex: position.choice_index,
    tokenId,
    choiceLabel: choice.label,
    status: 'filled',
    soldShares,
    filledPrice: Number(((proceedsUsd / soldShares) * 100).toFixed(4)),
    proceedsUsd,
    polymarketOrderId: response.orderId ?? null,
    errorMessage: null,
    cashOut,
  };
}
