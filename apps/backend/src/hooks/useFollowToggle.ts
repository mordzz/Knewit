import { useMutation, useQueryClient, type InfiniteData } from '@tanstack/react-query';
import { followUser, unfollowUser } from '@/lib/userService';
import type { FollowListItem, UserProfile } from '@/types/social';
import type { Paginated } from '@/types/common';

interface ToggleFollowInput {
  userId: string;
  following: boolean;
}

/**
 * Web equivalent of `apps/mobile/src/features/profile/hooks/useFollowToggle.ts`
 * — plain mutate-then-reconcile (not optimistic, unlike `useToggleLike`).
 * On success, patches every place this target user's follow state is
 * cached: their own `['profile', userId]` entry and any row for them in
 * a cached Followers/Following list. No leaderboard patch — a
 * leaderboard row is a Polymarket trader with no follow state
 * (docs/DECISIONS.md, "Round 6").
 */
export function useFollowToggle() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ userId, following }: ToggleFollowInput) => (following ? unfollowUser(userId) : followUser(userId)),
    onSuccess: (result, { userId }) => {
      queryClient.setQueryData<UserProfile>(['profile', userId], (previous) =>
        previous ? { ...previous, isFollowing: result.following, followerCount: result.followerCount } : previous
      );

      const patchList = (data: InfiniteData<Paginated<FollowListItem>> | undefined) => {
        if (!data) return data;
        return {
          ...data,
          pages: data.pages.map((page) => ({
            ...page,
            items: page.items.map((item) => (item.user.id === userId ? { ...item, isFollowing: result.following } : item)),
          })),
        };
      };
      queryClient.setQueriesData<InfiniteData<Paginated<FollowListItem>>>({ queryKey: ['followers'] }, patchList);
      queryClient.setQueriesData<InfiniteData<Paginated<FollowListItem>>>({ queryKey: ['following'] }, patchList);

      // The right rail's suggestions are "accounts you don't follow yet"
      // — refetch so a newly followed account leaves the list (and the
      // next ones fill in).
      queryClient.invalidateQueries({ queryKey: ['follow-suggestions'] });
    },
  });
}
