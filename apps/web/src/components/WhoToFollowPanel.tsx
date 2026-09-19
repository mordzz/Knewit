'use client';

import { useRouter } from 'next/navigation';
import { Text } from '@/components/ui/Text';
import { CARD_SURFACE_CLASS } from '@/components/ui/cardSurface';
import { FollowListRow } from '@/components/FollowListRow';
import { useFollowSuggestions } from '@/hooks/useFollowSuggestions';
import { useSession } from '@/hooks/useSession';

/** Desktop right-rail card: accounts the viewer doesn't follow yet. */
export function WhoToFollowPanel() {
  const router = useRouter();
  const { canUseApp } = useSession();
  const suggestions = useFollowSuggestions(canUseApp);

  if (!canUseApp || suggestions.status !== 'success' || suggestions.data.items.length === 0) return null;

  return (
    <section className={CARD_SURFACE_CLASS} aria-label="Who to follow">
      <Text variant="bodyStrong" className="block px-4 pb-1 pt-4">
        Who to follow
      </Text>
      <div className="[&>div:last-child]:border-b-0">
        {suggestions.data.items.map((item) => (
          <FollowListRow key={item.user.id} item={item} onPress={() => router.push(`/profile/${item.user.id}`)} />
        ))}
      </div>
    </section>
  );
}
