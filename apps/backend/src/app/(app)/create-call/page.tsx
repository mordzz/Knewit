'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { IoClose } from 'react-icons/io5';
import { apiRequest, ApiRequestError } from '@/lib/apiClient';
import type { CreatePostInput, FeedItem } from '@/types/social';

const MAX_LENGTH = 280;

/**
 * Web port of `apps/frontend`'s `CreateCallScreen`, trimmed down to
 * plain Post creation only — no position-picker UI (attaching a
 * verified position to a Call). Building that picker is real,
 * non-trivial UI work on its own and Phase 3's trading flow is
 * unverified end-to-end anyway (docs/INTEGRATION.md), so there's
 * nothing to attach in practice yet. `POST /calls` without
 * `positionId` is a normal Post — exactly this app's own documented
 * behavior (docs/API.md), not a workaround.
 */
export default function CreateCallPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [body, setBody] = useState('');

  const createPost = useMutation({
    mutationFn: (input: CreatePostInput) =>
      apiRequest<FeedItem>('/api/calls', { method: 'POST', body: JSON.stringify(input) }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['feed'] });
      router.push('/');
    },
  });

  const trimmed = body.trim();
  const canPost = trimmed.length > 0 && body.length <= MAX_LENGTH && !createPost.isPending;

  return (
    <main className="w-full px-4 pb-8 pt-4">
      <div className="flex items-center justify-between">
        <button type="button" onClick={() => router.back()} aria-label="Cancel">
          <IoClose size={24} />
        </button>
        <button
          type="button"
          onClick={() => createPost.mutate({ body: trimmed })}
          disabled={!canPost}
          className="rounded-full bg-accent px-5 py-2 font-semibold text-text-inverse disabled:opacity-50"
        >
          {createPost.isPending ? 'Posting…' : 'Post'}
        </button>
      </div>

      <textarea
        value={body}
        onChange={(e) => setBody(e.target.value)}
        placeholder="What's your call?"
        rows={6}
        autoFocus
        className="mt-4 w-full resize-none bg-transparent text-xl text-text-primary placeholder:text-text-tertiary focus:outline-none"
      />

      <div className="flex items-center justify-between text-sm text-text-tertiary">
        <span />
        <span className={body.length > MAX_LENGTH ? 'text-danger' : ''}>
          {body.length}/{MAX_LENGTH}
        </span>
      </div>

      {createPost.isError ? (
        <p className="mt-2 text-sm text-danger">
          {createPost.error instanceof ApiRequestError
            ? createPost.error.message
            : "Couldn't publish this right now."}
        </p>
      ) : null}
    </main>
  );
}
