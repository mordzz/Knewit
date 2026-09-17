'use client';

import { useState } from 'react';
import { useMarketPriceHistory } from '@/hooks/useMarketPriceHistory';
import { MultiLineChart } from '@/components/MultiLineChart';
import type { PriceRange } from '@/types/social';

export interface MarketPriceChartProps {
  marketId: string;
  labels: { yes: string; no: string };
}

/**
 * Direct conversion of `apps/mobile`'s `MarketPriceChart` — a binary
 * market's price chart, always 2 lines (YES and NO). The NO series is
 * derived as `100 - yes` per point rather than fetched separately.
 * Backed by the real `GET /markets/:id/price-history` (Polymarket's
 * CLOB API, proxied) — no dev-mock fallback needed on web.
 */
export function MarketPriceChart({ marketId, labels }: MarketPriceChartProps) {
  const [range, setRange] = useState<PriceRange>('1D');
  const history = useMarketPriceHistory(marketId, range);

  const yesValues = history.data?.map((point) => point.price) ?? [];
  const noValues = yesValues.map((value) => 100 - value);

  return (
    <MultiLineChart
      loading={history.status === 'pending'}
      range={range}
      onChangeRange={setRange}
      series={[
        { key: 'yes', label: labels.yes, color: '#22C55E', values: yesValues },
        { key: 'no', label: labels.no, color: '#F43F5E', values: noValues },
      ]}
    />
  );
}
