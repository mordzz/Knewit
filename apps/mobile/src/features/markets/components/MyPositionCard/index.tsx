import { View } from 'react-native';
import { Text } from '@/components/ui/Text';
import { Card } from '@/components/ui/Card';
import { formatPrice, formatUsd } from '@/utils/formatCurrency';
import type { UserPosition } from '@/types/social';
import type { ColorToken } from '@/theme/colors';

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
  liveCurrentPriceCents: number;
}) {
  const outcomeColor: ColorToken = position.outcome === 'YES' ? 'yes' : 'no';
  const costBasis = (position.entryPrice / 100) * position.size;
  const currentValue = (liveCurrentPriceCents / 100) * position.size;
  const pnl = currentValue - costBasis;
  const canComputePnl = position.size > 0 && position.entryPrice > 0;

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
        <PositionRow label="Current" value={formatPrice(liveCurrentPriceCents)} />
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
