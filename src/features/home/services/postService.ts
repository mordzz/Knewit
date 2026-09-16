import { apiRequest } from '@/services/api/client';
import { endpoints } from '@/services/api/endpoints';
import { env } from '@/app/config/env';
import {
  buildMockUserContent,
  mockUserContentTotal,
  pickMockFeedItem,
} from '@/features/home/fixtures/feed.mock';
import type { Paginated } from '@/types/common';
import type { CreatePostInput, FeedItem, LikeResult } from '@/types/social';

/**
 * Creates a Post, or a position-backed Call when `input.positionId` is
 * set — the same endpoint either way (see docs/SOCIAL-FEATURE.md, "no
 * separate Call table/type"). Deliberately **no dev-mock fallback**,
 * same principle as Sprint 7's `createTrade`: publishing is a real,
 * user-visible mutating action, and a "successful" post that never
 * reached a backend would be exactly the kind of fabricated result this
 * project's spec forbids. A failure here (including "no backend exists
 * in this environment") propagates and the composer shows an honest
 * error — see docs/DECISIONS.md.
 *
 * The backend, not this function, is responsible for verifying the
 * caller owns `positionId`, fetching the authoritative live position,
 * and writing the immutable `PositionSnapshot` — this call only ever
 * sends `body`/`positionId`, never a snapshot or a "verified" flag.
 */
export async function createPost(input: CreatePostInput): Promise<FeedItem> {
  return apiRequest<FeedItem>(endpoints.calls, {
    method: 'POST',
    body: JSON.stringify(input),
  });
}

/**
 * A single Post/Call for the Detail screen. Real endpoint first —
 * read-only, so (unlike `createPost`) a dev-mock fallback is safe here,
 * same pattern as `marketService.ts::getMarketById`.
 */
export async function getPostById(id: string): Promise<FeedItem> {
  try {
    return await apiRequest<FeedItem>(endpoints.call(id));
  } catch (error) {
    if (env.isDev) {
      console.warn(
        '[postService] backend unreachable — using a local mock post fixture for development only.',
        error
      );
      return pickMockFeedItem(id);
    }
    throw error;
  }
}

/**
 * Like/unlike a Post or Call — the same endpoint serves both (see
 * docs/SOCIAL-FEATURE.md). **No dev-mock fallback**: `useToggleLike`'s
 * own optimistic update already gives instant UI feedback, and this
 * call still needs to genuinely reach the backend to roll back on a
 * real failure — faking success here would make the optimistic update
 * permanent even when nothing was actually persisted. The backend
 * derives *who* is liking from the authenticated session, never from a
 * client-supplied user id — see docs/DECISIONS.md.
 */
export async function likePost(id: string): Promise<LikeResult> {
  return apiRequest<LikeResult>(endpoints.like(id), { method: 'POST' });
}

export async function unlikePost(id: string): Promise<LikeResult> {
  return apiRequest<LikeResult>(endpoints.like(id), { method: 'DELETE' });
}

async function getUserContent(
  endpoint: string,
  cursor: string | undefined,
  userId: string,
  kind: 'posts' | 'calls'
): Promise<Paginated<FeedItem>> {
  const query = cursor ? `?cursor=${encodeURIComponent(cursor)}` : '';

  try {
    return await apiRequest<Paginated<FeedItem>>(`${endpoint}${query}`);
  } catch (error) {
    if (env.isDev) {
      console.warn(
        `[postService] backend unreachable — using local mock ${kind} for development only.`,
        error
      );
      const start = cursor ? Number(cursor) : 0;
      const items = buildMockUserContent(userId, kind, cursor);
      const nextCursor =
        start + items.length < mockUserContentTotal(kind) ? String(start + items.length) : null;
      return { items, nextCursor };
    }
    throw error;
  }
}

/** Profile's Posts tab — normal posts only (`positionSnapshot === null`
 * server-side). `id` accepts `"me"` — see docs/API.md. */
export function getUserPosts(id: string, cursor?: string): Promise<Paginated<FeedItem>> {
  return getUserContent(endpoints.userPosts(id), cursor, id, 'posts');
}

/** Profile's Calls tab — position-backed Calls only. */
export function getUserCalls(id: string, cursor?: string): Promise<Paginated<FeedItem>> {
  return getUserContent(endpoints.userCalls(id), cursor, id, 'calls');
}
