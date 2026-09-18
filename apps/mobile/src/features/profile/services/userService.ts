import { apiRequest } from '@/services/api/client';
import { endpoints } from '@/services/api/endpoints';
import { env } from '@/app/config/env';
import { buildMockUserProfile } from '@/features/profile/fixtures/userProfile.mock';
import {
  buildMockFollowList,
  MOCK_FOLLOW_LIST_TOTAL,
} from '@/features/profile/fixtures/followList.mock';
import type { Paginated } from '@/types/common';
import type { FollowListItem, FollowResult, UpdateProfileInput, UserProfile } from '@/types/social';

/**
 * Real endpoint first, dev-mock fallback on failure (read-only). `id`
 * accepts the literal `"me"` — see docs/API.md — used for both the
 * current user's own profile and any other user's, so `ProfileScreen`
 * needs exactly one fetch path regardless of which it's showing.
 */
export async function getUserProfile(id: string): Promise<UserProfile> {
  try {
    return await apiRequest<UserProfile>(endpoints.users(id));
  } catch (error) {
    if (env.isDev) {
      console.warn(
        '[userService] backend unreachable — using a local mock profile for development only.',
        error
      );
      return buildMockUserProfile(id);
    }
    throw error;
  }
}

/**
 * **No dev-mock fallback** — editing is a real, user-visible mutating
 * action. The backend must independently validate `displayName`/
 * `handle`/`bio` (length, format, uniqueness) — client-side validation
 * in `EditProfileScreen` is UX only, never the actual integrity boundary
 * — see docs/DECISIONS.md.
 */
export async function updateMyProfile(input: UpdateProfileInput): Promise<UserProfile> {
  return apiRequest<UserProfile>(endpoints.users('me'), {
    method: 'PATCH',
    body: JSON.stringify(input),
  });
}

/** React Native's multipart file shape: `FormData` uploads a local file
 * by reference, not by value (no `Blob` in RN). */
export interface ProfileImageFile {
  uri: string;
  name: string;
  type: string;
}

/**
 * Uploads a profile avatar/banner (multipart) — the backend stores it in
 * the public `profile-images` bucket and returns the updated profile.
 * **No dev-mock fallback**, same reasoning as `updateMyProfile`.
 */
export async function uploadProfileImage(
  kind: 'avatar' | 'banner',
  file: ProfileImageFile
): Promise<UserProfile> {
  const form = new FormData();
  form.append('file', file as unknown as Blob);
  return apiRequest<UserProfile>(endpoints.userImages(kind), {
    method: 'POST',
    body: form,
  });
}

async function getFollowList(
  endpoint: string,
  cursor: string | undefined,
  mockBuilder: (userId: string, cursor?: string) => FollowListItem[],
  userId: string
): Promise<Paginated<FollowListItem>> {
  const query = cursor ? `?cursor=${encodeURIComponent(cursor)}` : '';

  try {
    return await apiRequest<Paginated<FollowListItem>>(`${endpoint}${query}`);
  } catch (error) {
    if (env.isDev) {
      console.warn(
        '[userService] backend unreachable — using local mock follow list for development only.',
        error
      );
      const start = cursor ? Number(cursor) : 0;
      const items = mockBuilder(userId, cursor);
      const nextCursor =
        start + items.length < MOCK_FOLLOW_LIST_TOTAL ? String(start + items.length) : null;
      return { items, nextCursor };
    }
    throw error;
  }
}

export function getFollowers(userId: string, cursor?: string): Promise<Paginated<FollowListItem>> {
  return getFollowList(endpoints.followers(userId), cursor, buildMockFollowList, userId);
}

export function getFollowing(userId: string, cursor?: string): Promise<Paginated<FollowListItem>> {
  return getFollowList(endpoints.following(userId), cursor, buildMockFollowList, userId);
}

/**
 * Follow suggestions — Knewit accounts the viewer doesn't follow yet,
 * most-followed first (`GET /users/suggestions`, five per page). Dev-mock
 * fallback is an
 * **empty page, never fabricated people**: a suggestion is a promise
 * that a real account exists to follow, so fixture users would be worse
 * than an honestly empty rail (same rule as `positionService.ts`).
 */
export async function getFollowSuggestions(cursor?: string): Promise<Paginated<FollowListItem>> {
  const query = cursor ? `?cursor=${encodeURIComponent(cursor)}` : '';
  try {
    return await apiRequest<Paginated<FollowListItem>>(`${endpoints.userSuggestions}${query}`);
  } catch (error) {
    if (env.isDev) {
      console.warn(
        '[userService] backend unreachable — returning no follow suggestions (never fabricated) for development only.',
        error
      );
      return { items: [], nextCursor: null };
    }
    throw error;
  }
}

/**
 * **No dev-mock fallback** — following is a real, user-visible mutating
 * action (same reasoning as every other create/mutate call in this
 * codebase). The backend derives the follower from the authenticated
 * session and must reject `followerId === followingId` itself — the
 * client never sends a follower id at all, only the target — see
 * docs/DECISIONS.md.
 */
export async function followUser(userId: string): Promise<FollowResult> {
  return apiRequest<FollowResult>(endpoints.follow(userId), { method: 'POST' });
}

export async function unfollowUser(userId: string): Promise<FollowResult> {
  return apiRequest<FollowResult>(endpoints.follow(userId), { method: 'DELETE' });
}
