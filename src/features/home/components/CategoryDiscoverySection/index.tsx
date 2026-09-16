import { Pressable, ScrollView, View } from 'react-native';
import { Text } from '@/components/ui/Text';
import { KNOWN_CATEGORIES } from '@/types/common';

export interface CategoryDiscoverySectionProps {
  onSelectCategory: (category: string) => void;
}

/**
 * Reuses the exact same taxonomy `MarketsScreen`/`SearchScreen` already
 * use (`KNOWN_CATEGORIES`) — no separate category list invented for
 * Home. Tapping a chip pushes the Markets tab pre-filtered to that
 * category, the same navigation `MarketsScreen` itself already reads
 * `route.params.category` to support.
 */
export function CategoryDiscoverySection({ onSelectCategory }: CategoryDiscoverySectionProps) {
  return (
    <View className="gap-2 py-2">
      <Text variant="bodyStrong" className="px-4">
        Explore Topics
      </Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} className="flex-grow-0">
        <View className="flex-row gap-2 px-4">
          {KNOWN_CATEGORIES.map((category) => (
            <Pressable
              key={category}
              onPress={() => onSelectCategory(category)}
              className="rounded-full border border-border px-4 py-2 active:opacity-70"
              accessibilityRole="button"
              accessibilityLabel={`Explore ${category} markets`}
            >
              <Text variant="caption">{category}</Text>
            </Pressable>
          ))}
        </View>
      </ScrollView>
    </View>
  );
}
