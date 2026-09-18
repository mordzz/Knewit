'use client';

import { useRouter } from 'next/navigation';
import { Text } from '@/components/ui/Text';
import { Button } from '@/components/ui/Button';
import { FollowListRow } from '@/components/FollowListRow';
import { LoadingState } from '@/components/feedback/LoadingState';
import { ErrorState } from '@/components/feedback/ErrorState';
import { useFollowSuggestions } from '@/hooks/useFollowSuggestions';

/**
 * Desktop-only right column â€” "Who to follow", the X-style counterpart
 * of the feed's right rail (docs/DECISIONS.md, "Right Rail: Follow
 * Suggestions on Tablet/Desktop"). Shown from `xl` up, the width where
 * the `max-w-[1265px]` frame has room left beside the 275px `SideNav`
 * and the 672px content column.
 *
 * Styled as the mirror of `SideNav` by request: the same 275px bare
 * column (no floating card), the same padding, and a heading block
 * closed by the same white divider â€” so both edges of the app read as
 * one layout (docs/DECISIONS.md, "Right Rail Mirrors the Sidebar; Yellow
 * Wordmark Logo").
 *
 * Every row is a real Knewit account (never a Polymarket trader â€” see
 * docs/DECISIONS.md, "Round 6"), reusing `FollowListRow` so the follow
 * button behaves exactly like the Followers/Following screens. Five per
 * page with an explicit "Show more"; an empty result is an honest empty
 * state, never filler.
 */
export function RightRail() {
  const router = useRouter();
  const suggestions = useFollowSuggestions();
  const items = suggestions.data?.pages.flatMap((page) => page.items) ?? [];

  return (
    <aside className="sticky top-0 hidden h-screen w-[275px] flex-shrink-0 flex-col overflow-y-auto py-4 xl:flex">
      <div className="mb-1 border-b border-white/30 px-4 pb-4">
        <Text variant="bodyStrong" className="block text-lg">
          Who to follow
        </Text>
      </div>

      {suggestions.isPending ? (
        <div className="px-4 pt-3">
          <LoadingState rows={3} />
        </div>
      ) : suggestions.isError ? (
        <ErrorState message="Couldn't load suggestions." onRetry={() => suggestions.refetch()} />
      ) : items.length === 0 ? (
        <Text variant="caption" color="textSecondary" className="block px-4 py-3">
          No suggestions yet â€” check back once more people join.
        </Text>
      ) : (
        <>
          {items.map((item) => (
            <FollowListRow
              key={item.user.id}
              item={item}
              onPress={() => router.push(`/profile/${item.user.id}`)}
            />
          ))}
          {suggestions.hasNextPage ? (
            <div className="px-4 pt-3">
              <Button
                label={suggestions.isFetchingNextPage ? 'Loading…' : 'Show more'}
                variant="secondary"
                loading={suggestions.isFetchingNextPage}
                onClick={() => suggestions.fetchNextPage()}
                className="min-h-0 w-full px-4 py-2"
              />
            </div>
          ) : null}
        </>
      )}
    </aside>
  );
}
