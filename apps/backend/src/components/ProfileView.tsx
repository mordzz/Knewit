'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Text } from '@/components/ui/Text';
import { Icon } from '@/components/ui/Icon';
import { Avatar } from '@/components/ui/Avatar';
import { Button } from '@/components/ui/Button';
import { Divider } from '@/components/ui/Divider';
import { BottomSheet } from '@/components/ui/BottomSheet';
import { TabRow, type TabRowOption } from '@/components/ui/TabRow';
import { LoadingState } from '@/components/feedback/LoadingState';
import { EmptyState } from '@/components/feedback/EmptyState';
import { ErrorState } from '@/components/feedback/ErrorState';
import { CallCard } from '@/components/CallCard';
import { ActivityRow } from '@/components/ActivityRow';
import { WalletAddress } from '@/components/WalletAddress';
import { useProfile } from '@/hooks/useProfile';
import { useFollowToggle } from '@/hooks/useFollowToggle';
import { useUserCalls } from '@/hooks/useUserCalls';
import { useUserReplies } from '@/hooks/useUserReplies';
import { useUserActivity } from '@/hooks/useUserActivity';
import { usePositions } from '@/hooks/usePositions';
import { usePrivy } from '@privy-io/react-auth';
import { ApiRequestError } from '@/lib/apiClient';
import { formatCompactNumber, formatUsd, formatPrice, formatRelativeTime } from '@/lib/formatters';
import type { CommentItem, FeedItem } from '@/types/social';
import type { ActivityItem } from '@/types/activity';

type ProfileTab = 'calls' | 'replies' | 'activity';

const PROFILE_TAB_OPTIONS: TabRowOption<ProfileTab>[] = [
  { key: 'calls', label: 'Calls' },
  { key: 'replies', label: 'Replies' },
  { key: 'activity', label: 'Activity' },
];

/**
 * Direct conversion of `apps/mobile`'s `ProfileScreen` — the one
 * Profile route/screen for both the viewer's own profile and anyone
 * else's. Same header (avatar + Settings gear opening a sheet with Edit
 * Profile/Wallet, or a Follow button), same Wallet/Portfolio rows,
 * Trading Performance card, Leaderboard Rank row, and Wallet Activity
 * (own live positions) section — all previously missing from the web
 * port, now present.
 */
export function ProfileView({ userId }: { userId?: string }) {
  const router = useRouter();
  const { user: privyUser } = usePrivy();
  const walletConnected = !!privyUser?.wallet?.address;
  const [tab, setTab] = useState<ProfileTab>('calls');
  const [settingsVisible, setSettingsVisible] = useState(false);

  const profile = useProfile(userId);
  const toggleFollow = useFollowToggle();
  const calls = useUserCalls(userId ?? 'me', tab === 'calls' && profile.status === 'success');
  const replies = useUserReplies(userId ?? 'me', tab === 'replies' && profile.status === 'success');
  const activity = useUserActivity(userId ?? 'me', tab === 'activity' && profile.status === 'success');
  const positions = usePositions();

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
      <main className="w-full">
        <EmptyState icon="person-outline" title="User not found" message="This profile may have been removed or the link is incorrect." />
      </main>
    );
  }

  if (profile.status === 'error') {
    return (
      <main className="w-full">
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
    <main className="w-full">
      <div className="flex items-start justify-between gap-3 px-4 pb-3 pt-4">
        <Avatar uri={user.avatarUrl} fallbackLabel={user.displayName} size={64} />
        {user.isSelf ? (
          <button
            type="button"
            onClick={() => setSettingsVisible(true)}
            aria-label="Settings"
            className="mt-1 flex h-10 w-10 items-center justify-center rounded-full border border-border"
          >
            <Icon name="settings-outline" size={20} color="textSecondary" />
          </button>
        ) : (
          <Button
            label={user.isFollowing ? 'Following' : 'Follow'}
            variant={user.isFollowing ? 'secondary' : 'primary'}
            loading={toggleFollow.isPending}
            onClick={() => toggleFollow.mutate({ userId: user.id, following: user.isFollowing })}
            className="mt-1"
          />
        )}
      </div>

      <div className="px-4">
        <Text variant="title" className="block">
          {user.displayName}
        </Text>
        <Text variant="caption" color="textSecondary">
          @{user.handle}
        </Text>
        <Text variant="body" color="textSecondary" className="mt-2 block">
          {user.bio ?? 'No bio yet.'}
        </Text>

        <div className="mt-3 flex gap-4">
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
          <Link href="/wallet" className="flex items-center gap-3 border-b border-border py-3 hover:opacity-90">
            <Icon name="wallet-outline" color="accent" />
            <div className="flex-1">
              <Text variant="bodyStrong" className="block">
                Wallet
              </Text>
              <Text variant="caption" color="textSecondary">
                Connection status and wallet address
              </Text>
            </div>
            <Icon name="chevron-forward" size={18} color="textTertiary" />
          </Link>
        ) : user.walletAddress ? (
          <div className="gap-1 border-b border-border py-3">
            <Text variant="caption" color="textSecondary" className="block">
              Wallet
            </Text>
            <WalletAddress address={user.walletAddress} />
          </div>
        ) : null}

        {user.isSelf ? (
          <Link href="/portfolio" className="flex items-center gap-3 border-b border-border py-3 hover:opacity-90">
            <Icon name="trending-up-outline" color="accent" />
            <div className="flex-1">
              <Text variant="bodyStrong" className="block">
                Portfolio
              </Text>
              <Text variant="caption" color="textSecondary">
                Your open positions
              </Text>
            </div>
            <Icon name="chevron-forward" size={18} color="textTertiary" />
          </Link>
        ) : null}

        {user.tradingVolume != null ? (
          <div className="gap-2 border-b border-border py-3">
            <Text variant="bodyStrong">Trading Performance</Text>
            <div className="mt-2 flex justify-between">
              <StatColumn label="Trading Volume" value={formatUsd(user.tradingVolume)} />
              <StatColumn label="Calls" value={String(user.callCount)} />
              <StatColumn label="Posts" value={String(user.postCount)} />
            </div>
          </div>
        ) : null}

        {user.leaderboardRank != null ? (
          <Link
            href="/leaderboard"
            className="flex items-center justify-between border-b border-border py-3 hover:opacity-90"
          >
            <Text variant="bodyStrong">Leaderboard Rank</Text>
            <Text variant="bodyStrong" color="accent">
              #{user.leaderboardRank}
            </Text>
          </Link>
        ) : null}

        {user.isSelf && walletConnected && positions.status === 'success' && positions.data.length > 0 ? (
          <div className="gap-2 border-b border-border py-3">
            <Text variant="bodyStrong" className="block">
              Wallet Activity
            </Text>
            {positions.data.map((position) => (
              <div key={position.id} className="mt-2 flex items-center justify-between">
                <div className="min-w-0 flex-1">
                  <Text variant="caption" color={position.outcome === 'YES' ? 'yes' : 'no'} className="mb-0.5 block">
                    {position.outcome}
                  </Text>
                  <Text variant="caption" numberOfLines={1}>
                    {position.marketQuestion}
                  </Text>
                </div>
                <div className="flex-shrink-0 text-right">
                  <Text variant="caption" className="block">
                    {formatUsd((position.entryPrice / 100) * position.size)}
                  </Text>
                  <Text variant="micro" color="textTertiary">
                    Entry {formatPrice(position.entryPrice)}
                  </Text>
                </div>
              </div>
            ))}
          </div>
        ) : null}
      </div>

      <Divider />
      <TabRow options={PROFILE_TAB_OPTIONS} value={tab} onChange={setTab} />

      {activeStatus === 'pending' ? (
        <div className="px-4 pt-3">
          <LoadingState rows={3} />
        </div>
      ) : items.length === 0 ? (
        <EmptyState
          title={tab === 'replies' ? 'No replies yet' : tab === 'calls' ? 'No Calls yet' : 'No activity yet'}
          message={
            tab === 'replies'
              ? 'Comments this user has made on Posts and Calls will show up here.'
              : tab === 'calls'
                ? 'Position-backed Calls this user has published will show up here.'
                : 'Trades, Calls, Posts, and follows will show up here.'
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

      <BottomSheet visible={settingsVisible} onClose={() => setSettingsVisible(false)}>
        <div className="flex flex-col gap-3">
          <Text variant="heading">Settings</Text>
          <SettingsRow icon="person-outline" label="Edit Profile" onPress={() => router.push('/profile/edit')} />
          <SettingsRow icon="wallet-outline" label="Wallet" onPress={() => router.push('/wallet')} />
        </div>
      </BottomSheet>
    </main>
  );
}

function SettingsRow({ icon, label, onPress }: { icon: 'person-outline' | 'wallet-outline'; label: string; onPress: () => void }) {
  return (
    <button
      type="button"
      onClick={onPress}
      className="flex w-full items-center gap-3 rounded-xl border border-border p-3 text-left hover:opacity-90"
    >
      <Icon name={icon} color="accent" />
      <Text variant="bodyStrong" className="flex-1">
        {label}
      </Text>
      <Icon name="chevron-forward" size={18} color="textTertiary" />
    </button>
  );
}

function StatColumn({ label, value }: { label: string; value: string }) {
  return (
    <div className="text-center">
      <Text variant="bodyStrong" className="block">
        {value}
      </Text>
      <Text variant="micro" color="textTertiary">
        {label}
      </Text>
    </div>
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
          Replying to a post
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
