import { useMutation, useQueryClient, InfiniteData } from '@tanstack/react-query';
import { followUser, unfollowUser } from '@/features/profile/services/userService';
import type { FollowListItem, UserProfile } from '@/types/social';
import type { LeaderboardPage } from '@/types/leaderboard';
import type { Paginated } from '@/types/common';

interface ToggleFollowInput {
  userId: string;
  following: boolean;
}

/**
 * Not optimistic, unlike `useToggleLike` — the spec calls out Like
 * specifically for optimism, and Follow appears in fewer, lower-frequency
 * places (an author header, not a scrollable feed of many rows), so a
 * plain mutate-then-reconcile is simple, correct, and not worth the
 * extra rollback complexity — see docs/DECISIONS.md.
 *
 * On success, patches every place this target user's follow state is
 * cached: their own `['profile', userId]` entry, any row for them
 * inside a currently-cached Followers/Following list (any owner —
 * TanStack's prefix matching finds every `['followers'/'following',
 * *]` entry), and any Leaderboard row (`['leaderboard', *]`, both
 * scopes) — the same user can legitimately appear in all of these at
 * once, and the spec requires Follow state to stay consistent
 * everywhere it's shown. This is the single, shared place that logic
 * lives — callers (`AuthorRow`, `UserProfileScreen`... now unified into
 * `ProfileScreen`, `FollowListRow`, `LeaderboardUserCard`) never each
 * re-implement their own cache patch.
 */
export function useFollowToggle() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ userId, following }: ToggleFollowInput) =>
      following ? unfollowUser(userId) : followUser(userId),
    onSuccess: (result, { userId }) => {
      queryClient.setQueryData<UserProfile>(['profile', userId], (previous) =>
        previous
          ? { ...previous, isFollowing: result.following, followerCount: result.followerCount }
          : previous
      );

      const patchList = (data: InfiniteData<Paginated<FollowListItem>> | undefined) => {
        if (!data) return data;
        return {
          ...data,
          pages: data.pages.map((page) => ({
            ...page,
            items: page.items.map((item) =>
              item.user.id === userId ? { ...item, isFollowing: result.following } : item
            ),
          })),
        };
      };
      queryClient.setQueriesData<InfiniteData<Paginated<FollowListItem>>>(
        { queryKey: ['followers'] },
        patchList
      );
      queryClient.setQueriesData<InfiniteData<Paginated<FollowListItem>>>(
        { queryKey: ['following'] },
        patchList
      );

      queryClient.setQueriesData<InfiniteData<LeaderboardPage>>(
        { queryKey: ['leaderboard'] },
        (data) => {
          if (!data) return data;
          return {
            ...data,
            pages: data.pages.map((page) => ({
              ...page,
              items: page.items.map((item) =>
                item.user.id === userId ? { ...item, isFollowing: result.following } : item
              ),
            })),
          };
        }
      );
    },
  });
}
