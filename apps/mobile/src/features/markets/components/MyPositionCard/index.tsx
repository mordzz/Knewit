import { View } from 'react-native';
import { Text } from '@/components/ui/Text';
import { Card } from '@/components/ui/Card';
import { formatPrice, formatUsd } from '@/utils/formatCurrency';
import { choiceTextColor, choiceTone } from '@/utils/choiceTone';
import type { UserPosition } from '@/types/social';

/**
 * "My Position" on Market Detail. Always prefers the market's own live
 * price (already loaded on this screen) over `position.currentPrice`
 * for the headline PnL math — two independently-timed "current price"
 * numbers on the same screen would risk visibly disagreeing; see
 * docs/DECISIONS.md. No "✓ Verified" badge: that would claim a
 * real cross-check against Polymarket this project hasn't implemented
 * (see docs/DECISIONS.md) — omitted rather than fabricated, same
 * principle as Sprint 5's omitted price chart.
 */
export function MyPositionCard({
  position,
  liveCurrentPriceCents,
}: {
  position: UserPosition;
  liveCurrentPriceCents: number | null;
}) {
  const outcomeColor = choiceTextColor(choiceTone({ index: position.choiceIndex, label: position.outcome }));
  const costBasis = (position.entryPrice / 100) * position.size;
  const canComputePnl =
    liveCurrentPriceCents != null && position.size > 0 && position.entryPrice > 0;
  const currentValue = canComputePnl ? (liveCurrentPriceCents / 100) * position.size : 0;
  const pnl = currentValue - costBasis;

  return (
    <Card contentClassName="gap-3 p-4">
      <Text variant="bodyStrong">My Position</Text>

      <View className="flex-row items-center justify-between">
        <Text variant="title" color={outcomeColor}>
          {position.outcome}
        </Text>
        {canComputePnl ? (
          <Text variant="bodyStrong" color={pnl >= 0 ? 'yes' : 'no'}>
            {pnl >= 0 ? '+' : ''}
            {formatUsd(pnl)}
          </Text>
        ) : null}
      </View>

      <View className="gap-1.5">
        <PositionRow label="Entry" value={formatPrice(position.entryPrice)} />
        <PositionRow
          label="Current"
          value={liveCurrentPriceCents != null ? formatPrice(liveCurrentPriceCents) : 'unavailable'}
        />
        <PositionRow label="Size" value={formatUsd(costBasis)} />
      </View>
    </Card>
  );
}

function PositionRow({ label, value }: { label: string; value: string }) {
  return (
    <View className="flex-row justify-between">
      <Text variant="caption" color="textSecondary">
        {label}
      </Text>
      <Text variant="caption" color="textPrimary">
        {value}
      </Text>
    </View>
  );
}
