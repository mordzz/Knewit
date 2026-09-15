import { View } from 'react-native';
import { Text } from '@/components/ui/Text';
import { Icon, IconName } from '@/components/ui/Icon';
import { Button } from '@/components/ui/Button';

export interface EmptyStateProps {
  icon?: IconName;
  title: string;
  message?: string;
  actionLabel?: string;
  onAction?: () => void;
}

export function EmptyState({
  icon = 'search',
  title,
  message,
  actionLabel,
  onAction,
}: EmptyStateProps) {
  return (
    <View className="items-center justify-center gap-1 px-6 py-12" accessibilityRole="text">
      <Icon name={icon} size={32} color="textTertiary" />
      <Text variant="bodyStrong" className="mt-2 text-center">
        {title}
      </Text>
      {message ? (
        <Text variant="caption" color="textSecondary" className="text-center">
          {message}
        </Text>
      ) : null}
      {actionLabel && onAction ? (
        <Button label={actionLabel} variant="secondary" onPress={onAction} className="mt-4" />
      ) : null}
    </View>
  );
}
