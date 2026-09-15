import { Pressable, PressableProps, StyleSheet, ActivityIndicator } from 'react-native';
import { colors, radius, spacing } from '@/theme';
import { Text } from '@/components/ui/Text';

export type ButtonVariant = 'primary' | 'yes' | 'no' | 'secondary' | 'ghost';

export interface ButtonProps extends Omit<PressableProps, 'style'> {
  label: string;
  variant?: ButtonVariant;
  loading?: boolean;
}

const backgroundByVariant: Record<ButtonVariant, string> = {
  primary: colors.accent,
  yes: colors.yes,
  no: colors.no,
  secondary: colors.surfaceElevated,
  ghost: 'transparent',
};

const textColorByVariant: Record<ButtonVariant, keyof typeof colors> = {
  primary: 'textPrimary',
  yes: 'textInverse',
  no: 'textPrimary',
  secondary: 'textPrimary',
  ghost: 'textSecondary',
};

export function Button({ label, variant = 'primary', loading, disabled, ...rest }: ButtonProps) {
  return (
    <Pressable
      disabled={disabled || loading}
      style={({ pressed }) => [
        styles.base,
        { backgroundColor: backgroundByVariant[variant] },
        variant === 'ghost' && styles.ghostBorder,
        (disabled || loading) && styles.disabled,
        pressed && styles.pressed,
      ]}
      {...rest}
    >
      {loading ? (
        <ActivityIndicator color={colors[textColorByVariant[variant]]} />
      ) : (
        <Text variant="bodyStrong" color={textColorByVariant[variant]}>
          {label}
        </Text>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    borderRadius: radius.md,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.lg,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 48,
  },
  ghostBorder: {
    borderWidth: 1,
    borderColor: colors.border,
  },
  disabled: {
    opacity: 0.5,
  },
  pressed: {
    opacity: 0.85,
  },
});
