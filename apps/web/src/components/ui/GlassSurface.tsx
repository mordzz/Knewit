import type { CSSProperties, ReactNode } from 'react';
import { cn } from '@/lib/cn';

export type GlassTone = 'light' | 'dark';

export interface GlassSurfaceProps {
  radius?: number;
  tone?: GlassTone;
  /** Real `backdrop-filter: blur()` on the web — unlike the mobile
   * app's `BlurView`, the DOM's blur is cheap enough to leave on for
   * every instance, so this prop is kept only for API parity (a
   * `false` value just skips the `backdrop-blur` utility, still using
   * the same tint/border). */
  blur?: boolean;
  className?: string;
  contentClassName?: string;
  style?: CSSProperties;
  children: ReactNode;
}

const TONE_STYLES: Record<GlassTone, { border: string; tint: string }> = {
  light: { border: 'rgba(255,255,255,0.12)', tint: 'rgba(255,255,255,0.05)' },
  dark: { border: 'rgba(255,255,255,0.14)', tint: 'rgba(14, 15, 19, 0.88)' },
};

/**
 * Web equivalent of `apps/mobile/src/components/ui/GlassSurface` — same
 * frosted-glass surface (faint border + translucent tint), using CSS
 * `backdrop-filter: blur()` for the actual blur instead of `expo-blur`'s
 * native `BlurView`.
 */
export function GlassSurface({
  radius = 16,
  tone = 'light',
  blur = true,
  className,
  contentClassName,
  style,
  children,
}: GlassSurfaceProps) {
  const { border, tint } = TONE_STYLES[tone];

  return (
    <div
      className={cn(blur && 'backdrop-blur-xl', className)}
      style={{
        borderRadius: radius,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: border,
        backgroundColor: tint,
        ...style,
      }}
    >
      <div className={contentClassName}>{children}</div>
    </div>
  );
}
