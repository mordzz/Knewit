import { ApiRequestError } from '@/services/api/client';

const NO_ROUTE_CODES = new Set([
  'no_quotes',
  'unsupported_chain',
  'unsupported_currency',
  'unsupported_route',
  'route_unavailable',
  'deposit_addresses_not_enabled',
]);

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
    responseData?: { code?: unknown; error?: unknown };
  } | null;
  const rawCode = candidate?.code ?? candidate?.responseData?.code;
  const code = typeof rawCode === 'string' ? rawCode.toLowerCase() : '';
  if (NO_ROUTE_CODES.has(code)) {
    return 'No deposit route is available for this method, token, or region. Please try the other deposit method.';
  }
  if (code === 'feature_not_enabled') {
    return 'This deposit method is not enabled yet. Please try the other method or contact support.';
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
  if (__DEV__) {
    console.warn('[wallet] deposit flow failed', {
      name: error instanceof Error ? error.name : 'UnknownError',
      code: typeof rawCode === 'string' ? rawCode : undefined,
      status: typeof candidate?.status === 'number' ? candidate.status : undefined,
    });
  }
}
