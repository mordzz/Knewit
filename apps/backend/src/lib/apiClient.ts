'use client';

import { getAccessToken } from '@privy-io/react-auth';

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
  const token = await getAccessToken().catch(() => null);

  const response = await fetch(path, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
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
