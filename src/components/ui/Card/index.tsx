import { Pressable, ViewProps } from 'react-native';
import { GlassSurface } from '@/components/ui/GlassSurface';
import { cn } from '@/utils/cn';

export interface CardProps extends ViewProps {
  onPress?: () => void;
  /**
   * Arrangement of the actual children (flex-row, items-center, gap) —
   * separate from `className`, which sizes/positions the card itself
   * within its parent (flex-1, margin). They apply to different layers
   * once the card is a glass surface (outer wrapper vs. blurred content),
   * so a single combined className can't correctly serve both.
   */
  contentClassName?: string;
}

/** Every Card is a glass surface now — see docs/DESIGN.md "Modern Web3
 * Direction". `CallCard`'s feed rows deliberately stay borderless/non-glass
 * (X-style row, not a card) — see docs/DECISIONS.md. */
export function Card({
  onPress,
  className,
  contentClassName,
  style,
  children,
  ...rest
}: CardProps) {
  const surface = (
    <GlassSurface
      className={className}
      contentClassName={cn('gap-4 p-4', contentClassName)}
      style={style}
    >
      {children}
    </GlassSurface>
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
