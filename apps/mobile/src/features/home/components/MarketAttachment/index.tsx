import { View, Pressable } from 'react-native';
import { Text } from '@/components/ui/Text';
import { Icon } from '@/components/ui/Icon';
import { Skeleton } from '@/components/ui/Skeleton';
import { MarketVisual } from '@/components/ui/MarketVisual';
import { MarketOutcomeButtons } from '@/components/ui/MarketOutcomeButtons';
import { GlassSurface } from '@/components/ui/GlassSurface';
import { formatUsd } from '@/utils/formatCurrency';
import { buildMarketMetrics } from '@/utils/marketMetrics';
import { typography } from '@/theme';
import type { ColorToken } from '@/theme/colors';
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
  const isBinary = market.isBinary !== false;
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
        ) : !isBinary ? (
          <MultiOutcomePreview market={market} />
        ) : (
          <MarketOutcomeButtons
            yesPrice={market.yesPrice}
            noPrice={market.noPrice}
            labels={market.outcomeLabels}
            onPress={onPress}
          />
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
 * MVP trading is binary-only (see docs/PRD.md), but the data source can
 * surface markets with more than two outcomes — this never forces those
 * into a fabricated YES/NO split. Shows a neutral, honest preview
 * instead: how many outcomes exist (when known) and that trading UI for
 * them isn't part of this app yet. Tapping the card still opens Market
 * Detail like any other market — see docs/DECISIONS.md (Sprint 3).
 */
function MultiOutcomePreview({ market }: { market: MarketSummary }) {
  const label =
    market.outcomeCount != null ? `${market.outcomeCount} outcomes` : 'Multiple outcomes';

  return (
    <View className="flex-row items-center gap-2 rounded-xl bg-surface-elevated p-2.5">
      <Icon name="layers-outline" size={16} color="textSecondary" />
      <Text variant="caption" color="textSecondary" className="flex-1">
        {label} · not available for YES/NO trading yet
      </Text>
    </View>
  );
}

/**
 * The reference's Position/Profit read, split exactly half-and-half.
 * **Position** shows the outcome the user actually picked (`market`'s
 * own "Yes"/"No" labels, or a custom override e.g. "Up"/"Down"), colored
 * green/red — the callout's whole point is "here's the side I took,"
 * not a dollar figure that duplicates the Profit column next to it.
 * **Profit** is the dollar PnL, computed from real fields only —
 * `snapshot.entryPrice`/`snapshot.size` plus the market's own current
 * outcome price, never a stored, possibly-stale total. Green when
 * positive, red when negative, with the sign carried by the prefix (the
 * value itself is formatted absolute, so a `-` can't double up).
 */
function PositionColumns({
  snapshot,
  market,
}: {
  snapshot: PositionSnapshot;
  market: MarketSummary;
}) {
  const labels = market.outcomeLabels ?? { yes: 'Yes', no: 'No' };
  const outcomeColor: ColorToken = snapshot.outcome === 'YES' ? 'yes' : 'no';
  const pickLabel = snapshot.outcome === 'YES' ? labels.yes : labels.no;

  const currentPrice = snapshot.outcome === 'YES' ? market.yesPrice : market.noPrice;
  const costBasis = (snapshot.entryPrice / 100) * snapshot.size;
  const currentValue = (currentPrice / 100) * snapshot.size;
  const profit = currentValue - costBasis;
  const profitColor: ColorToken = profit >= 0 ? 'yes' : 'no';

  return (
    <View className="flex-row items-center">
      <View className="flex-1 gap-0.5">
        <Text variant="caption" color="textSecondary">
          Position
        </Text>
        <Text variant="bodyStrong" color={outcomeColor}>
          {pickLabel}
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

/** Loading placeholder matching MarketAttachment's footprint — same
 * black glass surface as the loaded card, not a different treatment, so
 * a list of skeletons doesn't visually jump when real cards swap in. */
export function MarketAttachmentSkeleton() {
  return (
    <View className="mt-3">
      <GlassSurface tone="dark" blur={false} radius={18} contentClassName="gap-3 p-3.5">
        <View className="flex-row items-center gap-2.5">
          <Skeleton width={40} height={40} className="rounded-xl" />
          <Skeleton height={18} className="flex-1" />
        </View>
        <View className="flex-row justify-between">
          <Skeleton height={32} className="w-24" />
          <Skeleton height={32} className="w-24" />
        </View>
      </GlassSurface>
    </View>
  );
}
