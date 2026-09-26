import type { HTMLAttributes } from 'react';
import { cn } from '@/lib/cn';
import type { ColorToken } from '@/components/ui/Icon';

export type TypographyVariant =
  | 'jumbo'
  | 'display'
  | 'heading'
  | 'title'
  | 'body'
  | 'bodyStrong'
  | 'caption'
  | 'micro';

const textColorClass: Record<ColorToken, string> = {
  background: 'text-background',
  surface: 'text-surface',
  surfaceElevated: 'text-surface-elevated',
  border: 'text-border',
  textPrimary: 'text-text-primary',
  textSecondary: 'text-text-secondary',
  textTertiary: 'text-text-tertiary',
  textInverse: 'text-text-inverse',
  yes: 'text-yes',
  yesMuted: 'text-yes-muted',
  no: 'text-no',
  noMuted: 'text-no-muted',
  accent: 'text-accent',
  accentMuted: 'text-accent-muted',
  warning: 'text-warning',
  danger: 'text-danger',
  overlay: 'text-overlay',
};

const typographyClass: Record<TypographyVariant, string> = {
  jumbo: 'text-jumbo font-inter-extrabold',
  display: 'text-display font-inter-bold',
  heading: 'text-heading font-inter-bold',
  title: 'text-title font-inter-semibold',
  body: 'text-body font-inter-regular',
  bodyStrong: 'text-body-strong font-inter-semibold',
  caption: 'text-caption font-inter-regular',
  micro: 'text-micro font-inter-medium',
};

// Tailwind's scanner needs complete class-name strings literally in
// source (same reason `theme/tw.ts` uses lookup tables, not template
// interpolation, for color classes)  a `line-clamp-${n}` template
// wouldn't be picked up, so this is bounded to the few line counts this
// app actually uses anywhere.
const lineClampClass: Record<number, string> = {
  1: 'line-clamp-1',
  2: 'line-clamp-2',
  3: 'line-clamp-3',
};

export interface TextProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: TypographyVariant;
  color?: ColorToken;
  numberOfLines?: number;
}

/**
 * Web equivalent of `apps/mobile/src/components/ui/Text`  same
 * `variant`/`color` props, same lookup-table approach (`textColorClass`/
 * `typographyClass` copied verbatim from `theme/tw.ts`), rendering a
 * `span` instead of RN's `Text`. `numberOfLines` (RN-only) maps to a
 * `line-clamp-N` utility, this app's existing convention for the same
 * truncation everywhere else already uses.
 */
export function Text({
  variant = 'body',
  color = 'textPrimary',
  numberOfLines,
  className,
  ...rest
}: TextProps) {
  return (
    <span
      className={cn(
        typographyClass[variant],
        textColorClass[color],
        numberOfLines ? lineClampClass[numberOfLines] : undefined,
        className
      )}
      {...rest}
    />
  );
}
