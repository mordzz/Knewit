import type { ButtonHTMLAttributes, ReactNode } from 'react';
import { cn } from '@/lib/cn';
import { Text } from '@/components/ui/Text';
import { Icon, type IconName } from '@/components/ui/Icon';

export type ButtonVariant = 'primary' | 'yes' | 'no' | 'secondary' | 'ghost';

export interface ButtonProps extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'color'> {
  label: string;
  variant?: ButtonVariant;
  loading?: boolean;
  icon?: IconName;
  iconElement?: ReactNode;
}

const containerClass: Record<ButtonVariant, string> = {
  primary: 'bg-accent',
  yes: 'bg-yes',
  no: 'bg-no',
  secondary: 'bg-surface-elevated',
  ghost: 'bg-transparent border border-border',
};

// `accent` is the brand yellow  white text on it is a legibility
// problem, so primary uses the same dark inverse label as yes/no's own
// bright backgrounds, not the default light-on-dark text.
const labelColor: Record<ButtonVariant, 'textPrimary' | 'textInverse' | 'textSecondary'> = {
  primary: 'textInverse',
  yes: 'textInverse',
  no: 'textPrimary',
  secondary: 'textPrimary',
  ghost: 'textSecondary',
};

/**
 * Web equivalent of `apps/mobile/src/components/ui/Button`  same five
 * variants, same solid/glossy (not glass) fill, same border + shadow
 * glow tinted with the variant's own identity color.
 */
export function Button({
  label,
  variant = 'primary',
  loading,
  disabled,
  className,
  icon,
  iconElement,
  ...rest
}: ButtonProps) {
  const isInactive = disabled || loading;

  return (
    <button
      type="button"
      disabled={isInactive}
      className={cn(
        'flex min-h-12 items-center justify-center gap-2 rounded-md border border-white/[0.16] px-6 py-3 shadow-md transition-opacity',
        containerClass[variant],
        isInactive ? 'opacity-50' : 'hover:opacity-85',
        className
      )}
      {...rest}
    >
      {loading ? (
        <span className="h-5 w-5 animate-spin rounded-full border-2 border-current border-t-transparent" />
      ) : (
        <>
          {iconElement ?? (icon ? <Icon name={icon} size={18} color={labelColor[variant]} /> : null)}
          <Text variant="bodyStrong" color={labelColor[variant]}>
            {label}
          </Text>
        </>
      )}
    </button>
  );
}
