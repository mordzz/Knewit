import { apiRequest } from '@/services/api/client';
import { endpoints } from '@/services/api/endpoints';
import { env } from '@/app/config/env';
import {
  buildMockComments,
  buildMockReplies,
  buildMockUserReplies,
  mockUserRepliesTotal,
  MOCK_COMMENT_TOTAL,
  MOCK_REPLY_COMMENT_TOTAL,
} from '@/features/home/fixtures/comments.mock';
import type { Paginated } from '@/types/common';
import type { CommentItem, CreateCommentInput, LikeResult, ShareResult } from '@/types/social';

/** Real endpoint first, dev-mock fallback on failure (read-only, same
 * pattern as every other list fetch in this codebase). */
export async function getComments(
  postId: string,
  cursor?: string
): Promise<Paginated<CommentItem>> {
  const query = cursor ? `?cursor=${encodeURIComponent(cursor)}` : '';

  try {
    return await apiRequest<Paginated<CommentItem>>(`${endpoints.comments(postId)}${query}`);
  } catch (error) {
    if (env.isDev) {
      console.warn(
        '[commentService] backend unreachable  using local mock comments for development only.',
        error
      );
      const start = cursor ? Number(cursor) : 0;
      const items = buildMockComments(postId, cursor);
      const nextCursor =
        start + items.length < MOCK_COMMENT_TOTAL ? String(start + items.length) : null;
      return { items, nextCursor };
    }
    throw error;
  }
}

/**
 * A top-level comment's replies  one level deep, see docs/DECISIONS.md
 * ("One Reply Level"). Same real-endpoint-first/dev-mock-fallback
 * pattern as `getComments`; only fetched once a thread is expanded
 * (`useCommentReplies` is `enabled`-gated), not eagerly for every
 * comment in a list.
 */
export async function getCommentReplies(
  commentId: string,
  postId: string,
  cursor?: string
): Promise<Paginated<CommentItem>> {
  const query = cursor ? `?cursor=${encodeURIComponent(cursor)}` : '';

  try {
    return await apiRequest<Paginated<CommentItem>>(
      `${endpoints.commentReplies(commentId)}${query}`
    );
  } catch (error) {
    if (env.isDev) {
      console.warn(
        '[commentService] backend unreachable  using local mock replies for development only.',
        error
      );
      const start = cursor ? Number(cursor) : 0;
      const items = buildMockReplies(commentId, postId, cursor);
      const nextCursor =
        start + items.length < MOCK_REPLY_COMMENT_TOTAL ? String(start + items.length) : null;
      return { items, nextCursor };
    }
    throw error;
  }
}

/**
 * Profile's Replies tab  comments this user has made on any Post/Call
 * (top-level and nested), newest first. `id` accepts `"me"`  see
 * docs/API.md. Replaces the old Posts tab (see `ProfileScreen`'s doc
 * comment); real-endpoint-first/dev-mock-fallback, same pattern as
 * `getComments`.
 */
export async function getUserReplies(id: string, cursor?: string): Promise<Paginated<CommentItem>> {
  const query = cursor ? `?cursor=${encodeURIComponent(cursor)}` : '';

  try {
    return await apiRequest<Paginated<CommentItem>>(`${endpoints.userReplies(id)}${query}`);
  } catch (error) {
    if (env.isDev) {
      console.warn(
        '[commentService] backend unreachable  using local mock replies for development only.',
        error
      );
      const start = cursor ? Number(cursor) : 0;
      const items = buildMockUserReplies(id, cursor);
      const nextCursor = start + items.length < mockUserRepliesTotal() ? String(start + items.length) : null;
      return { items, nextCursor };
    }
    throw error;
  }
}

/**
 * Posting a comment is a real, user-visible mutating action  **no
 * dev-mock fallback**, same reasoning as `createPost`/`createTrade`. The
 * backend derives the author from the authenticated session, never from
 * anything the client sends  see docs/DECISIONS.md. `input.parentCommentId`
 * set makes this a reply rather than a top-level comment; the backend
 * (not this function) is the one that must reject a `parentCommentId`
 * that isn't itself a top-level comment (see "One Reply Level").
 */
export async function createComment(
  postId: string,
  input: CreateCommentInput
): Promise<CommentItem> {
  return apiRequest<CommentItem>(endpoints.comments(postId), {
    method: 'POST',
    body: JSON.stringify(input),
  });
}

/**
 * **No dev-mock fallback.** The backend must independently verify the
 * caller owns this comment before deleting it  the client never sends
 * (and the backend must never trust) an ownership claim; see
 * docs/DECISIONS.md.
 */
export async function deleteComment(commentId: string): Promise<void> {
  await apiRequest<void>(endpoints.comment(commentId), { method: 'DELETE' });
}

/**
 * Like/unlike a comment  same shape and same no-dev-mock-fallback
 * reasoning as `postService.ts::likePost`/`unlikePost`: `useToggleCommentLike`'s
 * optimistic update already gives instant feedback, and this call still
 * needs to genuinely reach the backend to roll back on a real failure.
 */
export async function likeComment(id: string): Promise<LikeResult> {
  return apiRequest<LikeResult>(endpoints.commentLike(id), { method: 'POST' });
}

export async function unlikeComment(id: string): Promise<LikeResult> {
  return apiRequest<LikeResult>(endpoints.commentLike(id), { method: 'DELETE' });
}

/**
 * Records a share of this comment. **No dev-mock fallback**  same
 * reasoning as `likeComment`: `useShareComment`'s optimistic +1 already
 * gives instant feedback, and in this no-backend dev environment the
 * real call will fail and the optimistic bump will roll back, which is
 * the correct, honest behavior (see `useToggleLike`'s own documented
 * comment on this exact pattern)  not a bug.
 */
export async function shareComment(id: string): Promise<ShareResult> {
  return apiRequest<ShareResult>(endpoints.commentShare(id), { method: 'POST' });
}
