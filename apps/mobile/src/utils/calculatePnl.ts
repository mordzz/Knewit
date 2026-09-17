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
  // The frozen choice is looked up by its index; legacy snapshots
  // without one fall back to matching the frozen label.
  const currentPrice =
    market.choices.find((choice) => choice.index === snapshot.choiceIndex)?.price ??
    market.choices.find(
      (choice) => choice.label.toLowerCase() === snapshot.outcome.toLowerCase()
    )?.price ??
    0;
  return ((currentPrice - snapshot.entryPrice) / snapshot.entryPrice) * 100;
}
