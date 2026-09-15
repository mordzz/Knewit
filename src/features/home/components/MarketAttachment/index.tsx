import { View, Pressable } from 'react-native';
import { Text } from '@/components/ui/Text';
import { Icon } from '@/components/ui/Icon';
import { Badge } from '@/components/ui/Badge';
import { GlassSurface } from '@/components/ui/GlassSurface';
import { Skeleton } from '@/components/ui/Skeleton';
import { MarketVisual } from '@/components/ui/MarketVisual';
import { MarketOutcomeButtons } from '@/components/ui/MarketOutcomeButtons';
import { formatPrice } from '@/utils/formatCurrency';
import { calculatePositionPnlPercent } from '@/utils/calculatePnl';
import { getStatusBadge } from '@/utils/marketStatus';
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
 * Layout: the market's own icon/image on the left, its question on the
 * right (wraps naturally up to 3 lines — never force-truncated to one
 * line, since clipping a market's actual question is worse than a
 * taller card) — no separate category text label; the visual alone
 * carries that signal. Trending/Closed/Resolved badges, when present,
 * sit just above the question. Below that: solid Yes/No outcome
 * buttons (`MarketOutcomeButtons`, shared with `MarketCard` so a
 * binary market without a position reads the same wherever it's
 * shown), the verified position block, or a non-binary preview when
 * the market isn't binary — then a volume/liquidity/time-remaining
 * metrics line. Rendered as a glass surface — see docs/DESIGN.md
 * "Modern Web3 Direction".
 */
export function MarketAttachment({ market, positionSnapshot, onPress }: MarketAttachmentProps) {
  const pnlPercent = positionSnapshot
    ? calculatePositionPnlPercent(positionSnapshot, market)
    : null;
  const outcomeColor: ColorToken = positionSnapshot?.outcome === 'NO' ? 'no' : 'yes';
  const isBinary = market.isBinary !== false;
  const badge = getStatusBadge(market);
  const metrics = buildMarketMetrics(market);

  return (
    <Pressable
      onPress={onPress}
      className="mt-3 active:opacity-90"
      accessibilityRole="button"
      accessibilityLabel={`Open market: ${market.question}`}
    >
      <GlassSurface contentClassName="gap-2.5 p-3">
        <View className="flex-row items-start gap-2.5">
          <MarketVisual imageUrl={market.imageUrl} category={market.category} />
          <View className="flex-1 gap-1">
            {badge ? <Badge label={badge.label} variant={badge.variant} /> : null}
            <Text
              variant="bodyStrong"
              numberOfLines={1}
              style={{ fontFamily: typography.family.bold }}
            >
              {market.question}
            </Text>
          </View>
        </View>

        {positionSnapshot && pnlPercent !== null ? (
          <PositionBlock
            snapshot={positionSnapshot}
            market={market}
            outcomeColor={outcomeColor}
            pnlPercent={pnlPercent}
          />
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

        {metrics.length > 0 ? (
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

function PositionBlock({
  snapshot,
  market,
  outcomeColor,
  pnlPercent,
}: {
  snapshot: PositionSnapshot;
  market: MarketSummary;
  outcomeColor: ColorToken;
  pnlPercent: number;
}) {
  const currentPrice = snapshot.outcome === 'YES' ? market.yesPrice : market.noPrice;
  const pnlColor: ColorToken = pnlPercent >= 0 ? 'yes' : 'no';

  return (
    <View
      className={
        outcomeColor === 'yes'
          ? 'gap-1 rounded-xl bg-yes-muted p-2.5'
          : 'gap-1 rounded-xl bg-no-muted p-2.5'
      }
    >
      <Text variant="bodyStrong" color={outcomeColor}>
        {snapshot.outcome}
      </Text>
      <View className="flex-row items-center justify-between">
        <Text variant="caption" color="textSecondary">
          {formatPrice(snapshot.entryPrice)} → {formatPrice(currentPrice)}
        </Text>
        <Text variant="bodyStrong" color={pnlColor}>
          {pnlPercent >= 0 ? '+' : ''}
          {pnlPercent.toFixed(1)}%
        </Text>
      </View>
      <View className="flex-row items-center gap-1">
        <Icon name="checkmark-circle" size={12} color="accent" />
        <Text variant="micro" color="accent">
          Verified Position
        </Text>
      </View>
    </View>
  );
}

/** Loading placeholder matching MarketAttachment's footprint — same
 * glass surface as the loaded card, not a flat bordered box, so a list
 * of skeletons doesn't visually jump when real cards swap in. For
 * consumers fetching market data asynchronously (this component itself
 * stays a pure, props-driven presentational component). */
export function MarketAttachmentSkeleton() {
  return (
    <View className="mt-3">
      <GlassSurface contentClassName="gap-2.5 p-3">
        <View className="flex-row items-start gap-2.5">
          <Skeleton width={40} height={40} className="rounded-xl" />
          <View className="flex-1 gap-1.5 pt-0.5">
            <Skeleton height={18} />
            <Skeleton height={18} className="w-3/4" />
          </View>
        </View>
        <View className="flex-row gap-2">
          <Skeleton height={48} className="flex-1 rounded-xl" />
          <Skeleton height={48} className="flex-1 rounded-xl" />
        </View>
      </GlassSurface>
    </View>
  );
}
