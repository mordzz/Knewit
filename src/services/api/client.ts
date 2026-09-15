import { env } from '@/app/config/env';
import type { ApiError } from '@/types/api';

export class ApiRequestError extends Error {
  constructor(public status: number, public body: ApiError) {
    super(body.message);
  }
}

/**
 * The only thing the app ever talks to over the network for market/social
 * data is our own backend. It never calls Polymarket or holds Polymarket
 * credentials directly — see docs/ARCHITECTURE.md.
 */
export async function apiRequest<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${env.apiBaseUrl}${path}`, {
    headers: { 'Content-Type': 'application/json' },
    ...init,
  });

  if (!response.ok) {
    const body = (await response.json().catch(() => null)) as ApiError | null;
    throw new ApiRequestError(response.status, body ?? { code: 'unknown', message: response.statusText });
  }

  return response.json() as Promise<T>;
}
