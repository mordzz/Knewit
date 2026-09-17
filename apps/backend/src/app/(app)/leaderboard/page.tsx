'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest, ApiRequestError } from '@/lib/apiClient';
import { formatUsd } from '@/lib/formatters';
import type { LeaderboardEntry, LeaderboardPage as LeaderboardPageData, LeaderboardScope } from '@/types/leaderboard';
import type { FollowResult } from '@/types/social';

/**
 * Web port of `apps/frontend`'s Leaderboard tab
 * (`LeaderboardScreen` + `LeaderboardUserCard`) — same Global/Following
 * scope, same volume-only metric (never PnL — docs/DECISIONS.md,
 * "Leaderboard Metric: Volume, Not PnL"). Simplified from the mobile
 * screen: a plain scope toggle instead of a FAB + BottomSheet filter,
 * and no separate `TopPerformers` podium for the top 3 — every rank
 * renders as the same row. "Your Rank" (the `currentUser` field on the
 * first page) still gets its own highlighted line above the list when
 * it falls outside the loaded page, same as mobile.
 */
export default function LeaderboardPage() {
  const [scope, setScope] = useState<LeaderboardScope>('global');
  const queryClient = useQueryClient();

  const leaderboardQuery = useQuery({
    queryKey: ['leaderboard', scope],
    queryFn: () => apiRequest<LeaderboardPageData>(`/api/leaderboard?scope=${scope}`),
  });

  const toggleFollow = useMutation({
    mutationFn: (entry: LeaderboardEntry) =>
      apiRequest<FollowResult>(`/api/users/${entry.user.id}/follow`, {
        method: entry.isFollowing ? 'DELETE' : 'POST',
      }),
    onSuccess: (result, entry) => {
      queryClient.setQueryData<LeaderboardPageData>(['leaderboard', scope], (current) =>
        current
          ? {
              ...current,
              items: current.items.map((row) =>
                row.user.id === entry.user.id ? { ...row, isFollowing: result.following } : row
              ),
            }
          : current
      );
    },
  });

  const data = leaderboardQuery.data;
  const items = data?.items ?? [];

  return (
    <main className="w-full">
      <h1 className="px-4 pb-3 pt-6 text-4xl font-extrabold">Leaderboard</h1>
      <div className="border-b border-border" />

      <div className="flex border-b border-border">
        {(['global', 'following'] as const).map((key) => (
          <button
            key={key}
            type="button"
            onClick={() => setScope(key)}
            className={`flex-1 py-3 text-center font-semibold capitalize transition-colors ${
              scope === key ? 'border-b-2 border-accent text-text-primary' : 'text-text-secondary'
            }`}
          >
            {key}
          </button>
        ))}
      </div>

      {data?.currentUser && data.currentUser.rank > 3 ? (
        <div className="flex items-center justify-between border-b border-border bg-surface px-4 py-3">
          <span className="font-semibold">Your rank</span>
          <span className="font-bold text-accent">
            #{data.currentUser.rank} · {formatUsd(data.currentUser.metric.value)}
          </span>
        </div>
      ) : null}

      {leaderboardQuery.isError ? (
        <p className="p-6 text-center text-danger">
          {leaderboardQuery.error instanceof ApiRequestError
            ? leaderboardQuery.error.message
            : "Couldn't load the leaderboard."}
        </p>
      ) : leaderboardQuery.isPending ? (
        <p className="p-6 text-center text-text-secondary">Loading…</p>
      ) : items.length === 0 ? (
        <p className="p-6 text-center text-text-secondary">
          {scope === 'following'
            ? "No ranked activity yet from accounts you follow."
            : 'No ranked activity yet.'}
        </p>
      ) : (
        items.map((entry) => (
          <LeaderboardRow
            key={entry.user.id}
            entry={entry}
            onToggleFollow={() => toggleFollow.mutate(entry)}
            isPending={toggleFollow.isPending && toggleFollow.variables?.user.id === entry.user.id}
          />
        ))
      )}
    </main>
  );
}

function LeaderboardRow({
  entry,
  onToggleFollow,
  isPending,
}: {
  entry: LeaderboardEntry;
  onToggleFollow: () => void;
  isPending: boolean;
}) {
  return (
    <div className="flex items-center gap-3 border-b border-border px-4 py-3">
      <span className="w-6 flex-shrink-0 text-center font-bold text-text-tertiary">{entry.rank}</span>
      <div className="flex h-11 w-11 flex-shrink-0 items-center justify-center overflow-hidden rounded-full bg-accent">
        {entry.user.avatarUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={entry.user.avatarUrl}
            alt={entry.user.displayName}
            className="h-full w-full object-cover"
          />
        ) : (
          <span className="font-bold text-text-inverse">
            {entry.user.displayName.trim().charAt(0).toUpperCase() || '?'}
          </span>
        )}
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate font-bold">{entry.user.displayName}</p>
        <p className="truncate text-sm text-text-secondary">@{entry.user.handle}</p>
      </div>
      <div className="text-right">
        <p className="font-bold">{formatUsd(entry.metric.value)}</p>
        <p className="text-xs text-text-tertiary">Trading Volume</p>
      </div>
      {!entry.isSelf ? (
        <button
          type="button"
          onClick={onToggleFollow}
          disabled={isPending}
          className={`ml-2 flex-shrink-0 rounded-md border border-white/15 px-4 py-2 text-sm font-semibold disabled:opacity-50 ${
            entry.isFollowing ? 'bg-surface-elevated text-text-primary' : 'bg-accent text-text-inverse'
          }`}
        >
          {entry.isFollowing ? 'Following' : 'Follow'}
        </button>
      ) : null}
    </div>
  );
}
