'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { IoArrowBack, IoHeart, IoHeartOutline, IoTrash } from 'react-icons/io5';
import { apiRequest, ApiRequestError } from '@/lib/apiClient';
import { formatRelativeTime, formatProbability, formatCompactNumber } from '@/lib/formatters';
import type { Paginated } from '@/types/common';
import type { CommentItem, FeedItem, LikeResult } from '@/types/social';

/**
 * Web port of `apps/frontend`'s `PostDetailScreen` — serves both a
 * normal Post and a position-backed Call, same as mobile
 * (docs/SOCIAL-FEATURE.md). Simplified: comments are one level deep
 * on this page (no reply-to-a-reply UI — `GET /comments/:id/replies`
 * exists but isn't wired up here), and Share/comment-like are omitted.
 */
export function PostDetailView({ postId }: { postId: string }) {
  const queryClient = useQueryClient();
  const [comment, setComment] = useState('');

  const postQuery = useQuery({
    queryKey: ['post', postId],
    queryFn: () => apiRequest<FeedItem>(`/api/calls/${postId}`),
  });

  const commentsQuery = useQuery({
    queryKey: ['comments', postId],
    queryFn: () => apiRequest<Paginated<CommentItem>>(`/api/calls/${postId}/comments`),
  });

  const toggleLike = useMutation({
    mutationFn: () =>
      apiRequest<LikeResult>(`/api/calls/${postId}/like`, {
        method: postQuery.data?.liked ? 'DELETE' : 'POST',
      }),
    onSuccess: (result) => {
      queryClient.setQueryData<FeedItem>(['post', postId], (current) =>
        current ? { ...current, liked: result.liked, likeCount: result.likeCount } : current
      );
    },
  });

  const createComment = useMutation({
    mutationFn: (body: string) =>
      apiRequest<CommentItem>(`/api/calls/${postId}/comments`, {
        method: 'POST',
        body: JSON.stringify({ body }),
      }),
    onSuccess: (created) => {
      setComment('');
      queryClient.setQueryData<Paginated<CommentItem>>(['comments', postId], (current) =>
        current ? { ...current, items: [created, ...current.items] } : current
      );
    },
  });

  const deleteComment = useMutation({
    mutationFn: (commentId: string) => apiRequest(`/api/comments/${commentId}`, { method: 'DELETE' }),
    onSuccess: (_, commentId) => {
      queryClient.setQueryData<Paginated<CommentItem>>(['comments', postId], (current) =>
        current ? { ...current, items: current.items.filter((c) => c.id !== commentId) } : current
      );
    },
  });

  if (postQuery.isPending) {
    return <p className="p-6 text-center text-text-secondary">Loading…</p>;
  }

  if (postQuery.isError) {
    const notFound = postQuery.error instanceof ApiRequestError && postQuery.error.status === 404;
    return (
      <p className="p-6 text-center text-text-secondary">
        {notFound ? 'This Call was not found.' : "Couldn't load this Call."}
      </p>
    );
  }

  const post = postQuery.data;
  const comments = commentsQuery.data?.items ?? [];

  return (
    <main className="w-full">
      <div className="flex items-center gap-3 px-4 pt-4">
        <Link href="/" aria-label="Back to Home">
          <IoArrowBack size={22} />
        </Link>
        <h1 className="text-lg font-bold">Call</h1>
      </div>

      <article className="border-b border-border px-4 py-4">
        <div className="flex items-baseline justify-between gap-2">
          <Link href={`/profile/${post.author.id}`} className="flex items-baseline gap-1 hover:underline">
            <span className="font-bold">{post.author.displayName}</span>
            <span className="text-text-tertiary">@{post.author.handle}</span>
          </Link>
          <span className="text-sm text-text-tertiary">{formatRelativeTime(post.createdAt)}</span>
        </div>

        <p className="mt-2 whitespace-pre-wrap text-lg">{post.body}</p>

        {post.market ? (
          <Link
            href={`/markets/${post.market.id}`}
            className="mt-3 block rounded-2xl border border-border bg-surface p-3.5 hover:opacity-90"
          >
            <p className="font-bold">{post.market.question}</p>
            {post.positionSnapshot ? (
              <div className="mt-2 flex gap-4">
                <div>
                  <p className="text-xs text-text-tertiary">Position</p>
                  <p
                    className={`font-bold ${post.positionSnapshot.outcome === 'YES' ? 'text-yes' : 'text-no'}`}
                  >
                    {post.positionSnapshot.outcome}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-text-tertiary">Entry</p>
                  <p className="font-bold">{formatProbability(post.positionSnapshot.entryPrice)}</p>
                </div>
              </div>
            ) : null}
          </Link>
        ) : null}

        <div className="mt-3 flex items-center gap-6 text-text-secondary">
          <button
            type="button"
            onClick={() => toggleLike.mutate()}
            className={`flex items-center gap-1.5 ${post.liked ? 'text-danger' : 'hover:text-danger'}`}
          >
            {post.liked ? <IoHeart size={18} /> : <IoHeartOutline size={18} />}
            <span className="text-sm">{formatCompactNumber(post.likeCount)}</span>
          </button>
          <span className="text-sm">{formatCompactNumber(post.commentCount)} comments</span>
        </div>
      </article>

      <div className="flex items-center gap-3 border-b border-border px-4 py-3">
        <input
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          placeholder="Post your reply"
          className="min-h-10 flex-1 rounded-full border border-border bg-surface-elevated px-4 text-text-primary placeholder:text-text-tertiary focus:outline-none focus:ring-1 focus:ring-accent"
        />
        <button
          type="button"
          onClick={() => comment.trim() && createComment.mutate(comment.trim())}
          disabled={createComment.isPending || comment.trim().length === 0}
          className="rounded-full bg-accent px-4 py-2 font-semibold text-text-inverse disabled:opacity-50"
        >
          Reply
        </button>
      </div>

      {commentsQuery.isPending ? (
        <p className="p-6 text-center text-text-secondary">Loading comments…</p>
      ) : comments.length === 0 ? (
        <p className="p-6 text-center text-text-secondary">No comments yet.</p>
      ) : (
        comments.map((c) => (
          <div key={c.id} className="border-b border-border px-4 py-3">
            <div className="flex items-baseline justify-between gap-2">
              <Link href={`/profile/${c.author.id}`} className="flex items-baseline gap-1 hover:underline">
                <span className="font-bold">{c.author.displayName}</span>
                <span className="text-text-tertiary">@{c.author.handle}</span>
              </Link>
              <div className="flex items-center gap-2">
                <span className="text-sm text-text-tertiary">{formatRelativeTime(c.createdAt)}</span>
                {c.canDelete ? (
                  <button
                    type="button"
                    onClick={() => deleteComment.mutate(c.id)}
                    aria-label="Delete comment"
                    className="text-text-tertiary hover:text-danger"
                  >
                    <IoTrash size={14} />
                  </button>
                ) : null}
              </div>
            </div>
            <p className="mt-0.5 whitespace-pre-wrap">{c.body}</p>
          </div>
        ))
      )}
    </main>
  );
}
