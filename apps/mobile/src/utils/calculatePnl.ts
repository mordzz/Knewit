import type { MarketSummary, PositionSnapshot } from '@/types/social';

/**
 * The snapshot's entry price is frozen; PnL is computed live against the
 * market's current price for the same outcome — see docs/SOCIAL-FEATURE.md.
 * Never derive this from anything other than the frozen snapshot + live
 * market price (no user-editable inputs).
 */
export function calculatePositionPnlPercent(
  snapshot: PositionSnapshot,
  market: MarketSummary
): number {
  const currentPrice = snapshot.outcome === 'YES' ? market.yesPrice : market.noPrice;
  return ((currentPrice - snapshot.entryPrice) / snapshot.entryPrice) * 100;
}
