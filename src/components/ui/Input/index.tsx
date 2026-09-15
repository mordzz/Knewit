import { TextInput, TextInputProps, View } from 'react-native';
import { colors } from '@/theme';
import { Text } from '@/components/ui/Text';
import { cn } from '@/utils/cn';

export interface InputProps extends TextInputProps {
  label?: string;
  error?: string;
}

export function Input({ label, error, className, ...rest }: InputProps) {
  return (
    <View className="gap-1">
      {label ? (
        <Text variant="caption" color="textSecondary" className="ml-1">
          {label}
        </Text>
      ) : null}
      <TextInput
        className={cn(
          'min-h-12 rounded-md border border-border bg-surface-elevated px-3 py-3 text-body text-text-primary',
          error && 'border-danger',
          className
        )}
        placeholderTextColor={colors.textTertiary}
        accessibilityLabel={label}
        {...rest}
      />
      {error ? (
        <Text variant="caption" color="danger" className="ml-1">
          {error}
        </Text>
      ) : null}
    </View>
  );
}
