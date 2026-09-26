/**
 * Whether a funding-flow rejection is just the user closing/cancelling
 * Privy's own modal, not a real failure. `@privy-io/expo/ui`'s
 * `fundWallet` rejects with a `PrivyUIError` whose code is
 * `'funding_flow_cancelled'` on close  verified in the installed
 * bundle. Matched structurally (not via `instanceof`) so a duplicated
 * SDK module instance can't break the check; anything unrecognised is
 * treated as a real error.
 */
export function isUserCancelledFunding(error: unknown): boolean {
  const candidate = error as { code?: unknown; message?: unknown } | null | undefined;
  if (candidate?.code === 'funding_flow_cancelled') return true;
  const message = typeof candidate?.message === 'string' ? candidate.message : '';
  return /cancell?ed/i.test(message);
}
