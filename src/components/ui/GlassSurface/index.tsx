import { View, ViewStyle, StyleProp } from 'react-native';
import { BlurView } from 'expo-blur';

export interface GlassSurfaceProps {
  /** expo-blur's 0-100 intensity scale. */
  intensity?: number;
  radius?: number;
  className?: string;
  contentClassName?: string;
  style?: StyleProp<ViewStyle>;
  children: React.ReactNode;
}

/**
 * Frosted-glass surface: native blur + a faint light border and tint to
 * sell the "glass" edge. The default card surface across the app now —
 * see docs/DESIGN.md "Modern Web3 Direction" and docs/DECISIONS.md.
 *
 * Blur/border/tint stay in `style` rather than `className` deliberately:
 * `BlurView` is a third-party native component this project hasn't
 * registered a `cssInterop` mapping for (unlike `SafeAreaView`), and
 * getting the box model wrong here would visibly break every card in
 * the app — not worth the risk for values that never need to vary.
 * `className`/`contentClassName` stay available for layout (margin,
 * width) and content padding, which don't carry that risk.
 *
 * Platform note: this is a real blur on iOS (`UIVisualEffectView`). On
 * Android, `expo-blur` without `experimentalBlurMethod` renders a
 * translucent tint, not a true blur — visually close enough at rest,
 * but it's an approximation, not the same effect. Revisit if Android
 * parity becomes a priority.
 */
export function GlassSurface({
  intensity = 40,
  radius = 16,
  className,
  contentClassName,
  style,
  children,
}: GlassSurfaceProps) {
  return (
    <View
      className={className}
      style={[
        {
          borderRadius: radius,
          overflow: 'hidden',
          borderWidth: 1,
          borderColor: 'rgba(255,255,255,0.12)',
        },
        style,
      ]}
    >
      <BlurView
        intensity={intensity}
        tint="dark"
        style={{ backgroundColor: 'rgba(255,255,255,0.05)' }}
      >
        <View className={contentClassName}>{children}</View>
      </BlurView>
    </View>
  );
}
