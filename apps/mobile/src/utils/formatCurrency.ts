import { formatCompactNumber } from '@/utils/formatNumber';

/** Market prices are decimal cents (up to 4 dp  Polymarket ticks go to
 * 0.001/0.0001), rendered with full precision so a sub-cent price shows
 * as `0.1000¢` instead of rounding to `0¢`  used for trade-economics
 * contexts (entry price, current price) where "price paid" is the point,
 * e.g. Market Attachment's verified-position block. */
export function formatPrice(cents: number): string {
  return `${cents.toFixed(4)}¢`;
}

/** Same underlying cents value as `formatPrice`, read as a probability
 * instead of a price  e.g. 57 -> "57.0000%". Prediction-market share
 * price in cents on a $1 contract is numerically the market's implied
 * probability, so this is a presentation choice, not a different
 * number. Used wherever a market is being browsed/discovered rather
 * than traded (Markets list, no-position card)  see docs/DECISIONS.md
 * (Sprint 3). */
export function formatProbability(cents: number): string {
  return `${cents.toFixed(4)}%`;
}

export function formatUsd(amount: number): string {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount);
}

/** Compact dollar display for volume/liquidity, e.g. 2_400_000 -> "$2.4M". */
export function formatCompactUsd(amount: number): string {
  return `$${formatCompactNumber(amount)}`;
}
