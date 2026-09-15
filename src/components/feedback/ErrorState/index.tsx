import { View } from 'react-native';
import { Text } from '@/components/ui/Text';
import { Icon } from '@/components/ui/Icon';
import { Button } from '@/components/ui/Button';

export interface ErrorStateProps {
  message?: string;
  onRetry?: () => void;
}

export function ErrorState({
  message = 'Something went wrong. Try again.',
  onRetry,
}: ErrorStateProps) {
  return (
    <View className="items-center justify-center gap-1 px-6 py-12" accessibilityRole="alert">
      <Icon name="alert-circle-outline" size={32} color="danger" />
      <Text variant="bodyStrong" className="mt-2 text-center">
        {message}
      </Text>
      {onRetry ? (
        <Button label="Retry" variant="secondary" onPress={onRetry} className="mt-4" />
      ) : null}
    </View>
  );
}
