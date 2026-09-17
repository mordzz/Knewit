import { View, Pressable, ViewProps } from 'react-native';
import { cn } from '@/utils/cn';

export interface CardProps extends ViewProps {
  onPress?: () => void;
  /**
   * Arrangement of the actual children (flex-row, items-center, gap) —
   * separate from `className`, which sizes/positions the card itself
   * within its parent (flex-1, margin). Kept as two separate props
   * (rather than one combined className) for historical reasons — see
   * git history — but there's no longer a blur layer requiring the
   * split; both apply to the same view hierarchy now.
   */
  contentClassName?: string;
}

/**
 * The app's default flat panel — `bg-surface-elevated` + a 1px border,
 * no blur. Glass (`GlassSurface`) is reserved for true overlay contexts
 * only (`Modal`, `BottomSheet`) — see docs/DESIGN.md "Flat Panel
 * Surface" and docs/DECISIONS.md ("Glass Surfaces Reserved for
 * Overlays Only"). `CallCard`'s feed rows stay borderless/non-panel
 * (X-style row, not a card) — see docs/DECISIONS.md.
 */
export function Card({
  onPress,
  className,
  contentClassName,
  style,
  children,
  ...rest
}: CardProps) {
  const surface = (
    <View
      className={cn('rounded-lg border border-border bg-surface-elevated', className)}
      style={style}
    >
      <View className={cn('gap-4 p-4', contentClassName)}>{children}</View>
    </View>
  );

  if (onPress) {
    return (
      <Pressable onPress={onPress} className="active:opacity-90" {...rest}>
        {surface}
      </Pressable>
    );
  }

  return surface;
}
