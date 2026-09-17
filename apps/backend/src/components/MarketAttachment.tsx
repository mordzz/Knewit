import { Icon } from '@/components/ui/Icon';
import { Text } from '@/components/ui/Text';
import { GlassSurface } from '@/components/ui/GlassSurface';
import { MarketVisual } from '@/components/ui/MarketVisual';
import { MarketOutcomeButtons } from '@/components/ui/MarketOutcomeButtons';
import { formatUsd } from '@/lib/formatters';
import { buildMarketMetrics } from '@/lib/marketMetrics';
import type { MarketSummary, PositionSnapshot } from '@/types/social';

export interface MarketAttachmentProps {
  market: MarketSummary;
  positionSnapshot?: PositionSnapshot | null;
  onPress: () => void;
}

/**
 * Web equivalent of `apps/mobile/src/features/home/components/MarketAttachment`
 * — a mini interactive prediction-market preview embedded in a social
 * post. Same layout: market visual + question on top, then either the
 * Position/Profit read (a position-backed Call), a multi-outcome
 * preview, or the solid Yes/No outcome buttons, plus the volume/
 * liquidity/time metrics footer.
 */
export function MarketAttachment({ market, positionSnapshot, onPress }: MarketAttachmentProps) {
  const isBinary = market.isBinary !== false;
  const metrics = buildMarketMetrics(market);
  const hasPosition = positionSnapshot != null;

  return (
    <button type="button" onClick={onPress} className="mt-3 block w-full text-left transition-opacity hover:opacity-90">
      <GlassSurface tone="dark" blur={false} radius={18} contentClassName="flex flex-col gap-3 p-3.5">
        <div className="flex items-center gap-2.5">
          <MarketVisual imageUrl={market.imageUrl} fallbackIcon="trending-up-outline" />
          <Text variant="bodyStrong" numberOfLines={3} className="flex-1 font-inter-bold">
            {market.question}
          </Text>
        </div>

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
    </button>
  );
}

function MultiOutcomePreview({ market }: { market: MarketSummary }) {
  const label = market.outcomeCount != null ? `${market.outcomeCount} outcomes` : 'Multiple outcomes';

  return (
    <div className="flex items-center gap-2 rounded-xl bg-surface-elevated p-2.5">
      <Icon name="layers-outline" size={16} color="textSecondary" />
      <Text variant="caption" color="textSecondary" className="flex-1">
        {label} · not available for YES/NO trading yet
      </Text>
    </div>
  );
}

function PositionColumns({ snapshot, market }: { snapshot: PositionSnapshot; market: MarketSummary }) {
  const labels = market.outcomeLabels ?? { yes: 'Yes', no: 'No' };
  const outcomeColor = snapshot.outcome === 'YES' ? 'yes' : 'no';
  const pickLabel = snapshot.outcome === 'YES' ? labels.yes : labels.no;

  const currentPrice = snapshot.outcome === 'YES' ? market.yesPrice : market.noPrice;
  const costBasis = (snapshot.entryPrice / 100) * snapshot.size;
  const currentValue = (currentPrice / 100) * snapshot.size;
  const profit = currentValue - costBasis;
  const profitColor = profit >= 0 ? 'yes' : 'no';

  return (
    <div className="flex items-center">
      <div className="flex-1">
        <Text variant="caption" color="textSecondary" className="block">
          Position
        </Text>
        <Text variant="bodyStrong" color={outcomeColor} className="block">
          {pickLabel}
        </Text>
      </div>
      <div className="flex-1 text-right">
        <Text variant="caption" color="textSecondary" className="block">
          Profit
        </Text>
        <Text variant="bodyStrong" color={profitColor} className="block">
          {profit >= 0 ? '+' : '−'}
          {formatUsd(Math.abs(profit))}
        </Text>
      </div>
    </div>
  );
}
