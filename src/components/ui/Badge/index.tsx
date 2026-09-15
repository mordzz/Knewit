import { View } from 'react-native';
import { Text } from '@/components/ui/Text';
import { cn } from '@/utils/cn';

export type BadgeVariant = 'yes' | 'no' | 'accent' | 'neutral';

const containerClass: Record<BadgeVariant, string> = {
  yes: 'bg-yes-muted',
  no: 'bg-no-muted',
  accent: 'bg-accent-muted',
  neutral: 'bg-surface-elevated',
};

const textColor: Record<BadgeVariant, 'yes' | 'no' | 'accent' | 'textSecondary'> = {
  yes: 'yes',
  no: 'no',
  accent: 'accent',
  neutral: 'textSecondary',
};

export interface BadgeProps {
  label: string;
  variant?: BadgeVariant;
  className?: string;
}

export function Badge({ label, variant = 'neutral', className }: BadgeProps) {
  return (
    <View className={cn('self-start rounded-full px-2 py-1', containerClass[variant], className)}>
      <Text variant="micro" color={textColor[variant]}>
        {label}
      </Text>
    </View>
  );
}
