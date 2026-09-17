import { View, ViewStyle, StyleProp } from 'react-native';
import { BlurView } from 'expo-blur';
import { glass } from '@/theme';

export type GlassTone = 'light' | 'dark';

export interface GlassSurfaceProps {
  /** expo-blur's 0-100 intensity scale. Only used when `blur` is true. */
  intensity?: number;
  radius?: number;
  /** 'light' (default) — the original white-frost glass, used by
   * `Modal`. 'dark' — black glass: a near-opaque dark translucent fill
   * with a brighter top-edge sheen, used by `MarketAttachment` and
   * friends. `BottomSheet` no longer uses this component at all — it's
   * the one surface that stayed solid, everything else is real
   * glassmorphism — see docs/DECISIONS.md ("Glassmorphism Restored
   * Outside BottomSheet"). */
  tone?: GlassTone;
  /** Real native blur (`BlurView`) costs more the more instances are on
   * screen at once — fine for a singleton overlay (`Modal`) but not for
   * a surface that repeats down a scrolling list. Pass `false` there
   * for a cheap translucent-panel approximation with no `BlurView` at
   * all; visually close at rest, without the per-row blur cost. */
  blur?: boolean;
  className?: string;
  contentClassName?: string;
  style?: StyleProp<ViewStyle>;
  children: React.ReactNode;
}

const TONE_STYLES: Record<GlassTone, { border: string; topBorder: string; tint: string }> = {
  light: {
    border: 'rgba(255,255,255,0.12)',
    topBorder: 'rgba(255,255,255,0.12)',
    tint: 'rgba(255,255,255,0.05)',
  },
  dark: {
    border: glass.border,
    topBorder: glass.highlight,
    tint: glass.fill,
  },
};

/**
 * Frosted-glass surface: native blur (or a cheap flat approximation,
 * see `blur`) + a faint border and tint to sell the "glass" edge. Real
 * glassmorphism everywhere it's used now — `BottomSheet` is the one
 * exception, which builds its own solid surface directly rather than
 * using this component at all — see docs/DECISIONS.md ("Glassmorphism
 * Restored Outside BottomSheet").
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
  tone = 'light',
  blur = true,
  className,
  contentClassName,
  style,
  children,
}: GlassSurfaceProps) {
  const { border, topBorder, tint } = TONE_STYLES[tone];

  return (
    <View
      className={className}
      style={[
        {
          borderRadius: radius,
          overflow: 'hidden',
          borderWidth: 1,
          borderColor: border,
          borderTopColor: topBorder,
        },
        style,
      ]}
    >
      {blur ? (
        <BlurView intensity={intensity} tint="dark" style={{ backgroundColor: tint }}>
          <View className={contentClassName}>{children}</View>
        </BlurView>
      ) : (
        <View style={{ backgroundColor: tint }}>
          <View className={contentClassName}>{children}</View>
        </View>
      )}
    </View>
  );
}
