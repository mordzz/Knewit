'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { IoSettingsOutline, IoWalletOutline, IoChevronForward, IoTrendingUpOutline } from 'react-icons/io5';
import { apiRequest, ApiRequestError } from '@/lib/apiClient';
import { formatCompactNumber, formatUsd, formatRelativeTime } from '@/lib/formatters';
import type { Paginated } from '@/types/common';
import type { CommentItem, FeedItem, FollowResult, UserProfile } from '@/types/social';
import type { ActivityItem } from '@/types/activity';

type ProfileTab = 'calls' | 'replies' | 'activity';

/**
 * Shared by `/profile` (self) and `/profile/[userId]` (anyone else) —
 * one component for both, matching the mobile app's own "One Profile
 * Route/Screen for Self and Other Users" decision (docs/DECISIONS.md).
 * `userId="me"` resolves to the caller's own profile server-side
 * (docs/API.md, "Literal `me`"). Simplified from
 * `features/profile/screens/ProfileScreen.tsx`: no Settings
 * BottomSheet (Edit Profile and Log out are plain links/buttons), no
 * embedded Positions section (that's `/portfolio`'s own job), "Load
 * more" instead of infinite scroll.
 */
export function ProfileView({ userId }: { userId: string }) {
  const [tab, setTab] = useState<ProfileTab>('calls');
  const queryClient = useQueryClient();

  const profileQuery = useQuery({
    queryKey: ['profile', userId],
    queryFn: () => apiRequest<UserProfile>(`/api/users/${userId}`),
  });

  const toggleFollow = useMutation({
    mutationFn: () =>
      apiRequest<FollowResult>(`/api/users/${userId}/follow`, {
        method: profileQuery.data?.isFollowing ? 'DELETE' : 'POST',
      }),
    onSuccess: (result) => {
      queryClient.setQueryData<UserProfile>(['profile', userId], (current) =>
        current
          ? { ...current, isFollowing: result.following, followerCount: result.followerCount }
          : current
      );
    },
  });

  const tabQuery = useQuery({
    queryKey: ['profile', userId, tab],
    enabled: !!profileQuery.data,
    queryFn: () => {
      const path =
        tab === 'calls'
          ? `/api/users/${userId}/calls`
          : tab === 'replies'
            ? `/api/users/${userId}/replies`
            : `/api/users/${userId}/activity`;
      return apiRequest<Paginated<FeedItem | CommentItem | ActivityItem>>(path);
    },
  });

  if (profileQuery.isPending) {
    return <p className="p-6 text-center text-text-secondary">Loading…</p>;
  }

  if (profileQuery.isError) {
    const notFound =
      profileQuery.error instanceof ApiRequestError && profileQuery.error.status === 404;
    return (
      <p className="p-6 text-center text-text-secondary">
        {notFound ? 'This profile could not be found.' : "Couldn't load this profile."}
      </p>
    );
  }

  const user = profileQuery.data;
  const items = tabQuery.data?.items ?? [];

  return (
    <main className="w-full">
      <div className="flex items-start justify-between px-4 pb-3 pt-6">
        <div className="flex h-16 w-16 items-center justify-center overflow-hidden rounded-full bg-accent">
          {user.avatarUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={user.avatarUrl} alt={user.displayName} className="h-full w-full object-cover" />
          ) : (
            <span className="text-2xl font-bold text-text-inverse">
              {user.displayName.trim().charAt(0).toUpperCase() || '?'}
            </span>
          )}
        </div>

        {user.isSelf ? (
          <Link
            href="/profile/edit"
            className="flex h-10 w-10 items-center justify-center rounded-full border border-border text-text-secondary hover:text-text-primary"
            aria-label="Edit profile"
          >
            <IoSettingsOutline size={18} />
          </Link>
        ) : (
          <button
            type="button"
            onClick={() => toggleFollow.mutate()}
            disabled={toggleFollow.isPending}
            className={`rounded-md border border-white/15 px-5 py-2 font-semibold disabled:opacity-50 ${
              user.isFollowing ? 'bg-surface-elevated text-text-primary' : 'bg-accent text-text-inverse'
            }`}
          >
            {user.isFollowing ? 'Following' : 'Follow'}
          </button>
        )}
      </div>

      <div className="px-4">
        <p className="text-xl font-bold">{user.displayName}</p>
        <p className="text-text-secondary">@{user.handle}</p>
        <p className="mt-2 text-text-secondary">{user.bio ?? 'No bio yet.'}</p>

        <div className="mt-3 flex gap-4">
          <Link href={`/profile/${user.id}/following`} className="flex items-baseline gap-1">
            <span className="font-bold">{formatCompactNumber(user.followingCount)}</span>
            <span className="text-sm text-text-secondary">Following</span>
          </Link>
          <Link href={`/profile/${user.id}/followers`} className="flex items-baseline gap-1">
            <span className="font-bold">{formatCompactNumber(user.followerCount)}</span>
            <span className="text-sm text-text-secondary">Followers</span>
          </Link>
        </div>

        {user.isSelf ? (
          <Link
            href="/wallet"
            className="flex items-center gap-3 border-b border-border py-3 hover:opacity-90"
          >
            <IoWalletOutline size={20} className="text-accent" />
            <div className="flex-1">
              <p className="font-bold">Wallet</p>
              <p className="text-sm text-text-secondary">Connection status and wallet address</p>
            </div>
            <IoChevronForward size={16} className="text-text-tertiary" />
          </Link>
        ) : null}

        {user.isSelf ? (
          <Link
            href="/portfolio"
            className="flex items-center gap-3 border-b border-border py-3 hover:opacity-90"
          >
            <IoTrendingUpOutline size={20} className="text-accent" />
            <div className="flex-1">
              <p className="font-bold">Portfolio</p>
              <p className="text-sm text-text-secondary">Your open positions</p>
            </div>
            <IoChevronForward size={16} className="text-text-tertiary" />
          </Link>
        ) : user.walletAddress ? (
          <div className="border-b border-border py-3">
            <p className="text-sm text-text-secondary">Wallet</p>
            <p className="font-mono text-sm">
              {user.walletAddress.slice(0, 6)}…{user.walletAddress.slice(-4)}
            </p>
          </div>
        ) : null}

        {user.tradingVolume != null ? (
          <div className="border-b border-border py-3">
            <p className="font-bold">Trading Performance</p>
            <div className="mt-2 flex justify-between">
              <StatColumn label="Trading Volume" value={formatUsd(user.tradingVolume)} />
              <StatColumn label="Calls" value={String(user.callCount)} />
              <StatColumn label="Posts" value={String(user.postCount)} />
            </div>
          </div>
        ) : null}
      </div>

      <div className="mt-2 flex border-b border-border">
        {(['calls', 'replies', 'activity'] as const).map((key) => (
          <button
            key={key}
            type="button"
            onClick={() => setTab(key)}
            className={`flex-1 py-3 text-center font-semibold capitalize transition-colors ${
              tab === key ? 'border-b-2 border-accent text-text-primary' : 'text-text-secondary'
            }`}
          >
            {key}
          </button>
        ))}
      </div>

      {tabQuery.isPending ? (
        <p className="p-6 text-center text-text-secondary">Loading…</p>
      ) : items.length === 0 ? (
        <p className="p-6 text-center text-text-secondary">
          {tab === 'replies' ? 'No replies yet.' : 'Nothing here yet.'}
        </p>
      ) : tab === 'activity' ? (
        (items as ActivityItem[]).map((item) => <ActivityRow key={item.id} item={item} />)
      ) : tab === 'replies' ? (
        (items as CommentItem[]).map((item) => <ProfileReplyRow key={item.id} item={item} />)
      ) : (
        (items as FeedItem[]).map((item) => <ProfileFeedRow key={item.id} item={item} />)
      )}
    </main>
  );
}

function StatColumn({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="font-bold">{value}</p>
      <p className="text-xs text-text-tertiary">{label}</p>
    </div>
  );
}

function ProfileFeedRow({ item }: { item: FeedItem }) {
  return (
    <article className="border-b border-border px-4 py-3">
      <div className="flex items-baseline justify-between gap-2">
        <p className="font-bold">{item.author.displayName}</p>
        <span className="text-sm text-text-tertiary">{formatRelativeTime(item.createdAt)}</span>
      </div>
      <p className="mt-0.5 whitespace-pre-wrap">{item.body}</p>
      {item.market ? (
        <p className="mt-2 rounded-md border border-border px-3 py-2 text-sm font-semibold">
          {item.market.question}
        </p>
      ) : null}
    </article>
  );
}

/** A comment this user left on someone's (or their own) Post/Call —
 * links through to that post's detail page for the full thread, same
 * as X's own "Replies" tab always needing the original post's context
 * to make sense of a reply in isolation. */
function ProfileReplyRow({ item }: { item: CommentItem }) {
  return (
    <Link href={`/calls/${item.postId}`} className="block border-b border-border px-4 py-3 hover:bg-surface">
      <div className="flex items-baseline justify-between gap-2">
        <p className="text-sm text-text-tertiary">Replying to a post</p>
        <span className="text-sm text-text-tertiary">{formatRelativeTime(item.createdAt)}</span>
      </div>
      <p className="mt-0.5 whitespace-pre-wrap">{item.body}</p>
    </Link>
  );
}

function ActivityRow({ item }: { item: ActivityItem }) {
  const text =
    item.type === 'TRADE'
      ? `Took a ${item.outcome} position in "${item.marketQuestion}" for ${formatUsd(item.usdAmount)}`
      : item.type === 'CALL'
        ? `Made a ${item.outcome} Call on "${item.marketQuestion}"`
        : item.type === 'POST'
          ? 'Posted'
          : `Followed ${item.followedUser.displayName}`;

  return (
    <div className="flex items-center justify-between border-b border-border px-4 py-3">
      <p className="text-sm">{text}</p>
      <span className="whitespace-nowrap text-xs text-text-tertiary">
        {formatRelativeTime(item.createdAt)}
      </span>
    </div>
  );
}
