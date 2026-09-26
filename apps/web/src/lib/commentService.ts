import { apiRequest } from '@/lib/apiClient';
import type { Paginated } from '@/types/common';
import type { CommentItem, CreateCommentInput, LikeResult, ShareResult } from '@/types/social';

/** Web equivalent of `apps/mobile/src/features/home/services/commentService.ts`. */
export async function getComments(postId: string, cursor?: string): Promise<Paginated<CommentItem>> {
  const query = cursor ? `?cursor=${encodeURIComponent(cursor)}` : '';
  return apiRequest<Paginated<CommentItem>>(`/api/calls/${postId}/comments${query}`);
}

/** A top-level comment's replies  one level deep. */
export async function getCommentReplies(commentId: string, cursor?: string): Promise<Paginated<CommentItem>> {
  const query = cursor ? `?cursor=${encodeURIComponent(cursor)}` : '';
  return apiRequest<Paginated<CommentItem>>(`/api/comments/${commentId}/replies${query}`);
}

export async function getCommentDetail(commentId: string): Promise<{ comment: CommentItem; callout: import('@/types/social').FeedItem }> {
  return apiRequest(`/api/comments/${commentId}`);
}

export async function createComment(postId: string, input: CreateCommentInput): Promise<CommentItem> {
  return apiRequest<CommentItem>(`/api/calls/${postId}/comments`, {
    method: 'POST',
    body: JSON.stringify(input),
  });
}

export async function deleteComment(commentId: string): Promise<void> {
  await apiRequest<void>(`/api/comments/${commentId}`, { method: 'DELETE' });
}

export async function likeComment(id: string): Promise<LikeResult> {
  return apiRequest<LikeResult>(`/api/comments/${id}/like`, { method: 'POST' });
}

export async function unlikeComment(id: string): Promise<LikeResult> {
  return apiRequest<LikeResult>(`/api/comments/${id}/like`, { method: 'DELETE' });
}

export async function shareComment(id: string): Promise<ShareResult> {
  return apiRequest<ShareResult>(`/api/comments/${id}/share`, { method: 'POST' });
}

/** Profile's Replies tab  comments this user has made on any Post/Call.
 * `id` accepts `"me"`. */
export async function getUserReplies(id: string, cursor?: string): Promise<Paginated<CommentItem>> {
  const query = cursor ? `?cursor=${encodeURIComponent(cursor)}` : '';
  return apiRequest<Paginated<CommentItem>>(`/api/users/${id}/replies${query}`);
}
