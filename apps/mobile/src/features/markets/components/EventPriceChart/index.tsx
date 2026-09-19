import { useMemo, useState } from 'react';
import { View } from 'react-native';
import { useQueries } from '@tanstack/react-query';
import { Button } from '@/components/ui/Button';
import { getMarketPriceHistory } from '@/features/markets/services/marketService';
import {
  MultiLineChart,
  type ChartSeries,
} from '@/features/markets/components/MultiLineChart';
import type { MarketSummary, PriceRange } from '@/types/social';

/** Fixed identity palette for event lines — a line's color says "which
 * outcome", not yes/no (those keep their semantic colors only in a
 * single market's own chart). Ten stable colors; lines past the palette
 * repeat the colors with a dashed stroke so two different outcomes can
 * never look identical. */
const EVENT_LINE_COLORS = [
  '#FFE506',
  '#22C55E',
  '#F43F5E',
  '#60A5FA',
  '#A78BFA',
  '#FB923C',
  '#2DD4BF',
  '#F472B6',
  '#A3E635',
  '#38BDF8',
];
const INITIAL_LINES = 6;
const LINES_PER_PAGE = 6;

/** Each child market's line is its primary choice's real price history
 * — "Yes" when the market has one, else the first choice. */
function primaryChoiceIndex(market: MarketSummary): number {
  const yes = market.choices.find((choice) => choice.label.toLowerCase() === 'yes');
  return yes?.index ?? market.choices[0]?.index ?? 0;
}

/**
 * Event-mode chart (mode event dari Market Detail): one smooth,
 * interactive line per child market — Polymarket's event page view —
 * ranked by volume, six lines at a time with a "Show more" button, each
 * fetched from the same per-choice history endpoint the market chart
 * uses. The shared `MultiLineChart` owns smoothing, crosshair/tooltip,
 * legend toggles, grid and axis labels.
 */
export function EventPriceChart({ markets }: { markets: MarketSummary[] }) {
  const [range, setRange] = useState<PriceRange>('1D');
  const [limit, setLimit] = useState(INITIAL_LINES);

  const ranked = useMemo(
    () =>
      markets
        .filter((market) => market.choices.length > 0)
        .sort((a, b) => (b.volume ?? 0) - (a.volume ?? 0)),
    [markets]
  );
  const displayed = ranked.slice(0, limit);

  const histories = useQueries({
    queries: displayed.map((market) => {
      const choiceIndex = primaryChoiceIndex(market);
      const currentPrice = market.choices.find((choice) => choice.index === choiceIndex)?.price ?? 0;
      return {
        queryKey: ['market-price-history', market.id, range, currentPrice, choiceIndex],
        queryFn: () => getMarketPriceHistory(market.id, range, currentPrice, choiceIndex),
      };
    }),
  });

  if (ranked.length === 0) return null;

  const series: ChartSeries[] = displayed.map((market, index) => ({
    key: market.id,
    label: market.label ?? market.question,
    color: EVENT_LINE_COLORS[index % EVENT_LINE_COLORS.length],
    dash: Math.floor(index / EVENT_LINE_COLORS.length) % 2 === 1 ? '6 4' : undefined,
    values: histories[index]?.data?.map((point) => point.price) ?? [],
    timestamps: histories[index]?.data?.map((point) => point.timestamp) ?? [],
  }));

  return (
    <View className="gap-2">
      <MultiLineChart
        loading={histories.some((history) => history.status === 'pending')}
        range={range}
        onChangeRange={setRange}
        series={series}
      />

      {limit < ranked.length ? (
        <Button
          variant="ghost"
          label={`Show more outcomes (+${Math.min(LINES_PER_PAGE, ranked.length - limit)})`}
          onPress={() => setLimit((current) => current + LINES_PER_PAGE)}
        />
      ) : null}
    </View>
  );
}
