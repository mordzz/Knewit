import { apiRequest, ApiRequestError } from '@/lib/apiClient';
import type { UserPosition } from '@/types/social';

/** Web equivalent of `apps/mobile/src/features/portfolio/services/positionService.ts`. */
export async function getUserPositions(): Promise<UserPosition[]> {
  return apiRequest<UserPosition[]>('/api/positions');
}

/** A single market's position for the authenticated user, or `null` if
 * they don't hold one. A 404 means "no position here," not an error. */
export async function getMarketPosition(marketId: string): Promise<UserPosition | null> {
  try {
    return await apiRequest<UserPosition>(`/api/positions/${marketId}`);
  } catch (error) {
    if (error instanceof ApiRequestError && error.status === 404) {
      return null;
    }
    throw error;
  }
}
