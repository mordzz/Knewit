import { apiRequest } from '@/lib/apiClient';
import type { Paginated } from '@/types/common';
import type { ActivityItem } from '@/types/activity';

/** Web equivalent of `apps/mobile/src/features/profile/services/activityService.ts`. */
export async function getUserActivity(userId: string, cursor?: string): Promise<Paginated<ActivityItem>> {
  const query = cursor ? `?cursor=${encodeURIComponent(cursor)}` : '';
  return apiRequest<Paginated<ActivityItem>>(`/api/users/${userId}/activity${query}`);
}
