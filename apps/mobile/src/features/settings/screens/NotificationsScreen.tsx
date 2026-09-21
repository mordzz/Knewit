import { useState } from 'react';
import { Linking, Pressable, Switch, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Screen } from '@/components/layout/Screen';
import { Icon } from '@/components/ui/Icon';
import { Text } from '@/components/ui/Text';
import { colors, solidPanel } from '@/theme';

export function NotificationsScreen() {
  const navigation = useNavigation();
  const [enabled, setEnabled] = useState(false);

  return (
    <Screen contentContainerClassName="gap-6 px-4 pb-10 pt-5">
      <View className="flex-row items-center gap-3">
        <Pressable onPress={() => navigation.goBack()} hitSlop={8} accessibilityLabel="Back">
          <Icon name="chevron-back" />
        </Pressable>
        <Text variant="heading">Notifications</Text>
      </View>

      <View style={[solidPanel, { borderRadius: 16 }]} className="gap-4 p-4">
        <View className="flex-row items-center gap-3">
          <Icon name="notifications-outline" color="accent" />
          <View className="flex-1 gap-1">
            <Text variant="bodyStrong">Allow notifications</Text>
            <Text variant="caption" color="textSecondary">
              You can turn Knewit notifications on or off at any time.
            </Text>
          </View>
          <Switch
            value={enabled}
            onValueChange={setEnabled}
            trackColor={{ false: colors.surfaceElevated, true: colors.accentMuted }}
            thumbColor={enabled ? colors.accent : colors.textTertiary}
            accessibilityLabel="Allow notifications"
          />
        </View>
        <Text variant="caption" color="textTertiary">
          {enabled
            ? 'Notifications are enabled for this device. You can disable them here or in your device settings.'
            : 'Notifications are disabled. Enable this setting to allow Knewit to notify you about account activity.'}
        </Text>
        <Pressable
          onPress={() => Linking.openSettings()}
          className="flex-row items-center gap-2 py-2"
          accessibilityRole="button"
        >
          <Text variant="caption" color="accent">
            Open device settings
          </Text>
          <Icon name="chevron-forward" size={16} color="accent" />
        </Pressable>
      </View>
    </Screen>
  );
}
