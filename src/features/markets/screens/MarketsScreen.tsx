import { Screen } from '@/components/layout/Screen';
import { Text } from '@/components/ui/Text';
import { spacing } from '@/theme';

export function MarketsScreen() {
  return (
    <Screen style={{ paddingTop: spacing.lg, gap: spacing.xs }}>
      <Text variant="heading">Markets</Text>
      <Text variant="body" color="textSecondary">
        Search, category filters, and the market list will live here.
      </Text>
    </Screen>
  );
}
