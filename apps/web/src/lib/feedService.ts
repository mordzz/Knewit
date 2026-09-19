import { apiRequest } from '@/lib/apiClient';
import type { Paginated } from '@/types/common';
import type { FeedItem, LikeResult } from '@/types/social';

/** Web equivalent of `apps/mobile/src/features/home/services/feedService.ts`
 * — real endpoint only, no dev-mock fallback (this backend is always
 * live for the web app, unlike the mobile client's disconnected-dev
 * case). */
export async function getFeed(cursor?: string, sort: 'trending' | 'latest' = 'latest'): Promise<Paginated<FeedItem>> {
  const params = new URLSearchParams();
  if (cursor) params.set('cursor', cursor);
  if (sort === 'trending') params.set('sort', sort);
  const query = params.toString() ? `?${params.toString()}` : '';
  return apiRequest<Paginated<FeedItem>>(`/api/feed${query}`);
}

/** The "Following" tab — Posts/Calls from accounts the caller follows. */
export async function getFollowingFeed(cursor?: string): Promise<Paginated<FeedItem>> {
  const query = cursor ? `?cursor=${encodeURIComponent(cursor)}` : '';
  return apiRequest<Paginated<FeedItem>>(`/api/feed/following${query}`);
}

export async function likePost(id: string): Promise<LikeResult> {
  return apiRequest<LikeResult>(`/api/calls/${id}/like`, { method: 'POST' });
}

export async function unlikePost(id: string): Promise<LikeResult> {
  return apiRequest<LikeResult>(`/api/calls/${id}/like`, { method: 'DELETE' });
}
