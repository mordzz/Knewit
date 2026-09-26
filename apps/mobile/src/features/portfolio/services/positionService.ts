import { apiRequest, ApiRequestError } from '@/services/api/client';
import { endpoints } from '@/services/api/endpoints';
import { env } from '@/app/config/env';
import type { UserPosition } from '@/types/social';

/**
 * Real endpoint first, same pattern as `marketService.ts`'s read
 * endpoints  but the dev fallback here is deliberately an *empty*
 * result, never fabricated position data. Trading can't actually
 * succeed without a real backend (see `tradingService.ts`), so there is
 * no honest position data to show in dev either; pretending otherwise
 * would fabricate holdings the user never actually has. See
 * docs/DECISIONS.md.
 */
export async function getUserPositions(): Promise<UserPosition[]> {
  try {
    return await apiRequest<UserPosition[]>(endpoints.positions);
  } catch (error) {
    if (env.isDev) {
      console.warn(
        '[positionService] backend unreachable  returning no positions (never fabricated) for development only.',
        error
      );
      return [];
    }
    throw error;
  }
}

/**
 * A single market's position for the authenticated user, or `null` if
 * they don't hold one  used by Market Detail's "My Position" section.
 * A 404 from the backend means "no position here," not an error.
 */
export async function getMarketPosition(marketId: string): Promise<UserPosition | null> {
  try {
    return await apiRequest<UserPosition>(endpoints.position(marketId));
  } catch (error) {
    if (error instanceof ApiRequestError && error.status === 404) {
      return null;
    }
    if (env.isDev) {
      console.warn(
        '[positionService] backend unreachable  returning no position (never fabricated) for development only.',
        error
      );
      return null;
    }
    throw error;
  }
}
