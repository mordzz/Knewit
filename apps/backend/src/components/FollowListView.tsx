'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import Link from 'next/link';
import { apiRequest } from '@/lib/apiClient';
import type { Paginated } from '@/types/common';
import type { FollowListItem, FollowResult } from '@/types/social';

/**
 * Shared by `/profile/[userId]/followers` and `.../following` — same
 * row shape either way (`FollowListRow` on mobile), just a different
 * endpoint. Unlike mobile's two near-identical screen files, this one
 * component takes `kind` as a prop since the web routes don't have the
 * same "each route file owns its own copy" convention to preserve.
 */
export function FollowListView({
  userId,
  kind,
}: {
  userId: string;
  kind: 'followers' | 'following';
}) {
  const queryClient = useQueryClient();

  const listQuery = useQuery({
    queryKey: [kind, userId],
    queryFn: () => apiRequest<Paginated<FollowListItem>>(`/api/users/${userId}/${kind}`),
  });

  const toggleFollow = useMutation({
    mutationFn: (item: FollowListItem) =>
      apiRequest<FollowResult>(`/api/users/${item.user.id}/follow`, {
        method: item.isFollowing ? 'DELETE' : 'POST',
      }),
    onSuccess: (result, item) => {
      queryClient.setQueryData<Paginated<FollowListItem>>([kind, userId], (current) =>
        current
          ? {
              ...current,
              items: current.items.map((row) =>
                row.user.id === item.user.id ? { ...row, isFollowing: result.following } : row
              ),
            }
          : current
      );
    },
  });

  const items = listQuery.data?.items ?? [];
  const title = kind === 'followers' ? 'Followers' : 'Following';

  return (
    <main className="w-full">
      <h1 className="px-4 pb-3 pt-6 text-2xl font-bold">{title}</h1>
      <div className="border-b border-border" />

      {listQuery.isPending ? (
        <p className="p-6 text-center text-text-secondary">Loading…</p>
      ) : items.length === 0 ? (
        <p className="p-6 text-center text-text-secondary">
          {kind === 'followers' ? 'No followers yet.' : 'Not following anyone yet.'}
        </p>
      ) : (
        items.map((item) => (
          <div
            key={item.user.id}
            className="flex items-center gap-3 border-b border-border px-4 py-3"
          >
            <Link
              href={item.isSelf ? '/profile' : `/profile/${item.user.id}`}
              className="flex flex-1 items-center gap-3"
            >
              <div className="flex h-11 w-11 flex-shrink-0 items-center justify-center overflow-hidden rounded-full bg-accent">
                {item.user.avatarUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={item.user.avatarUrl}
                    alt={item.user.displayName}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <span className="font-bold text-text-inverse">
                    {item.user.displayName.trim().charAt(0).toUpperCase() || '?'}
                  </span>
                )}
              </div>
              <div className="min-w-0">
                <p className="truncate font-bold">{item.user.displayName}</p>
                <p className="truncate text-sm text-text-secondary">@{item.user.handle}</p>
              </div>
            </Link>
            {!item.isSelf ? (
              <button
                type="button"
                onClick={() => toggleFollow.mutate(item)}
                disabled={toggleFollow.isPending}
                className={`rounded-md border border-white/15 px-4 py-2 text-sm font-semibold disabled:opacity-50 ${
                  item.isFollowing ? 'bg-surface-elevated text-text-primary' : 'bg-accent text-text-inverse'
                }`}
              >
                {item.isFollowing ? 'Following' : 'Follow'}
              </button>
            ) : null}
          </div>
        ))
      )}
    </main>
  );
}
