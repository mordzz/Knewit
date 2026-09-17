'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { IoHeart, IoHeartOutline, IoChatbubbleOutline } from 'react-icons/io5';
import { apiRequest, ApiRequestError } from '@/lib/apiClient';
import { formatRelativeTime, formatCompactNumber, formatProbability } from '@/lib/formatters';
import type { Paginated } from '@/types/common';
import type { FeedItem, LikeResult } from '@/types/social';

type FeedTab = 'trending' | 'following';

/**
 * Web port of `apps/frontend`'s Home feed
 * (`features/home/screens/HomeScreen.tsx` + `CallCard`) — same two
 * tabs (labeled "Trending", not "For You" — the backend's `/feed` has
 * no personalization behind it, see docs/DECISIONS.md), same
 * X-style row layout (avatar, name/handle, relative time, body,
 * optional market attachment, like + comment counts).
 *
 * Deliberately smaller in scope than the mobile screen: no infinite
 * scroll (first page only — `nextCursor` is fetched but unused), no
 * Share action (native share has no direct web equivalent worth
 * building for this pass), and Comment is a static count, not a link
 * — there's no Post Detail page on the web yet. Like is fully real
 * (`POST`/`DELETE /calls/:id/like`), not a static count, since it's
 * cheap and makes the page feel alive rather than read-only.
 */
export default function HomePage() {
  const [tab, setTab] = useState<FeedTab>('trending');
  const queryClient = useQueryClient();

  const feedQuery = useQuery({
    queryKey: ['feed', tab],
    queryFn: () =>
      apiRequest<Paginated<FeedItem>>(tab === 'trending' ? '/api/feed' : '/api/feed/following'),
  });

  const toggleLike = useMutation({
    mutationFn: (item: FeedItem) =>
      apiRequest<LikeResult>(`/api/calls/${item.id}/like`, {
        method: item.liked ? 'DELETE' : 'POST',
      }),
    // Optimistic — flips immediately, reconciled against the real
    // response, reverted on failure via the snapshot returned here.
    // Same shape as the mobile app's `useToggleLike`.
    onMutate: async (item) => {
      const key = ['feed', tab];
      const previous = queryClient.getQueryData<Paginated<FeedItem>>(key);
      queryClient.setQueryData<Paginated<FeedItem>>(key, (current) =>
        current
          ? {
              ...current,
              items: current.items.map((row) =>
                row.id === item.id
                  ? { ...row, liked: !row.liked, likeCount: row.likeCount + (row.liked ? -1 : 1) }
                  : row
              ),
            }
          : current
      );
      return { previous };
    },
    onError: (_err, _item, context) => {
      if (context?.previous) queryClient.setQueryData(['feed', tab], context.previous);
    },
    onSuccess: (result, item) => {
      queryClient.setQueryData<Paginated<FeedItem>>(['feed', tab], (current) =>
        current
          ? {
              ...current,
              items: current.items.map((row) =>
                row.id === item.id ? { ...row, liked: result.liked, likeCount: result.likeCount } : row
              ),
            }
          : current
      );
    },
  });

  const items = feedQuery.data?.items ?? null;
  const error =
    feedQuery.isError && feedQuery.error instanceof ApiRequestError
      ? feedQuery.error.message
      : feedQuery.isError
        ? 'Something went wrong. Try again.'
        : null;

  return (
    <main className="w-full">
      <div className="sticky top-0 z-10 flex border-b border-border bg-background/80 backdrop-blur-md">
        {(['trending', 'following'] as const).map((key) => (
          <button
            key={key}
            type="button"
            onClick={() => setTab(key)}
            className={`flex-1 py-4 text-center font-semibold capitalize transition-colors ${
              tab === key ? 'border-b-2 border-accent text-text-primary' : 'text-text-secondary'
            }`}
          >
            {key}
          </button>
        ))}
      </div>

      {error ? (
        <p className="p-6 text-center text-danger">{error}</p>
      ) : items === null ? (
        <p className="p-6 text-center text-text-secondary">Loading…</p>
      ) : items.length === 0 ? (
        <p className="p-6 text-center text-text-secondary">
          {tab === 'following'
            ? "Calls from accounts you follow will show up here once you're following someone."
            : 'Nothing here yet.'}
        </p>
      ) : (
        items.map((item) => (
          <FeedRow key={item.id} item={item} onToggleLike={() => toggleLike.mutate(item)} />
        ))
      )}
    </main>
  );
}

function FeedRow({ item, onToggleLike }: { item: FeedItem; onToggleLike: () => void }) {
  return (
    <article className="flex gap-3 border-b border-border px-4 py-3">
      <Link href={`/profile/${item.author.id}`} className="h-10 w-10 flex-shrink-0 overflow-hidden rounded-full bg-accent">
        {item.author.avatarUrl ? (
          // Arbitrary external avatar host — not worth a next.config
          // remotePatterns entry for a URL this backend doesn't control.
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={item.author.avatarUrl}
            alt={item.author.displayName}
            width={40}
            height={40}
            className="h-full w-full object-cover"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center font-bold text-text-inverse">
            {item.author.displayName.trim().charAt(0).toUpperCase() || '?'}
          </div>
        )}
      </Link>

      <div className="min-w-0 flex-1">
        <div className="flex items-baseline justify-between gap-2">
          <Link href={`/profile/${item.author.id}`} className="flex min-w-0 items-baseline gap-1 hover:underline">
            <span className="truncate font-bold">{item.author.displayName}</span>
            <span className="truncate text-text-tertiary">@{item.author.handle}</span>
          </Link>
          <Link href={`/calls/${item.id}`} className="whitespace-nowrap text-sm text-text-tertiary hover:underline">
            {formatRelativeTime(item.createdAt)}
          </Link>
        </div>

        <Link href={`/calls/${item.id}`} className="block">
          <p className="mt-0.5 whitespace-pre-wrap">{item.body}</p>
        </Link>

        {item.market ? (
          <Link href={`/markets/${item.market.id}`} className="mt-3 block rounded-2xl border border-border bg-surface p-3.5 hover:opacity-90">
            <p className="line-clamp-3 font-bold">{item.market.question}</p>
            {item.positionSnapshot ? (
              <div className="mt-2 flex gap-4">
                <div>
                  <p className="text-xs text-text-tertiary">Position</p>
                  <p
                    className={`font-bold ${item.positionSnapshot.outcome === 'YES' ? 'text-yes' : 'text-no'}`}
                  >
                    {item.positionSnapshot.outcome}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-text-tertiary">Entry</p>
                  <p className="font-bold">{formatProbability(item.positionSnapshot.entryPrice)}</p>
                </div>
              </div>
            ) : (
              <div className="mt-2 flex gap-2">
                <span className="flex-1 rounded-md bg-yes py-1.5 text-center font-semibold text-text-inverse">
                  Yes {formatProbability(item.market.yesPrice)}
                </span>
                <span className="flex-1 rounded-md bg-no py-1.5 text-center font-semibold">
                  No {formatProbability(item.market.noPrice)}
                </span>
              </div>
            )}
          </Link>
        ) : null}

        <div className="mt-3 flex items-center gap-6 text-text-secondary">
          <button
            type="button"
            onClick={onToggleLike}
            className={`flex items-center gap-1.5 transition-colors ${item.liked ? 'text-danger' : 'hover:text-danger'}`}
          >
            {item.liked ? <IoHeart size={18} /> : <IoHeartOutline size={18} />}
            <span className="text-sm">{formatCompactNumber(item.likeCount)}</span>
          </button>
          <Link href={`/calls/${item.id}`} className="flex items-center gap-1.5 hover:text-text-primary">
            <IoChatbubbleOutline size={18} />
            <span className="text-sm">{formatCompactNumber(item.commentCount)}</span>
          </Link>
        </div>
      </div>
    </article>
  );
}
