'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Text } from '@/components/ui/Text';
import { Icon } from '@/components/ui/Icon';
import { Avatar } from '@/components/ui/Avatar';
import { Button } from '@/components/ui/Button';
import { Divider } from '@/components/ui/Divider';
import { TabRow, type TabRowOption } from '@/components/ui/TabRow';
import { LoadingState } from '@/components/feedback/LoadingState';
import { EmptyState } from '@/components/feedback/EmptyState';
import { ErrorState } from '@/components/feedback/ErrorState';
import { CallCard } from '@/components/CallCard';
import { ActivityRow } from '@/features/activity/components/ActivityRow';
import { WalletAddress } from '@/features/wallet/components/WalletAddress';
import { EditProfileModal } from '@/features/profile/components/EditProfileModal';
import { WhoToFollowPanel } from '@/components/WhoToFollowPanel';
import { TrendingMarketsPanel } from '@/components/TrendingMarketsPanel';
import { useProfile } from '@/features/profile/hooks/useProfile';
import { useFollowToggle } from '@/features/profile/hooks/useFollowToggle';
import { useUserCalls } from '@/features/profile/hooks/useUserCalls';
import { useUserReplies } from '@/features/profile/hooks/useUserReplies';
import { useUserActivity } from '@/features/activity/hooks/useUserActivity';
import { useIsDesktop } from '@/hooks/useIsDesktop';
import { ApiRequestError } from '@/lib/apiClient';
import { formatCompactNumber, formatRelativeTime } from '@/lib/formatters';
import type { CommentItem, FeedItem } from '@/types/social';
import type { ActivityItem } from '@/types/activity';

type ProfileTab = 'calls' | 'replies' | 'activity';

const BASE_TAB_OPTIONS: TabRowOption<ProfileTab>[] = [
  { key: 'calls', label: 'Calls' },
  { key: 'replies', label: 'Replies' },
];

// Mobile keeps the Activity tab here; desktop has its own `/activity`
// page in `SideNav`, so the tab is left out there.
const MOBILE_TAB_OPTIONS: TabRowOption<ProfileTab>[] = [...BASE_TAB_OPTIONS, { key: 'activity', label: 'Activity' }];

/**
 * Direct conversion of `apps/mobile`'s `ProfileScreen` — the one
 * Profile route/screen for both the viewer's own profile and anyone
 * else's. Same header (avatar plus an "Edit Profile" button beside the
 * name for the viewer's own profile, or a Follow button), same
 * Wallet & Portfolio row and profile activity tabs.
 */
export function ProfileView({ userId }: { userId?: string }) {
  const router = useRouter();
  const isDesktop = useIsDesktop();
  const [selectedTab, setTab] = useState<ProfileTab>('calls');
  const [editOpen, setEditOpen] = useState(false);
  // A stale "activity" selection (e.g. after resizing to desktop, where
  // that tab doesn't exist) falls back to Calls.
  const tab: ProfileTab = isDesktop && selectedTab === 'activity' ? 'calls' : selectedTab;

  const profile = useProfile(userId);
  const toggleFollow = useFollowToggle();
  const calls = useUserCalls(userId ?? 'me', tab === 'calls' && profile.status === 'success');
  const replies = useUserReplies(userId ?? 'me', tab === 'replies' && profile.status === 'success');
  const activity = useUserActivity(userId ?? 'me', tab === 'activity' && profile.status === 'success');

  const openAuthor = (id: string) => router.push(`/profile/${id}`);
  const openMarket = (marketId: string) => router.push(`/markets/${marketId}`);
  const openPost = (postId: string) => router.push(`/calls/${postId}`);

  if (profile.status === 'pending') {
    return (
      <main className="w-full px-4 pt-4">
        <LoadingState rows={3} />
      </main>
    );
  }

  const isNotFound = profile.status === 'error' && profile.error instanceof ApiRequestError && profile.error.status === 404;

  if (profile.status === 'error' && isNotFound) {
    return (
      <main className="w-full ">
        <EmptyState icon="person-outline" title="User not found" message="This profile may have been removed or the link is incorrect." />
      </main>
    );
  }

  if (profile.status === 'error') {
    return (
      <main className="w-full ">
        <ErrorState message="Unable to load profile." onRetry={() => profile.refetch()} />
      </main>
    );
  }

  const user = profile.data;

  const items: (FeedItem | CommentItem | ActivityItem)[] =
    tab === 'activity'
      ? (activity.data?.pages.flatMap((page) => page.items) ?? [])
      : tab === 'replies'
        ? (replies.data?.pages.flatMap((page) => page.items) ?? [])
        : (calls.data?.pages.flatMap((page) => page.items) ?? []);
  const activeStatus = tab === 'activity' ? activity.status : tab === 'replies' ? replies.status : calls.status;

  return (
    <main className="w-full lg:grid lg:grid-cols-[minmax(0,1fr)_340px] lg:items-start lg:gap-8">
      <div className="min-w-0">
      <div className="relative z-0 h-36 w-full overflow-hidden">
        {user.bannerUrl ? (
          // eslint-disable-next-line @next/next/no-img-element -- uploaded storage URL, not a bundled asset
          <img src={user.bannerUrl} alt="" className="h-full w-full object-cover" />
        ) : (
          <div className="h-full w-full bg-gradient-to-br from-accent-muted via-surface to-surface-elevated" />
        )}
      </div>

      <div className="flex items-start justify-between gap-3 px-4">
        <div className="relative z-10 -mt-12 rounded-full border-4 border-background bg-background">
          <Avatar uri={user.avatarUrl} fallbackLabel={user.displayName} size={96} />
        </div>
        {!user.isSelf ? (
          <Button
            label={user.isFollowing ? 'Following' : 'Follow'}
            variant={user.isFollowing ? 'secondary' : 'primary'}
            loading={toggleFollow.isPending}
            onClick={() => toggleFollow.mutate({ userId: user.id, following: user.isFollowing })}
            className="mt-12 lg:min-h-0 lg:px-4 lg:py-2"
          />
        ) : null}
      </div>

      <div className="px-4 pt-2">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <Text variant="title" className="block">
              {user.displayName}
            </Text>
            <Text variant="caption" color="textSecondary">
              @{user.handle}
            </Text>
          </div>
          {user.isSelf ? (
            <Button
              label="Edit Profile"
              variant="secondary"
              onClick={() => (isDesktop ? setEditOpen(true) : router.push('/profile/edit'))}
              className="mt-0.5 min-h-0 shrink-0 px-4 py-2"
            />
          ) : null}
        </div>
        <Text variant="body" color="textSecondary" className="mt-2 block">
          {user.bio ?? 'No bio yet.'}
        </Text>

        <div className="mt-3 flex gap-4 pb-4">
          <Link href={`/profile/${user.id}/following`} className="flex items-baseline gap-1">
            <Text variant="bodyStrong">{formatCompactNumber(user.followingCount)}</Text>
            <Text variant="caption" color="textSecondary">
              Following
            </Text>
          </Link>
          <Link href={`/profile/${user.id}/followers`} className="flex items-baseline gap-1">
            <Text variant="bodyStrong">{formatCompactNumber(user.followerCount)}</Text>
            <Text variant="caption" color="textSecondary">
              Followers
            </Text>
          </Link>
        </div>

        {user.isSelf ? (
          <Link href="/wallet" className="flex items-center gap-3 border-y border-border py-3 hover:opacity-90 lg:hidden">
            <Icon name="wallet-outline" color="accent" />
            <div className="flex-1">
              <Text variant="bodyStrong" className="block">
                Wallet &amp; Portfolio
              </Text>
              <Text variant="caption" color="textSecondary">
                Positions and PnL
              </Text>
            </div>
            <Icon name="chevron-forward" size={18} color="textTertiary" />
          </Link>
        ) : user.walletAddress ? (
          <div className="gap-1 border-y border-border py-3">
            <Text variant="caption" color="textSecondary" className="block">
              Wallet
            </Text>
            <WalletAddress address={user.walletAddress} />
          </div>
        ) : null}

      </div>

      <Divider />
      <TabRow options={isDesktop ? BASE_TAB_OPTIONS : MOBILE_TAB_OPTIONS} value={tab} onChange={setTab} />

      {activeStatus === 'pending' ? (
        <div className="px-4 pt-3">
          <LoadingState rows={3} />
        </div>
      ) : items.length === 0 ? (
        <EmptyState
          title={tab === 'replies' ? 'No replies yet' : tab === 'calls' ? 'No Calls yet' : 'No activity yet'}
          message={
            tab === 'replies'
              ? 'Comments this user has made on Calls will show up here.'
              : tab === 'calls'
                ? 'Position-backed Calls this user has published will show up here.'
                : 'Trades, Calls, and follows will show up here.'
          }
        />
      ) : tab === 'activity' ? (
        (items as ActivityItem[]).map((item) => (
          <ActivityRow key={item.id} item={item} onOpenPost={openPost} onOpenMarket={openMarket} onOpenUser={openAuthor} />
        ))
      ) : tab === 'replies' ? (
        (items as CommentItem[]).map((item) => <ProfileReplyRow key={item.id} item={item} onOpenPost={openPost} />)
      ) : (
        (items as FeedItem[]).map((item) => <CallCard key={item.id} item={item} />)
      )}
      </div>
      {isDesktop ? <EditProfileModal visible={editOpen} onClose={() => setEditOpen(false)} /> : null}
      <aside className="sticky top-20 hidden flex-col gap-4 lg:flex">
        <WhoToFollowPanel />
        <TrendingMarketsPanel />
      </aside>
    </main>
  );
}

function ProfileReplyRow({ item, onOpenPost }: { item: CommentItem; onOpenPost: (postId: string) => void }) {
  return (
    <button
      type="button"
      onClick={() => onOpenPost(item.postId)}
      className="block w-full border-b border-border px-4 py-3 text-left hover:bg-surface"
    >
      <div className="flex items-baseline justify-between gap-2">
        <Text variant="caption" color="textTertiary">
          Replying to a Call
        </Text>
        <Text variant="caption" color="textTertiary">
          {formatRelativeTime(item.createdAt)}
        </Text>
      </div>
      <Text variant="body" className="mt-0.5 block whitespace-pre-wrap">
        {item.body}
      </Text>
    </button>
  );
}
