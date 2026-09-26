/** Compact date for market resolution/end dates, e.g. "Dec 31". */
export function formatShortDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

/** Compact countdown for a market's end date, e.g. "24d left", "6h left",
 * "Ended" once past  used in Market Attachment's metrics footer. */
export function formatTimeRemaining(iso: string): string {
  const diffMs = new Date(iso).getTime() - Date.now();
  if (diffMs <= 0) return 'Ended';

  const hours = Math.floor(diffMs / 3_600_000);
  if (hours < 24) return `${Math.max(hours, 1)}h left`;

  const days = Math.floor(hours / 24);
  return `${days}d left`;
}
