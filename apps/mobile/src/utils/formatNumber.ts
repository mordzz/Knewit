/** Compact display for volume/counts, e.g. 12400 -> "12.4K". */
export function formatCompactNumber(value: number): string {
  return new Intl.NumberFormat('en-US', { notation: 'compact', maximumFractionDigits: 1 }).format(
    value
  );
}
