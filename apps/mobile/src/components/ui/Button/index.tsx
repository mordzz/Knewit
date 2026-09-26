import type { ReactNode } from 'react';
import { Pressable, PressableProps, ActivityIndicator, StyleProp, ViewStyle } from 'react-native';
import { colors } from '@/theme';
import { Text } from '@/components/ui/Text';
import { Icon, type IconName } from '@/components/ui/Icon';
import { cn } from '@/utils/cn';

export type ButtonVariant = 'primary' | 'yes' | 'no' | 'secondary' | 'ghost';

export interface ButtonProps extends Omit<PressableProps, 'style'> {
  label: string;
  variant?: ButtonVariant;
  loading?: boolean;
  style?: StyleProp<ViewStyle>;
  /** Optional leading glyph (e.g. an OAuth provider's logo)  rendered
   * in the same color as the label, left of it. Added for
   * `SignInScreen`'s Google button rather than inventing a one-off
   * styled `Pressable` that would drift from every other button's
   * look. */
  icon?: IconName;
  /** Escape hatch for a leading glyph `icon` (Ionicons-only) can't
   * express  e.g. `SignInScreen`'s X button, which needs the real X
   * brand mark (`components/ui/XLogo`), not Ionicons' outdated
   * `logo-twitter` bird. Takes precedence over `icon` when both are
   * given. */
  iconElement?: ReactNode;
}

const containerClass: Record<ButtonVariant, string> = {
  primary: 'bg-accent',
  yes: 'bg-yes',
  no: 'bg-no',
  secondary: 'bg-surface-elevated',
  ghost: 'bg-transparent border border-border',
};

// `accent` is the brand yellow (matches the app icon)  white text on it
// is a legibility problem, so primary uses the same dark inverse label
// as yes/no's own bright backgrounds, not the default light-on-dark text.
const labelColor: Record<ButtonVariant, 'textPrimary' | 'textInverse' | 'textSecondary'> = {
  primary: 'textInverse',
  yes: 'textInverse',
  no: 'textPrimary',
  secondary: 'textPrimary',
  ghost: 'textSecondary',
};

// Raw hex, not a class  ActivityIndicator's `color` prop isn't classNameable.
const spinnerColor: Record<ButtonVariant, string> = {
  primary: colors.textInverse,
  yes: colors.textInverse,
  no: colors.textPrimary,
  secondary: colors.textPrimary,
  ghost: colors.textSecondary,
};

// Glossy, not glass: every variant keeps its own solid, opaque fill (no
// translucency)  see docs/DECISIONS.md ("Glossy Solid Buttons",
// superseding "Black Glass for Callout Surfaces" for buttons
// specifically). A brief 3D-bevel border phase (light top/left, dark
// bottom/right) was removed by request  see docs/DECISIONS.md ("Solid
// Surfaces, No 3D Bevel")  back to one plain uniform border on every
// variant, plus a soft drop shadow tinted with the variant's own
// identity color on `primary`/`yes`/`no` (a plain neutral shadow on
// `secondary`/`ghost`, which have no identity color  a colored glow on
// a neutral button would stop meaning anything).
const BORDER_COLOR = 'rgba(255, 255, 255, 0.16)';
const glowColor: Record<ButtonVariant, string> = {
  primary: colors.accent,
  yes: colors.yes,
  no: colors.no,
  secondary: '#000000',
  ghost: '#000000',
};

const glowOpacity: Record<ButtonVariant, number> = {
  primary: 0.35,
  yes: 0.3,
  no: 0.3,
  secondary: 0.25,
  ghost: 0.18,
};

export function Button({
  label,
  variant = 'primary',
  loading,
  disabled,
  className,
  style,
  icon,
  iconElement,
  ...rest
}: ButtonProps) {
  const isInactive = disabled || loading;

  return (
    <Pressable
      disabled={isInactive}
      className={cn(
        'min-h-12 flex-row items-center justify-center gap-2 rounded-md px-6 py-3',
        containerClass[variant],
        isInactive && 'opacity-50',
        'active:opacity-85',
        className
      )}
      style={[
        { borderWidth: 1, borderColor: BORDER_COLOR },
        !isInactive
          ? {
              shadowColor: glowColor[variant],
              shadowOffset: { width: 0, height: 3 },
              shadowOpacity: glowOpacity[variant],
              shadowRadius: 10,
              elevation: 6,
            }
          : null,
        style,
      ]}
      {...rest}
    >
      {loading ? (
        <ActivityIndicator color={spinnerColor[variant]} />
      ) : (
        <>
          {iconElement ??
            (icon ? <Icon name={icon} size={18} color={labelColor[variant]} /> : null)}
          <Text variant="bodyStrong" color={labelColor[variant]}>
            {label}
          </Text>
        </>
      )}
    </Pressable>
  );
}
