'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Text } from '@/components/ui/Text';
import { Icon } from '@/components/ui/Icon';
import { Avatar } from '@/components/ui/Avatar';
import { Button } from '@/components/ui/Button';
import { choiceTextColor, choiceTone } from '@/lib/choiceTone';
import { Divider } from '@/components/ui/Divider';
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
 * else's. Same header (avatar plus an "Edit Profile" button beside the
 * name for the viewer's own profile, or a Follow button), same
 * Wallet & Portfolio row, Trading Performance card, and Wallet Activity
 * (own live positions) section.
 */
export function ProfileView({ userId }: { userId?: string }) {
  const router = useRouter();
  const { user: privyUser } = usePrivy();
  const walletConnected = !!privyUser?.wallet?.address;
  const [tab, setTab] = useState<ProfileTab>('calls');

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
            className="mt-12"
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
              onClick={() => router.push('/profile/edit')}
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
          <Link href="/wallet" className="flex items-center gap-3 border-y border-border py-3 hover:opacity-90">
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

        {user.tradingVolume != null ? (
          <div className="gap-2 border-b border-border py-3">
            <Text variant="bodyStrong">Trading Performance</Text>
            <div className="mt-2 flex justify-between">
              <StatColumn label="Trading Volume" value={formatUsd(user.tradingVolume)} />
              <StatColumn label="Calls" value={String(user.callCount)} />
            </div>
          </div>
        ) : null}

        {user.isSelf && walletConnected && positions.status === 'success' && positions.data.length > 0 ? (
          <div className="gap-2 border-b border-border py-3">
            <Text variant="bodyStrong" className="block">
              Wallet Activity
            </Text>
            {positions.data.map((position) => (
              <div key={position.id} className="mt-2 flex items-center justify-between">
                <div className="min-w-0 flex-1">
                  <Text variant="caption" color={choiceTextColor(choiceTone({ index: position.choiceIndex, label: position.outcome }))} className="mb-0.5 block">
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
    </main>
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
