/**
 * Whether a funding-flow rejection is just the user closing/cancelling
 * Privy's own modal, not a real failure. Privy's `useAddFunds` rejects
 * with `Error("User cancelled funding")` on close (and `"USER_EXITED"`
 * from the crypto sub-flow); `useDepositAddress`'s modal exposes the same
 * exit as a `USER_EXITED` error *code* rather than only a message —
 * verified in the installed `@privy-io/react-auth` bundle, since the
 * public types don't expose a cancel code. Kept in one place so a future
 * SDK wording change is a one-file fix; anything unrecognised is treated
 * as a real error.
 */
export function isUserCancelledFunding(error: unknown): boolean {
  const message = error instanceof Error ? error.message : String(error ?? '');
  if (message === 'User cancelled funding' || message === 'USER_EXITED') return true;
  if (/cancell?ed/i.test(message)) return true;

  const candidate = error as { code?: unknown; body?: { code?: unknown } } | null;
  const rawCode = candidate?.code ?? candidate?.body?.code;
  const code = typeof rawCode === 'string' ? rawCode.toUpperCase() : '';
  return code === 'USER_EXITED';
}
