import { useState } from 'react';
import { View } from 'react-native';
import { useQueries } from '@tanstack/react-query';
import { getMarketPriceHistory } from '@/features/markets/services/marketService';
import { MultiLineChart } from '@/features/markets/components/MultiLineChart';
import { choiceTone } from '@/utils/choiceTone';
import { colors } from '@/theme';
import type { MarketChoice } from '@/types/market';
import type { PriceRange } from '@/types/social';

/** At most the first four choices (API order) are drawn  one request
 * per line; the choice-chip selector was removed by request, so a market
 * with more choices shows the first four and the legend can toggle them. */
const MAX_SERIES = 4;

/** Chart lines take raw hex colors: Yes green, No red, accent yellow,
 * neutral grey  never green/red for a non-directional choice. */
function lineColor(choice: MarketChoice): string {
  const tone = choiceTone(choice);
  if (tone === 'yes') return colors.yes;
  if (tone === 'no') return colors.no;
  if (tone === 'accent') return colors.accent;
  return colors.textSecondary;
}

export interface MarketPriceChartProps {
  marketId: string;
  /** The market's own choices  each one gets its own real price-history
   * line (Polymarket's "Both Outcomes" view), capped at `MAX_SERIES`. */
  choices: MarketChoice[];
}

/**
 * The market's price chart, Polymarket-style: one real line per choice
 * (each fetched from `GET /markets/:id/price-history?choice=`  never a
 * derived second line), with the shared `MultiLineChart` legend naming
 * every line. There is no choice-chip selector any more; the chart just
 * draws the first four choices. Line colors follow `choiceTone`. The
 * Markets tab's own cards show no price/chart at all (docs/DECISIONS.md,
 * "Price Only in Market Detail").
 */
export function MarketPriceChart({ marketId, choices }: MarketPriceChartProps) {
  const [range, setRange] = useState<PriceRange>('1D');
  const displayed = choices.slice(0, MAX_SERIES);

  const histories = useQueries({
    queries: displayed.map((choice) => ({
      queryKey: ['market-price-history', marketId, range, choice.price, choice.index],
      queryFn: () => getMarketPriceHistory(marketId, range, choice.price, choice.index),
    })),
  });

  const series = displayed.map((choice, index) => ({
    key: String(choice.index),
    label: choice.label,
    color: lineColor(choice),
    values: histories[index]?.data?.map((point) => point.price) ?? [],
    timestamps: histories[index]?.data?.map((point) => point.timestamp) ?? [],
  }));

  return (
    <View>
      <MultiLineChart
        loading={histories.some((history) => history.status === 'pending')}
        range={range}
        onChangeRange={setRange}
        series={series}
      />
    </View>
  );
}
