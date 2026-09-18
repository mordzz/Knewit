import { Text } from '@/components/ui/Text';
import { GlassSurface } from '@/components/ui/GlassSurface';
import { MarketVisual } from '@/components/ui/MarketVisual';
import { MarketOutcomeButtons } from '@/components/ui/MarketOutcomeButtons';
import { formatUsd } from '@/lib/formatters';
import { buildMarketMetrics } from '@/lib/marketMetrics';
import { choiceTextColor, choiceTone } from '@/lib/choiceTone';
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
        ) : (
          <MarketOutcomeButtons choices={market.choices} onPress={onPress} />
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

function PositionColumns({ snapshot, market }: { snapshot: PositionSnapshot; market: MarketSummary }) {
  // The live choice is looked up by the snapshot's frozen index; a
  // legacy snapshot without one falls back to matching the label.
  const choice =
    market.choices.find((c) => c.index === snapshot.choiceIndex) ??
    market.choices.find((c) => c.label.toLowerCase() === snapshot.outcome.toLowerCase()) ??
    { index: snapshot.choiceIndex, label: snapshot.outcome };
  const outcomeColor = choiceTextColor(choiceTone(choice));

  const currentPrice = market.choices.find((c) => c.index === choice.index)?.price ?? 0;
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
          {choice.label}
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
