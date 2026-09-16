import { Pressable, PressableProps, StyleProp, ViewStyle } from 'react-native';
import { Icon, IconName } from '@/components/ui/Icon';
import { colors } from '@/theme';
import { cn } from '@/utils/cn';

export interface FABProps extends Omit<PressableProps, 'onPress' | 'style'> {
  onPress: () => void;
  icon?: IconName;
  accessibilityLabel: string;
  style?: StyleProp<ViewStyle>;
}

const BORDER_COLOR = 'rgba(255, 255, 255, 0.2)';

/**
 * A primary floating action, not a navigation destination — see
 * docs/DECISIONS.md for why Create is a FAB rather than a tab. Solid
 * accent fill (glossy, not glass — see docs/DECISIONS.md "Glossy Solid
 * Buttons") with a plain border and an accent-tinted glow, since a flat
 * saturated yellow needs that to read as integrated against pure black
 * rather than pasted on. A brief 3D-bevel border phase was removed by
 * request — see docs/DECISIONS.md ("Solid Surfaces, No 3D Bevel").
 */
export function FAB({
  onPress,
  icon = 'add',
  accessibilityLabel,
  className,
  style,
  ...rest
}: FABProps) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      className={cn(
        'h-14 w-14 items-center justify-center rounded-full bg-accent active:opacity-85',
        className
      )}
      style={[
        {
          borderWidth: 1,
          borderColor: BORDER_COLOR,
          shadowColor: colors.accent,
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.45,
          shadowRadius: 12,
          elevation: 8,
        },
        style,
      ]}
      {...rest}
    >
      <Icon name={icon} size={28} color="textInverse" />
    </Pressable>
  );
}
