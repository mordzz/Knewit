import { cn } from '@/lib/cn';
import { Text } from '@/components/ui/Text';

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

/** Web equivalent of `apps/mobile/src/components/ui/Badge`. */
export function Badge({ label, variant = 'neutral', className }: BadgeProps) {
  return (
    <div className={cn('inline-block self-start rounded-full px-2 py-1', containerClass[variant], className)}>
      <Text variant="micro" color={textColor[variant]}>
        {label}
      </Text>
    </div>
  );
}
