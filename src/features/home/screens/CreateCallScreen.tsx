import { View } from 'react-native';
import { Screen } from '@/components/layout/Screen';
import { Text } from '@/components/ui/Text';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Icon } from '@/components/ui/Icon';

/**
 * Composer foundation only. Real position-attachment (the snapshot flow
 * in docs/SOCIAL-FEATURE.md) and publishing require the backend and a
 * connected wallet — neither exists yet, so Publish is disabled here.
 */
export function CreateCallScreen() {
  return (
    <Screen className="gap-3 pt-4">
      <Text variant="heading">Create a Call</Text>

      <Input
        placeholder="What's your prediction?"
        multiline
        numberOfLines={4}
        className="min-h-24"
        style={{ textAlignVertical: 'top' }}
      />

      <Card contentClassName="flex-row items-center gap-3">
        <Icon name="trending-up-outline" color="textTertiary" />
        <View className="flex-1 gap-0.5">
          <Text variant="bodyStrong">No position attached</Text>
          <Text variant="caption" color="textSecondary">
            Attach a market position to earn a Verified badge
          </Text>
        </View>
      </Card>

      <Button label="Select a Market" variant="secondary" disabled />
      <Button label="Publish" disabled className="mt-1" />
    </Screen>
  );
}
