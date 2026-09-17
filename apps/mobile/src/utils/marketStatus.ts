import type { BadgeVariant } from '@/components/ui/Badge';

export interface StatusSource {
  trending?: boolean;
  closed?: boolean;
  resolved?: boolean;
}

/**
 * Every market/market-group card shows at most one status badge —
 * resolved takes priority over closed, closed over trending, since a
 * resolved market's trading-closed state is implied, not a second fact
 * worth badging separately. Shared by every card so a market's status
 * always reads the same way regardless of which card renders it.
 */
export function getStatusBadge(
  source: StatusSource
): { label: string; variant: BadgeVariant } | null {
  if (source.resolved) return { label: 'RESOLVED', variant: 'neutral' };
  if (source.closed) return { label: 'CLOSED', variant: 'neutral' };
  if (source.trending) return { label: 'TRENDING', variant: 'accent' };
  return null;
}
