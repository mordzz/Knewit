import { Text } from '@/components/ui/Text';
import { Card } from '@/components/ui/Card';
import { formatPrice, formatUsd } from '@/lib/formatters';
import type { UserPosition } from '@/types/social';

/**
 * Web equivalent of `apps/mobile/src/features/markets/components/MyPositionCard`
 * — "My Position" on Market Detail. Always prefers the market's own
 * live price (already loaded on this screen) over `position.currentPrice`
 * for the headline PnL math.
 */
export function MyPositionCard({ position, liveCurrentPriceCents }: { position: UserPosition; liveCurrentPriceCents: number }) {
  const outcomeColor = position.outcome === 'YES' ? 'yes' : 'no';
  const costBasis = (position.entryPrice / 100) * position.size;
  const currentValue = (liveCurrentPriceCents / 100) * position.size;
  const pnl = currentValue - costBasis;
  const canComputePnl = position.size > 0 && position.entryPrice > 0;

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
        <PositionRow label="Current" value={formatPrice(liveCurrentPriceCents)} />
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
