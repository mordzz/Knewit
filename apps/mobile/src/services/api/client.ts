import { env } from '@/app/config/env';
import { getSessionToken } from '@/hooks/useAuth';
import type { ApiError } from '@/types/api';

// Without a ceiling, a stalled connection keeps a query in `loading`
// forever instead of failing into its retry/error state.
const REQUEST_TIMEOUT_MS = 20_000;
// Uploads (profile images) carry a body and can be slow on mobile data.
const UPLOAD_TIMEOUT_MS = 60_000;

export class ApiRequestError extends Error {
  constructor(
    public status: number,
    public body: ApiError
  ) {
    super(body.message);
  }
}

/**
 * The only thing the app ever talks to over the network for market/social
 * data is our own backend. It never calls Polymarket or holds Polymarket
 * credentials directly  see docs/ARCHITECTURE.md.
 */
export async function apiRequest<T>(path: string, init?: RequestInit): Promise<T> {
  const token = await getSessionToken();
  // `FormData` must set its own multipart boundary  forcing
  // `application/json` on it would corrupt the upload.
  const isFormData = typeof FormData !== 'undefined' && init?.body instanceof FormData;

  const controller = new AbortController();
  const timeout = setTimeout(
    () => controller.abort(),
    isFormData ? UPLOAD_TIMEOUT_MS : REQUEST_TIMEOUT_MS
  );
  const callerSignal = init?.signal;
  const abortFromCaller = () => controller.abort();
  if (callerSignal?.aborted) controller.abort();
  callerSignal?.addEventListener('abort', abortFromCaller);

  let response: Response;
  try {
    response = await fetch(`${env.apiBaseUrl}${path}`, {
      ...init,
      signal: controller.signal,
      headers: {
        ...(isFormData ? {} : { 'Content-Type': 'application/json' }),
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...init?.headers,
      },
    });
  } finally {
    clearTimeout(timeout);
    callerSignal?.removeEventListener('abort', abortFromCaller);
  }

  if (!response.ok) {
    const body = (await response.json().catch(() => null)) as ApiError | null;
    throw new ApiRequestError(
      response.status,
      body ?? { code: 'unknown', message: response.statusText }
    );
  }

  const data = (await response.json()) as T & { status?: string; code?: string; message?: string };
  if (data?.status === 'reconciliation_required') {
    throw new ApiRequestError(202, {
      code: data.code ?? 'trade_reconciliation_required',
      message:
        data.message ?? 'The transaction may have executed. Check your wallet before trying again.',
    });
  }
  return data;
}
