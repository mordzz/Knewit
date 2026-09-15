import { ScrollView, Pressable, View } from 'react-native';
import { Text } from '@/components/ui/Text';
import { KNOWN_CATEGORIES } from '@/types/common';
import { cn } from '@/utils/cn';

const TABS = ['Trending', ...KNOWN_CATEGORIES];

export interface CategoryTabsProps {
  value: string;
  onChange: (category: string) => void;
}

/** Horizontal category pills — Trending first (the default), then
 * Polymarket's own taxonomy (`KNOWN_CATEGORIES`, `types/common.ts`). */
export function CategoryTabs({ value, onChange }: CategoryTabsProps) {
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} className="flex-grow-0">
      <View className="flex-row gap-2 py-1">
        {TABS.map((tab) => {
          const active = tab === value;
          return (
            <Pressable
              key={tab}
              onPress={() => onChange(tab)}
              className={cn(
                'rounded-full border px-3 py-1.5',
                active ? 'border-accent bg-accent-muted' : 'border-border'
              )}
              accessibilityRole="tab"
              accessibilityState={{ selected: active }}
            >
              <Text variant="caption" color={active ? 'accent' : 'textSecondary'}>
                {tab}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </ScrollView>
  );
}
