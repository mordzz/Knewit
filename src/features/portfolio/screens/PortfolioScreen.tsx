import { Screen } from '@/components/layout/Screen';
import { Text } from '@/components/ui/Text';
import { spacing } from '@/theme';

export function PortfolioScreen() {
  return (
    <Screen style={{ paddingTop: spacing.lg, gap: spacing.xs }}>
      <Text variant="heading">Portfolio</Text>
      <Text variant="body" color="textSecondary">
        Positions, live PnL, and wallet balance will live here.
      </Text>
    </Screen>
  );
}
