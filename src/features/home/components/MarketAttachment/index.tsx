import { useState } from 'react';
import { View, Image, Pressable } from 'react-native';
import { Text } from '@/components/ui/Text';
import { Icon } from '@/components/ui/Icon';
import { Badge } from '@/components/ui/Badge';
import { GlassSurface } from '@/components/ui/GlassSurface';
import { Skeleton } from '@/components/ui/Skeleton';
import { formatPrice } from '@/utils/formatCurrency';
import { formatCompactNumber } from '@/utils/formatNumber';
import { formatTimeRemaining } from '@/utils/formatDate';
import { calculatePositionPnlPercent } from '@/utils/calculatePnl';
import { getCategoryIcon } from '@/utils/categoryIcon';
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
 * row. Reused wherever a market needs a compact preview (Home feed,
 * Markets list, Call Detail, Profile, Search) — one component driven by
 * props, not a duplicate per screen, per docs/DESIGN.md.
 *
 * Layout: the market's own icon/image on the left, its question on the
 * right (wraps naturally up to 3 lines — never force-truncated to one
 * line, since clipping a market's actual question is worse than a
 * taller card) — no separate category text label; the visual alone
 * carries that signal. Trending/Resolved badges, when present, sit
 * just above the question. Below that: outcomes or the verified
 * position block, then a volume/time-remaining footer. Rendered as a
 * glass surface — see docs/DESIGN.md "Modern Web3 Direction".
 */
export function MarketAttachment({ market, positionSnapshot, onPress }: MarketAttachmentProps) {
  const pnlPercent = positionSnapshot
    ? calculatePositionPnlPercent(positionSnapshot, market)
    : null;
  const outcomeColor: ColorToken = positionSnapshot?.outcome === 'NO' ? 'no' : 'yes';
  const hasBadge = market.resolved || (market.trending && !market.resolved);

  return (
    <Pressable
      onPress={onPress}
      className="mt-3 active:opacity-90"
      accessibilityRole="button"
      accessibilityLabel={`Open market: ${market.question}`}
    >
      <GlassSurface contentClassName="gap-2.5 p-3">
        <View className="flex-row items-start gap-2.5">
          <MarketVisual market={market} />
          <View className="flex-1 gap-1">
            {hasBadge ? (
              <View className="flex-row items-center gap-1.5">
                {market.resolved ? <Badge label="RESOLVED" variant="neutral" /> : null}
                {market.trending && !market.resolved ? (
                  <Badge label="TRENDING" variant="accent" />
                ) : null}
              </View>
            ) : null}
            <Text
              variant="bodyStrong"
              numberOfLines={3}
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
        ) : (
          <View className="flex-row gap-2">
            <OutcomeChip label="YES" price={market.yesPrice} color="yes" />
            <OutcomeChip label="NO" price={market.noPrice} color="no" />
          </View>
        )}

        {market.volume != null || market.endDate ? (
          <View className="flex-row items-center justify-between pt-0.5">
            {market.volume != null ? (
              <Text variant="micro" color="textTertiary">
                {formatCompactNumber(market.volume)} Volume
              </Text>
            ) : (
              <View />
            )}
            {market.endDate && !market.resolved ? (
              <Text variant="micro" color="textTertiary">
                {formatTimeRemaining(market.endDate)}
              </Text>
            ) : null}
          </View>
        ) : null}
      </GlassSurface>
    </Pressable>
  );
}

/** Market image when available, with a graceful fallback to the
 * category icon on missing/failed image — never a broken-image layout.
 * Fixed 40x40 footprint either way, so the fallback occupies the exact
 * same slot as a real image rather than shrinking the row. */
function MarketVisual({ market }: { market: MarketSummary }) {
  const [failed, setFailed] = useState(false);

  if (market.imageUrl && !failed) {
    return (
      <Image
        source={{ uri: market.imageUrl }}
        onError={() => setFailed(true)}
        className="h-10 w-10 rounded-xl"
      />
    );
  }

  return (
    <View className="h-10 w-10 items-center justify-center rounded-xl bg-accent-muted">
      <Icon name={getCategoryIcon(market.category)} size={20} color="accent" />
    </View>
  );
}

function OutcomeChip({ label, price, color }: { label: string; price: number; color: ColorToken }) {
  const bgClass = color === 'yes' ? 'bg-yes-muted' : 'bg-no-muted';
  return (
    <View className={`flex-1 items-center gap-0.5 rounded-xl py-2.5 ${bgClass}`}>
      <Text variant="micro" color={color}>
        {label}
      </Text>
      <Text variant="title" color={color}>
        {formatPrice(price)}
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

/** Loading placeholder matching MarketAttachment's footprint — for
 * consumers fetching market data asynchronously (this component itself
 * stays a pure, props-driven presentational component). */
export function MarketAttachmentSkeleton() {
  return (
    <View className="mt-3 gap-2.5 rounded-2xl border border-border bg-surface p-3">
      <Skeleton height={12} className="w-24" />
      <Skeleton height={18} />
      <Skeleton height={18} className="w-3/4" />
      <View className="flex-row gap-2">
        <Skeleton height={48} className="flex-1 rounded-xl" />
        <Skeleton height={48} className="flex-1 rounded-xl" />
      </View>
    </View>
  );
}
