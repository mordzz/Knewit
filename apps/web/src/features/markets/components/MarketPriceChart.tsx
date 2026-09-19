'use client';

import { useState } from 'react';
import { useQueries } from '@tanstack/react-query';
import { getMarketPriceHistory } from '@/features/markets/lib/marketService';
import { MultiLineChart } from '@/components/MultiLineChart';
import { choiceTone } from '@/lib/choiceTone';
import type { MarketChoice } from '@/types/market';
import type { PriceRange } from '@/types/social';

/** At most the first four choices (API order) are drawn — one request
 * per line; the choice-chip selector was removed by request, so a market
 * with more choices shows the first four and the legend can toggle them. */
const MAX_SERIES = 4;

/** Chart lines take raw hex colors: Yes green, No red, accent yellow,
 * neutral grey — never green/red for a non-directional choice. */
function lineColor(choice: MarketChoice): string {
  const tone = choiceTone(choice);
  if (tone === 'yes') return '#22C55E';
  if (tone === 'no') return '#F43F5E';
  if (tone === 'accent') return '#FFE506';
  return '#9AA3B2';
}

export interface MarketPriceChartProps {
  marketId: string;
  /** The market's own choices — each one gets its own real price-history
   * line (Polymarket's "Both Outcomes" view), capped at `MAX_SERIES`. */
  choices: MarketChoice[];
}

/**
 * Web equivalent of `apps/mobile`'s `MarketPriceChart` — one real line
 * per choice (each fetched from `GET /markets/:id/price-history?
 * choice=`), with the shared `MultiLineChart` legend naming every line.
 * No choice-chip selector: the chart draws the first four choices.
 */
export function MarketPriceChart({ marketId, choices }: MarketPriceChartProps) {
  const [range, setRange] = useState<PriceRange>('1D');
  const displayed = choices.slice(0, MAX_SERIES);

  const histories = useQueries({
    queries: displayed.map((choice) => ({
      queryKey: ['market-price-history', marketId, range, choice.price, choice.index],
      queryFn: () => getMarketPriceHistory(marketId, range, choice.index),
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
    <MultiLineChart
      loading={histories.some((history) => history.status === 'pending')}
      range={range}
      onChangeRange={setRange}
      series={series}
    />
  );
}
