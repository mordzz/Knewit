import { apiRequest } from '@/services/api/client';
import { endpoints } from '@/services/api/endpoints';
import { env } from '@/app/config/env';
import { buildMockActivity, MOCK_ACTIVITY_TOTAL } from '@/features/profile/fixtures/activity.mock';
import type { Paginated } from '@/types/common';
import type { ActivityItem } from '@/types/activity';

/**
 * Real endpoint first, dev-mock fallback on failure (read-only). Every
 * item this returns must reflect an event that actually completed
 * server-side — see docs/DECISIONS.md ("Activity Events Reflect Only
 * Completed Server Actions"); this function has no way to enforce that
 * itself (it only relays whatever the backend sends), which is exactly
 * why that constraint is documented as a backend responsibility, not a
 * client-side filter.
 */
export async function getUserActivity(
  userId: string,
  cursor?: string
): Promise<Paginated<ActivityItem>> {
  const query = cursor ? `?cursor=${encodeURIComponent(cursor)}` : '';

  try {
    return await apiRequest<Paginated<ActivityItem>>(`${endpoints.userActivity(userId)}${query}`);
  } catch (error) {
    if (env.isDev) {
      console.warn(
        '[activityService] backend unreachable — using local mock activity for development only.',
        error
      );
      const start = cursor ? Number(cursor) : 0;
      const items = buildMockActivity(userId, cursor);
      const nextCursor =
        start + items.length < MOCK_ACTIVITY_TOTAL ? String(start + items.length) : null;
      return { items, nextCursor };
    }
    throw error;
  }
}
