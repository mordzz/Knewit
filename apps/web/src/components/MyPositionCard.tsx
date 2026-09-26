import { Text } from '@/components/ui/Text';
import { Card } from '@/components/ui/Card';
import { formatPrice, formatUsd } from '@/lib/formatters';
import { choiceTextColor, choiceTone } from '@/lib/choiceTone';
import type { UserPosition } from '@/types/social';

/**
 * Web equivalent of `apps/mobile/src/features/markets/components/MyPositionCard`
 *  "My Position" on Market Detail. Always prefers the market's own
 * live price (already loaded on this screen) over `position.currentPrice`
 * for the headline PnL math.
 */
export function MyPositionCard({ position, liveCurrentPriceCents }: { position: UserPosition; liveCurrentPriceCents: number | null }) {
  const outcomeColor = choiceTextColor(choiceTone({ index: position.choiceIndex, label: position.outcome }));
  const costBasis = (position.entryPrice / 100) * position.size;
  const canComputePnl =
    liveCurrentPriceCents != null && position.size > 0 && position.entryPrice > 0;
  const currentValue = canComputePnl ? (liveCurrentPriceCents / 100) * position.size : 0;
  const pnl = currentValue - costBasis;

  return (
    <Card contentClassName="gap-3 p-4">
      <Text variant="bodyStrong">My Position</Text>

      <div className="flex items-center justify-between">
        <Text variant="title" color={outcomeColor}>
          {position.outcome}
        </Text>
        {canComputePnl ? (
          <Text variant="bodyStrong" color={pnl >= 0 ? 'yes' : 'no'}>
            {pnl >= 0 ? '+' : ''}
            {formatUsd(pnl)}
          </Text>
        ) : null}
      </div>

      <div className="flex flex-col gap-1.5">
        <PositionRow label="Entry" value={formatPrice(position.entryPrice)} />
        <PositionRow
          label="Current"
          value={liveCurrentPriceCents != null ? formatPrice(liveCurrentPriceCents) : 'unavailable'}
        />
        <PositionRow label="Size" value={formatUsd(costBasis)} />
      </div>
    </Card>
  );
}

function PositionRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between">
      <Text variant="caption" color="textSecondary">
        {label}
      </Text>
      <Text variant="caption">{value}</Text>
    </div>
  );
}
