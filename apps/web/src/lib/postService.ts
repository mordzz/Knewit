import { apiRequest } from '@/lib/apiClient';
import type { Paginated } from '@/types/common';
import type { CreateCallInput, FeedItem } from '@/types/social';

/** Web equivalent of `apps/mobile/src/features/home/services/postService.ts`. */
export async function createCall(input: CreateCallInput): Promise<FeedItem> {
  return apiRequest<FeedItem>('/api/calls', {
    method: 'POST',
    body: JSON.stringify(input),
  });
}

export async function getPostById(id: string): Promise<FeedItem> {
  return apiRequest<FeedItem>(`/api/calls/${id}`);
}

/** Deletes a Callout — the backend enforces author-only (403 otherwise). */
export async function deletePost(id: string): Promise<void> {
  await apiRequest<Record<string, never>>(`/api/calls/${id}`, { method: 'DELETE' });
}

/** Profile's Calls tab — position-backed Calls only. `id` accepts `"me"`. */
export async function getUserCalls(id: string, cursor?: string): Promise<Paginated<FeedItem>> {
  const query = cursor ? `?cursor=${encodeURIComponent(cursor)}` : '';
  return apiRequest<Paginated<FeedItem>>(`/api/users/${id}/calls${query}`);
}
