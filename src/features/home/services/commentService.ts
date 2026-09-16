import { apiRequest } from '@/services/api/client';
import { endpoints } from '@/services/api/endpoints';
import { env } from '@/app/config/env';
import { buildMockComments, MOCK_COMMENT_TOTAL } from '@/features/home/fixtures/comments.mock';
import type { Paginated } from '@/types/common';
import type { CommentItem, CreateCommentInput } from '@/types/social';

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
        '[commentService] backend unreachable — using local mock comments for development only.',
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
 * Posting a comment is a real, user-visible mutating action — **no
 * dev-mock fallback**, same reasoning as `createPost`/`createTrade`. The
 * backend derives the author from the authenticated session, never from
 * anything the client sends — see docs/DECISIONS.md.
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
 * caller owns this comment before deleting it — the client never sends
 * (and the backend must never trust) an ownership claim; see
 * docs/DECISIONS.md.
 */
export async function deleteComment(commentId: string): Promise<void> {
  await apiRequest<void>(endpoints.comment(commentId), { method: 'DELETE' });
}
