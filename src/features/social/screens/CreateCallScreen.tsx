import { Screen } from '@/components/layout/Screen';
import { Text } from '@/components/ui/Text';
import { spacing } from '@/theme';

export function CreateCallScreen() {
  return (
    <Screen style={{ paddingTop: spacing.lg, gap: spacing.xs }}>
      <Text variant="heading">Create a Call</Text>
      <Text variant="body" color="textSecondary">
        Composing a position-backed Call or a normal post will live here — see
        docs/SOCIAL-FEATURE.md.
      </Text>
    </Screen>
  );
}
