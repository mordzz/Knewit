import { useState } from 'react';
import { useMarketPriceHistory } from '@/features/markets/hooks/useMarketPriceHistory';
import { MultiLineChart } from '@/features/markets/components/MultiLineChart';
import { colors } from '@/theme';
import type { PriceRange } from '@/types/social';

export interface MarketPriceChartProps {
  marketId: string;
  /** The market's live YES price (cents) — also what seeds the dev-mock
   * history's endpoint so the chart's most recent point always agrees
   * with the live number shown elsewhere on the screen. */
  currentPriceCents: number;
  labels: { yes: string; no: string };
}

/**
 * A binary market's price chart, used only on Market Detail — always 2
 * lines (YES and NO), since a binary market always has exactly 2
 * variants; the line count follows the variant count via the shared
 * `MultiLineChart` primitive rather than being hardcoded — see
 * docs/DECISIONS.md ("Lines Follow Variant Count"). The NO series is
 * derived as `100 - yes` per point rather than fetched as a second
 * independent series (avoids two numbers that could disagree about
 * summing to 100), so a single fetch (`useMarketPriceHistory`) is
 * enough. The Markets tab's own cards show no price/chart at all now —
 * see docs/DECISIONS.md ("Price Only in Market Detail").
 */
export function MarketPriceChart({ marketId, currentPriceCents, labels }: MarketPriceChartProps) {
  const [range, setRange] = useState<PriceRange>('1D');
  const history = useMarketPriceHistory(marketId, range, currentPriceCents);

  const yesValues = history.data?.map((point) => point.price) ?? [];
  const noValues = yesValues.map((value) => 100 - value);

  return (
    <MultiLineChart
      loading={history.status === 'pending'}
      range={range}
      onChangeRange={setRange}
      series={[
        { key: 'yes', label: labels.yes, color: colors.yes, values: yesValues },
        { key: 'no', label: labels.no, color: colors.no, values: noValues },
      ]}
    />
  );
}
