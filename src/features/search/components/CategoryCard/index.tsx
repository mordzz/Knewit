import { Pressable } from 'react-native';
import { GlassSurface } from '@/components/ui/GlassSurface';
import { Icon } from '@/components/ui/Icon';
import { Text } from '@/components/ui/Text';
import { getCategoryIcon } from '@/utils/categoryIcon';

export interface CategoryCardProps {
  category: string;
  onPress: () => void;
}

/** Category discovery tile — Search screen's empty-query state. */
export function CategoryCard({ category, onPress }: CategoryCardProps) {
  return (
    <Pressable onPress={onPress} className="flex-1 active:opacity-85">
      <GlassSurface contentClassName="items-center gap-2 py-6">
        <Icon name={getCategoryIcon(category)} size={26} color="accent" />
        <Text variant="bodyStrong">{category}</Text>
      </GlassSurface>
    </Pressable>
  );
}
