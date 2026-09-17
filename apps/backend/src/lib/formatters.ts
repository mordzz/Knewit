/**
 * Web copies of `apps/frontend/src/utils/formatRelativeTime.ts` and
 * `formatNumber.ts` — pure functions with zero React Native
 * dependency, so the logic is copied verbatim rather than shared via a
 * package (the two apps have no shared package — see
 * docs/ARCHITECTURE.md). Keep these in sync by hand if the mobile
 * versions change.
 */

/** Compact relative time for feed timestamps, e.g. "2h", "3d". */
export function formatRelativeTime(iso: string): string {
  const diffMs = Date.now() - new Date(iso).getTime();
  const minutes = Math.floor(diffMs / 60_000);

  if (minutes < 1) return 'now';
  if (minutes < 60) return `${minutes}m`;

  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h`;

  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d`;

  return new Date(iso).toLocaleDateString();
}

/** Compact display for volume/counts, e.g. 12400 -> "12.4K". */
export function formatCompactNumber(value: number): string {
  return new Intl.NumberFormat('en-US', { notation: 'compact', maximumFractionDigits: 1 }).format(
    value
  );
}

/** A market's `yesPrice`/`noPrice` (cents, 1-99) doubles as an implied
 * probability — displayed as a percentage, e.g. 68 -> "68%". */
export function formatProbability(cents: number): string {
  return `${Math.round(cents)}%`;
}

/** e.g. 12400 -> "$12.4K". */
export function formatCompactUsd(amount: number): string {
  return `$${formatCompactNumber(amount)}`;
}

/** Full currency formatting, e.g. 1234.5 -> "$1,234.50". */
export function formatUsd(amount: number): string {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount);
}
