import { Screen } from '@/components/layout/Screen';
import { Text } from '@/components/ui/Text';
import { spacing } from '@/theme';

export function ProfileScreen() {
  return (
    <Screen style={{ paddingTop: spacing.lg, gap: spacing.xs }}>
      <Text variant="heading">Profile</Text>
      <Text variant="body" color="textSecondary">
        A user's own Calls, followers, and settings will live here.
      </Text>
    </Screen>
  );
}
