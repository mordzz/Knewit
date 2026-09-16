import { Pressable, View } from 'react-native';
import { Text } from '@/components/ui/Text';
import { Icon } from '@/components/ui/Icon';
import { BottomSheet } from '@/components/ui/BottomSheet';

export interface CreateChoiceSheetProps {
  visible: boolean;
  onClose: () => void;
  onSelect: (intent: 'post' | 'call') => void;
}

/**
 * The FAB's landing choice — Post or Call. Both open the same composer
 * (`CreateCallScreen`); `intent` only changes its default emphasis, since
 * a Post and a Call are the same content model underneath (see
 * docs/SOCIAL-FEATURE.md).
 */
export function CreateChoiceSheet({ visible, onClose, onSelect }: CreateChoiceSheetProps) {
  return (
    <BottomSheet visible={visible} onClose={onClose}>
      <View className="gap-3">
        <Text variant="heading">Create</Text>
        <ChoiceRow
          icon="chatbubble-outline"
          title="Post"
          description="Share something with the community"
          onPress={() => onSelect('post')}
        />
        <ChoiceRow
          icon="trending-up-outline"
          title="Call"
          description="Share a market position"
          onPress={() => onSelect('call')}
        />
      </View>
    </BottomSheet>
  );
}

function ChoiceRow({
  icon,
  title,
  description,
  onPress,
}: {
  icon: 'chatbubble-outline' | 'trending-up-outline';
  title: string;
  description: string;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      className="flex-row items-center gap-3 rounded-xl border border-border p-3 active:opacity-90"
      accessibilityRole="button"
      accessibilityLabel={`${title}: ${description}`}
    >
      <View className="h-10 w-10 items-center justify-center rounded-full bg-surface-elevated">
        <Icon name={icon} color="accent" />
      </View>
      <View className="flex-1">
        <Text variant="bodyStrong">{title}</Text>
        <Text variant="caption" color="textSecondary">
          {description}
        </Text>
      </View>
      <Icon name="chevron-forward" size={18} color="textTertiary" />
    </Pressable>
  );
}
