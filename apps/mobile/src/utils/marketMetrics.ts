import { formatCompactUsd } from '@/utils/formatCurrency';
import { formatTimeRemaining } from '@/utils/formatDate';

export interface MetricsSource {
  volume?: number | null;
  liquidity?: number | null;
  closed?: boolean;
  resolved?: boolean;
  endDate?: string | null;
}

/**
 * Builds the "$2.4M Volume · $840K Liquidity · 12d left" footer line,
 * joining only whichever metrics the data actually has — never a
 * fabricated placeholder for a missing one. Shared by every market
 * card so the same market reads the same metrics the same way
 * regardless of which card renders it.
 */
export function buildMarketMetrics(source: MetricsSource): string[] {
  const metrics: string[] = [];
  if (source.volume != null) metrics.push(`${formatCompactUsd(source.volume)} Volume`);
  if (source.liquidity != null) metrics.push(`${formatCompactUsd(source.liquidity)} Liquidity`);

  if (source.resolved) {
    // Settled — a countdown/status note would be noise here.
  } else if (source.closed) {
    metrics.push('Trading closed');
  } else if (source.endDate) {
    metrics.push(formatTimeRemaining(source.endDate));
  }

  return metrics;
}
