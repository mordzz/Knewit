import { apiRequest } from '@/lib/apiClient';
import type { Paginated } from '@/types/common';
import type { FollowListItem, FollowResult, UpdateProfileInput, UserProfile } from '@/types/social';

/** Web equivalent of `apps/mobile/src/features/profile/services/userService.ts`
 * — `id` accepts the literal `"me"`, used for both the current user's
 * own profile and any other user's. */
export async function getUserProfile(id: string): Promise<UserProfile> {
  return apiRequest<UserProfile>(`/api/users/${id}`);
}

export async function updateMyProfile(input: UpdateProfileInput): Promise<UserProfile> {
  return apiRequest<UserProfile>('/api/users/me', {
    method: 'PATCH',
    body: JSON.stringify(input),
  });
}

export type ProfileImageKind = 'avatar' | 'banner';

/** Uploads a profile image (multipart) — the backend stores it in the
 * public `profile-images` bucket and returns the updated profile. */
export async function uploadProfileImage(
  kind: ProfileImageKind,
  file: File
): Promise<UserProfile> {
  const form = new FormData();
  form.append('file', file);
  return apiRequest<UserProfile>(`/api/users/me/images?kind=${kind}`, {
    method: 'POST',
    body: form,
  });
}

export function getFollowers(userId: string, cursor?: string): Promise<Paginated<FollowListItem>> {
  const query = cursor ? `?cursor=${encodeURIComponent(cursor)}` : '';
  return apiRequest<Paginated<FollowListItem>>(`/api/users/${userId}/followers${query}`);
}

export function getFollowing(userId: string, cursor?: string): Promise<Paginated<FollowListItem>> {
  const query = cursor ? `?cursor=${encodeURIComponent(cursor)}` : '';
  return apiRequest<Paginated<FollowListItem>>(`/api/users/${userId}/following${query}`);
}

/** Follow suggestions for the desktop/tablet "Who to follow" rail —
 * Knewit accounts the viewer doesn't follow yet, most-followed first
 * (`GET /users/suggestions`, five per page). */
export function getFollowSuggestions(cursor?: string): Promise<Paginated<FollowListItem>> {
  const query = cursor ? `?cursor=${encodeURIComponent(cursor)}` : '';
  return apiRequest<Paginated<FollowListItem>>(`/api/users/suggestions${query}`);
}

export async function followUser(userId: string): Promise<FollowResult> {
  return apiRequest<FollowResult>(`/api/users/${userId}/follow`, { method: 'POST' });
}

export async function unfollowUser(userId: string): Promise<FollowResult> {
  return apiRequest<FollowResult>(`/api/users/${userId}/follow`, { method: 'DELETE' });
}
