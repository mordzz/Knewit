import { Screen } from '@/components/layout/Screen';
import { Text } from '@/components/ui/Text';
import { spacing } from '@/theme';

export function HomeScreen() {
  return (
    <Screen style={{ paddingTop: spacing.lg, gap: spacing.xs }}>
      <Text variant="heading">Home</Text>
      <Text variant="body" color="textSecondary">
        Trending Calls and featured markets will live here — see docs/PRODUCT-FLOW.md.
      </Text>
    </Screen>
  );
}
