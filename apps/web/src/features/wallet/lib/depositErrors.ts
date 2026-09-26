import { ApiRequestError } from '@/lib/apiClient';

const NO_ROUTE_CODES = new Set([
  'no_quotes',
  'unsupported_chain',
  'unsupported_currency',
  'unsupported_route',
  'route_unavailable',
  'deposit_addresses_not_enabled',
  'no_swap_routes_found',
  'no_internal_swap_routes_found',
]);

/** Maps provider and wallet setup failures to useful, non-sensitive copy. */
export function getDepositErrorMessage(error: unknown): string {
  if (error instanceof ApiRequestError) {
    if (error.body.code === 'builder_keys_missing') {
      return 'Deposits are temporarily unavailable while the trading wallet is being prepared. Please try again later.';
    }
    if (error.status === 401 || error.status === 403) {
      return 'Your session needs to be refreshed before depositing. Please sign in again.';
    }
  }

  const candidate = error as {
    code?: unknown;
    status?: unknown;
    message?: unknown;
    body?: { code?: unknown };
    responseData?: { code?: unknown; error?: unknown };
  } | null;
  const rawCode = candidate?.code ?? candidate?.body?.code ?? candidate?.responseData?.code;
  const code = typeof rawCode === 'string' ? rawCode.toLowerCase() : '';
  if (NO_ROUTE_CODES.has(code)) {
    return 'No deposit route is available for this method, token, or region. Please try the other deposit method.';
  }
  if (code === 'feature_not_enabled') {
    return 'This deposit method is not enabled yet. Please try the other method or contact support.';
  }
  if (code === 'amount_too_low') {
    return 'That amount is below the minimum for this deposit method. Try a larger amount.';
  }
  if (code === 'insufficient_liquidity') {
    return 'This deposit method has no liquidity available right now. Please try again shortly or use another method.';
  }
  if (code === 'deposit_refunded') {
    return 'The deposit could not be completed and has been refunded to your source.';
  }
  if (code === 'sanctioned_wallet_address') {
    return 'This deposit could not be processed for compliance reasons.';
  }
  if (code === 'nothing_to_convert') {
    return "Your purchase hasn't landed yet  wait a moment and try converting again.";
  }
  if (code === 'swap_failed') {
    return 'Could not confirm the conversion. Check your wallet and trading balance before trying again.';
  }
  if (code === 'no_wallet' || code === 'authorization_key_missing') {
    return 'Your trading wallet is not ready yet. Please wait a moment and try again.';
  }
  if (code === 'trade_reconciliation_required' || code === 'withdrawal_pending_review') {
    return "This may have already gone through  we're still verifying it. Check your balance before trying again.";
  }
  if (typeof candidate?.message === 'string' && /trading wallet is not ready/i.test(candidate.message)) {
    return candidate.message;
  }
  if (candidate?.status === 400) {
    return 'Privy rejected the deposit quote. The method, token, network, or region may not be supported. Please try the other method.';
  }
  return 'Privy could not prepare a deposit quote. Please try again or choose another deposit method.';
}

/** Logs only safe diagnostic fields; provider error payloads may contain user data. */
export function logDepositFailure(error: unknown) {
  const candidate = error as {
    code?: unknown;
    status?: unknown;
    body?: { code?: unknown };
    responseData?: { code?: unknown };
  } | null;
  const rawCode = candidate?.code ?? candidate?.body?.code ?? candidate?.responseData?.code;
  console.error('Deposit flow failed:', {
    name: error instanceof Error ? error.name : 'UnknownError',
    code: typeof rawCode === 'string' ? rawCode : undefined,
    status: typeof candidate?.status === 'number' ? candidate.status : undefined,
  });
}
