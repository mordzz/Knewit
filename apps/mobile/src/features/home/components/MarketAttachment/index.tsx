import { View, Pressable } from 'react-native';
import { Text } from '@/components/ui/Text';
import { MarketVisual } from '@/components/ui/MarketVisual';
import { MarketOutcomeButtons } from '@/components/ui/MarketOutcomeButtons';
import { GlassSurface } from '@/components/ui/GlassSurface';
import { formatUsd } from '@/utils/formatCurrency';
import { buildMarketMetrics } from '@/utils/marketMetrics';
import { choiceTextColor, choiceTone } from '@/utils/choiceTone';
import { typography } from '@/theme';
import type { MarketSummary, PositionSnapshot } from '@/types/social';

export interface MarketAttachmentProps {
  market: MarketSummary;
  /** Present only for a position-backed Call — see docs/SOCIAL-FEATURE.md.
   * `null`/absent renders the plain (no-position) variant below. */
  positionSnapshot?: PositionSnapshot | null;
  onPress: () => void;
}

/**
 * A mini interactive prediction-market preview embedded in a social post
 * — social card + market preview + trading info, not a generic database
 * row. This is the *social* card (Home feed / Call), distinct from the
 * Markets tab's own `MarketCard` (`features/markets/components/
 * MarketCard`), which needs denser/more varied layouts a social post
 * shouldn't carry — both consume the same `MarketSummary`/
 * `MarketGroupSummary` data model, they just render it differently for
 * different contexts — see docs/DECISIONS.md.
 *
 * Layout, per the pump.fun-style reference: a top row with **only** the
 * market's visual and its name (the `question` — the data model has no
 * shorter name field, wrapped up to 3 lines rather than clipped to one
 * — a long question staying readable matters more than a fixed row
 * height here), and the card's "point" below it. With a
 * `positionSnapshot` that point is the two-column Position/Profit read:
 * **Position** is the outcome the user actually picked (e.g. "Yes"),
 * colored green/red, not a dollar figure — the pick itself is the point
 * of a callout; **Profit** is the dollar PnL, green when ahead, red when
 * behind, computed from real fields only. Both columns are exactly
 * half-width so neither dominates. Without a position, it's the solid
 * Yes/No outcome buttons (`MarketOutcomeButtons`, shared with
 * `MarketCard` so a binary market reads the same wherever it's shown),
 * a non-binary preview, and the volume/liquidity/time metrics footer.
 * No status badge and no category signal on this card — see
 * docs/DECISIONS.md.
 *
 * Rendered as a solid black card (`GlassSurface` `tone="dark"`) rather
 * than the old flat panel — see docs/DECISIONS.md ("Black Glass for
 * Callout Surfaces", superseding "Glass Surfaces Reserved for Overlays
 * Only", and "Solid Surfaces, No 3D Bevel" for the current solid-fill-
 * plus-plain-border look).
 */
export function MarketAttachment({ market, positionSnapshot, onPress }: MarketAttachmentProps) {
  const metrics = buildMarketMetrics(market);
  const hasPosition = positionSnapshot != null;

  return (
    <Pressable
      onPress={onPress}
      className="mt-3 active:opacity-90"
      accessibilityRole="button"
      accessibilityLabel={`Open market: ${market.question}`}
    >
      <GlassSurface tone="dark" blur={false} radius={18} contentClassName="gap-3 p-3.5">
        <View className="flex-row items-center gap-2.5">
          <MarketVisual imageUrl={market.imageUrl} fallbackIcon="trending-up-outline" />
          <Text
            variant="bodyStrong"
            numberOfLines={3}
            className="flex-1"
            style={{ fontFamily: typography.family.bold }}
          >
            {market.question}
          </Text>
        </View>

        {positionSnapshot ? (
          <PositionColumns snapshot={positionSnapshot} market={market} />
        ) : (
          <MarketOutcomeButtons choices={market.choices} onPress={onPress} />
        )}

        {!hasPosition && metrics.length > 0 ? (
          <Text variant="micro" color="textTertiary" numberOfLines={1}>
            {metrics.join(' · ')}
          </Text>
        ) : null}
      </GlassSurface>
    </Pressable>
  );
}

/**
 * The reference's Position/Profit read, split exactly half-and-half.
 * **Position** shows the choice the user actually picked (the label
 * frozen into the snapshot at Call-creation time, straight from the
 * market's own outcomes), colored with the existing yes/no pair — the
 * callout's whole point is "here's the side I took," not a dollar figure
 * that duplicates the Profit column next to it. **Profit** is the dollar
 * PnL, computed from real fields only — `snapshot.entryPrice`/
 * `snapshot.size` plus the market's own current price for that choice,
 * never a stored, possibly-stale total. Green when positive, red when
 * negative, with the sign carried by the prefix (the value itself is
 * formatted absolute, so a `-` can't double up).
 */
function PositionColumns({
  snapshot,
  market,
}: {
  snapshot: PositionSnapshot;
  market: MarketSummary;
}) {
  // The live choice is looked up by the snapshot's frozen index; a
  // legacy snapshot without one falls back to matching the label.
  const choice = market.choices.find((c) => c.index === snapshot.choiceIndex) ??
    market.choices.find((c) => c.label.toLowerCase() === snapshot.outcome.toLowerCase()) ?? {
      index: snapshot.choiceIndex,
      label: snapshot.outcome,
    };
  const outcomeColor = choiceTextColor(choiceTone(choice));

  const currentPrice = market.choices.find((c) => c.index === choice.index)?.price ?? 0;
  const costBasis = (snapshot.entryPrice / 100) * snapshot.size;
  const currentValue = (currentPrice / 100) * snapshot.size;
  const profit = currentValue - costBasis;
  const profitColor = profit >= 0 ? 'yes' : 'no';

  return (
    <View className="flex-row items-center">
      <View className="flex-1 gap-0.5">
        <Text variant="caption" color="textSecondary">
          Position
        </Text>
        <Text variant="bodyStrong" color={outcomeColor}>
          {choice.label}
        </Text>
      </View>
      <View className="flex-1 items-end gap-0.5">
        <Text variant="caption" color="textSecondary">
          Profit
        </Text>
        <Text variant="bodyStrong" color={profitColor}>
          {profit >= 0 ? '+' : '−'}
          {formatUsd(Math.abs(profit))}
        </Text>
      </View>
    </View>
  );
}
