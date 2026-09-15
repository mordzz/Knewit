import { Pressable, PressableProps, ActivityIndicator, StyleProp, ViewStyle } from 'react-native';
import { colors } from '@/theme';
import { Text } from '@/components/ui/Text';
import { cn } from '@/utils/cn';

export type ButtonVariant = 'primary' | 'yes' | 'no' | 'secondary' | 'ghost';

export interface ButtonProps extends Omit<PressableProps, 'style'> {
  label: string;
  variant?: ButtonVariant;
  loading?: boolean;
  style?: StyleProp<ViewStyle>;
}

const containerClass: Record<ButtonVariant, string> = {
  primary: 'bg-accent',
  yes: 'bg-yes',
  no: 'bg-no',
  secondary: 'bg-surface-elevated',
  ghost: 'bg-transparent border border-border',
};

// `accent` is the brand yellow (matches the app icon) — white text on it
// is a legibility problem, so primary uses the same dark inverse label
// as yes/no's own bright backgrounds, not the default light-on-dark text.
const labelColor: Record<ButtonVariant, 'textPrimary' | 'textInverse' | 'textSecondary'> = {
  primary: 'textInverse',
  yes: 'textInverse',
  no: 'textPrimary',
  secondary: 'textPrimary',
  ghost: 'textSecondary',
};

// Raw hex, not a class — ActivityIndicator's `color` prop isn't classNameable.
const spinnerColor: Record<ButtonVariant, string> = {
  primary: colors.textInverse,
  yes: colors.textInverse,
  no: colors.textPrimary,
  secondary: colors.textPrimary,
  ghost: colors.textSecondary,
};

// A flat saturated yellow reads as pasted-on against pure black without
// this — see docs/DECISIONS.md. Only `primary` gets it; yes/no are
// already high-contrast enough on their own and a glow on every button
// variant would stop meaning anything.
const glowStyle = {
  shadowColor: colors.accent,
  shadowOffset: { width: 0, height: 3 },
  shadowOpacity: 0.35,
  shadowRadius: 10,
  elevation: 6,
};

export function Button({
  label,
  variant = 'primary',
  loading,
  disabled,
  className,
  style,
  ...rest
}: ButtonProps) {
  return (
    <Pressable
      disabled={disabled || loading}
      className={cn(
        'min-h-12 items-center justify-center rounded-md px-6 py-3',
        containerClass[variant],
        (disabled || loading) && 'opacity-50',
        'active:opacity-85',
        className
      )}
      style={[variant === 'primary' && !disabled ? glowStyle : null, style]}
      {...rest}
    >
      {loading ? (
        <ActivityIndicator color={spinnerColor[variant]} />
      ) : (
        <Text variant="bodyStrong" color={labelColor[variant]}>
          {label}
        </Text>
      )}
    </Pressable>
  );
}
