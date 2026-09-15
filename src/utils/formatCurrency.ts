import { formatCompactNumber } from '@/utils/formatNumber';

/** Market prices are probabilities in cents, e.g. 42 -> "42¢" — used for
 * trade-economics contexts (entry price, current price) where "price
 * paid" is the point, e.g. Market Attachment's verified-position block. */
export function formatPrice(cents: number): string {
  return `${Math.round(cents)}¢`;
}

/** Same underlying cents value as `formatPrice`, read as a probability
 * instead of a price — e.g. 57 -> "57%". Prediction-market share price
 * in cents on a $1 contract is numerically the market's implied
 * probability, so this is a presentation choice, not a different
 * number. Used wherever a market is being browsed/discovered rather
 * than traded (Markets list, no-position card) — see docs/DECISIONS.md
 * (Sprint 3). */
export function formatProbability(cents: number): string {
  return `${Math.round(cents)}%`;
}

export function formatUsd(amount: number): string {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount);
}

/** Compact dollar display for volume/liquidity, e.g. 2_400_000 -> "$2.4M". */
export function formatCompactUsd(amount: number): string {
  return `$${formatCompactNumber(amount)}`;
}
