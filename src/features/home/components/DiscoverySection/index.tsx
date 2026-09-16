import { ScrollView, View } from 'react-native';
import { Text } from '@/components/ui/Text';
import { Skeleton } from '@/components/ui/Skeleton';
import { Button } from '@/components/ui/Button';

export interface DiscoverySectionProps {
  title: string;
  status: 'pending' | 'error' | 'success';
  isEmpty: boolean;
  emptyMessage: string;
  onRetry: () => void;
  cardWidth: number;
  children: React.ReactNode;
}

/**
 * Shared shell for Home's horizontal discovery strips (Trending Calls,
 * Trending Markets, Closing Soon) — heading + loading skeleton/error/
 * empty/content states, so each strip doesn't re-implement the same
 * four-state boilerplate. Errors here are shown compactly (a line of
 * text + a small retry button), not a full-screen `ErrorState` — these
 * are secondary discovery surfaces below Home's own primary feed, which
 * already has its own full error treatment; a failed decorative strip
 * shouldn't dominate the screen.
 */
export function DiscoverySection({
  title,
  status,
  isEmpty,
  emptyMessage,
  onRetry,
  cardWidth,
  children,
}: DiscoverySectionProps) {
  return (
    <View className="gap-2 py-2">
      <Text variant="bodyStrong" className="px-4">
        {title}
      </Text>

      {status === 'pending' ? (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} className="flex-grow-0">
          <View className="flex-row gap-3 px-4">
            {[0, 1, 2].map((key) => (
              <Skeleton key={key} width={cardWidth} height={120} className="rounded-xl" />
            ))}
          </View>
        </ScrollView>
      ) : status === 'error' ? (
        <View className="flex-row items-center gap-3 px-4">
          <Text variant="caption" color="textSecondary">
            Couldn&apos;t load {title.toLowerCase()}.
          </Text>
          <Button label="Try again" variant="ghost" onPress={onRetry} />
        </View>
      ) : isEmpty ? (
        <Text variant="caption" color="textSecondary" className="px-4">
          {emptyMessage}
        </Text>
      ) : (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} className="flex-grow-0">
          <View className="flex-row gap-3 px-4">{children}</View>
        </ScrollView>
      )}
    </View>
  );
}
