/** Market prices are probabilities in cents, e.g. 42 -> "42¢". */
export function formatPrice(cents: number): string {
  return `${Math.round(cents)}¢`;
}

export function formatUsd(amount: number): string {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount);
}
