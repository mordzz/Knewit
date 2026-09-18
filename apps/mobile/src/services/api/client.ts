import { env } from '@/app/config/env';
import { getSessionToken } from '@/hooks/useAuth';
import { GuestApiError, guestRequest } from '@/services/guest/guestBackend';
import { isGuestSession } from '@/store/guest/guestStore';
import type { ApiError } from '@/types/api';

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
 * credentials directly — see docs/ARCHITECTURE.md.
 */
export async function apiRequest<T>(path: string, init?: RequestInit): Promise<T> {
  // Guest mode never touches the network — every request is answered by
  // the in-app sandbox (see `services/guest/guestBackend.ts`), including
  // mutations, so a guest session works with no backend and no Privy.
  if (isGuestSession()) {
    try {
      return await guestRequest<T>(path, init);
    } catch (error) {
      if (error instanceof GuestApiError) {
        throw new ApiRequestError(error.status, error.body);
      }
      throw error;
    }
  }

  const token = await getSessionToken();
  // `FormData` must set its own multipart boundary — forcing
  // `application/json` on it would corrupt the upload.
  const isFormData = typeof FormData !== 'undefined' && init?.body instanceof FormData;

  const response = await fetch(`${env.apiBaseUrl}${path}`, {
    ...init,
    headers: {
      ...(isFormData ? {} : { 'Content-Type': 'application/json' }),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...init?.headers,
    },
  });

  if (!response.ok) {
    const body = (await response.json().catch(() => null)) as ApiError | null;
    throw new ApiRequestError(
      response.status,
      body ?? { code: 'unknown', message: response.statusText }
    );
  }

  return response.json() as Promise<T>;
}
