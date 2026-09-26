import { formatCompactUsd, formatTimeRemaining } from '@/lib/formatters';

export interface MetricsSource {
  volume?: number | null;
  liquidity?: number | null;
  closed?: boolean;
  resolved?: boolean;
  endDate?: string | null;
}

/**
 * Web equivalent of `apps/mobile/src/utils/marketMetrics.ts`  same
 * "$2.4M Volume · $840K Liquidity · 12d left" footer, joining only
 * whichever metrics the data actually has.
 */
export function buildMarketMetrics(source: MetricsSource): string[] {
  const metrics: string[] = [];
  if (source.volume != null) metrics.push(`${formatCompactUsd(source.volume)} Volume`);
  if (source.liquidity != null) metrics.push(`${formatCompactUsd(source.liquidity)} Liquidity`);

  if (source.resolved) {
    // Settled  a countdown/status note would be noise here.
  } else if (source.closed) {
    metrics.push('Trading closed');
  } else if (source.endDate) {
    metrics.push(formatTimeRemaining(source.endDate));
  }

  return metrics;
}
