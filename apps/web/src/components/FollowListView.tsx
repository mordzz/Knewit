'use client';

import { useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useInfiniteQuery } from '@tanstack/react-query';
import { Text } from '@/components/ui/Text';
import { Icon } from '@/components/ui/Icon';
import { LoadingState } from '@/components/feedback/LoadingState';
import { EmptyState } from '@/components/feedback/EmptyState';
import { ErrorState } from '@/components/feedback/ErrorState';
import { FollowListRow } from '@/components/FollowListRow';
import { getFollowers, getFollowing } from '@/lib/userService';

/**
 * Direct conversion of `apps/mobile`'s `FollowersScreen`/`FollowingScreen`
 * — same back-button + title header, same `FollowListRow`, same
 * infinite scroll. Mobile keeps these as two near-identical files; this
 * stays one component parameterized by `kind`, matching the web
 * project's own established convention for this pair.
 */
export function FollowListView({ userId, kind }: { userId: string; kind: 'followers' | 'following' }) {
  const router = useRouter();
  const list = useInfiniteQuery({
    queryKey: [kind, userId],
    queryFn: ({ pageParam }) => (kind === 'followers' ? getFollowers(userId, pageParam) : getFollowing(userId, pageParam)),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage) => lastPage.nextCursor ?? undefined,
  });

  const items = list.data?.pages.flatMap((page) => page.items) ?? [];
  const title = kind === 'followers' ? 'Followers' : 'Following';

  return (
    <main className="w-full pt-4 lg:mx-auto lg:max-w-3xl">
      <div className="flex items-center px-4 pb-2">
        <button type="button" onClick={() => router.back()} aria-label="Go back">
          <Icon name="chevron-back" size={24} />
        </button>
        <Text variant="heading" className="ml-2">
          {title}
        </Text>
      </div>

      {list.status === 'pending' ? (
        <div className="px-4">
          <LoadingState rows={5} />
        </div>
      ) : list.status === 'error' ? (
        <div className="px-4">
          <ErrorState message={`Unable to load ${kind}.`} onRetry={() => list.refetch()} />
        </div>
      ) : items.length === 0 ? (
        <EmptyState icon="person-outline" title={kind === 'followers' ? 'No followers yet.' : 'Not following anyone yet.'} />
      ) : (
        <>
          {items.map((item) => (
            <FollowListRow
              key={item.user.id}
              item={item}
              onPress={() => router.push(item.isSelf ? '/profile' : `/profile/${item.user.id}`)}
            />
          ))}
          <InfiniteScrollSentinel
            hasNextPage={!!list.hasNextPage}
            isFetchingNextPage={list.isFetchingNextPage}
            onLoadMore={() => list.fetchNextPage()}
          />
        </>
      )}
    </main>
  );
}

function InfiniteScrollSentinel({
  hasNextPage,
  isFetchingNextPage,
  onLoadMore,
}: {
  hasNextPage: boolean;
  isFetchingNextPage: boolean;
  onLoadMore: () => void;
}) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const node = ref.current;
    if (!node || !hasNextPage) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting && !isFetchingNextPage) {
          onLoadMore();
        }
      },
      { rootMargin: '400px' }
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, [hasNextPage, isFetchingNextPage, onLoadMore]);

  if (!hasNextPage) return null;

  return (
    <div ref={ref} className="py-4">
      {isFetchingNextPage ? (
        <div className="mx-auto h-5 w-5 animate-spin rounded-full border-2 border-text-secondary border-t-transparent" />
      ) : null}
    </div>
  );
}
