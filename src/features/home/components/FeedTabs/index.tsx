import { View, Pressable } from 'react-native';
import { Text } from '@/components/ui/Text';
import { cn } from '@/utils/cn';

export type FeedTabKey = 'trending' | 'following';

const TABS: { key: FeedTabKey; label: string }[] = [
  { key: 'trending', label: 'Trending' },
  { key: 'following', label: 'Following' },
];

export interface FeedTabsProps {
  value: FeedTabKey;
  onChange: (key: FeedTabKey) => void;
}

/**
 * X's own top segmented control shape, with this product's own tab set
 * (no "For You" — Trending is the default/primary feed). Only "Trending"
 * has real (mock-fallback) data behind it — "Following" renders an
 * honest "not yet" state, since there's no follow graph to back it yet —
 * see docs/DECISIONS.md.
 */
export function FeedTabs({ value, onChange }: FeedTabsProps) {
  return (
    <View className="flex-row border-b border-border" accessibilityRole="tablist">
      {TABS.map((tab) => {
        const active = tab.key === value;
        return (
          <Pressable
            key={tab.key}
            onPress={() => onChange(tab.key)}
            className={cn(
              'flex-1 items-center border-b-2 py-3',
              active ? 'border-text-primary' : 'border-transparent'
            )}
            accessibilityRole="tab"
            accessibilityState={{ selected: active }}
          >
            <Text variant="bodyStrong" color={active ? 'textPrimary' : 'textTertiary'}>
              {tab.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}
