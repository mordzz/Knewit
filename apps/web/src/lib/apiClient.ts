'use client';

import { getAccessToken } from '@privy-io/react-auth';
import { GuestApiError, guestRequest } from '@/lib/guest/guestBackend';
import { isGuestSession } from '@/lib/guest/guestStore';

/** The `{ code, message }` wire shape every API route error responds
 * with (`src/lib/apiError.ts::ApiError.toResponse()`, server-only —
 * not imported directly here to avoid pulling server code into the
 * client bundle). */
interface ApiErrorBody {
  code: string;
  message: string;
}

export class ApiRequestError extends Error {
  constructor(
    public status: number,
    public body: ApiErrorBody
  ) {
    super(body.message);
  }
}

/**
 * Client-side fetch helper for this same Next.js app's own `/api/*`
 * routes — same origin, so no base URL like `apps/frontend`'s
 * `apiRequest` needs (`EXPO_PUBLIC_API_BASE_URL`). Still attaches
 * `Authorization: Bearer <token>` the same way, via Privy's web SDK
 * `getAccessToken()` (the web equivalent of the mobile hook's
 * `getSessionToken()`) — our backend's `requireAuth`/`optionalAuth`
 * (`src/lib/privy.ts`) don't care which SDK issued the token.
 */
export async function apiRequest<T>(path: string, init?: RequestInit): Promise<T> {
  // Guest mode never touches the network — every request (reads and
  // mutations) is answered by the in-app sandbox, so it works without
  // Privy, Supabase, or a running backend.
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

  const token = await getAccessToken().catch(() => null);
  // `FormData` must set its own multipart boundary — forcing
  // `application/json` on it would corrupt the upload.
  const isFormData = typeof FormData !== 'undefined' && init?.body instanceof FormData;

  const response = await fetch(path, {
    ...init,
    headers: {
      ...(isFormData ? {} : { 'Content-Type': 'application/json' }),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...init?.headers,
    },
  });

  if (!response.ok) {
    const body = (await response.json().catch(() => null)) as ApiErrorBody | null;
    throw new ApiRequestError(response.status, body ?? { code: 'unknown', message: response.statusText });
  }

  return response.json() as Promise<T>;
}
