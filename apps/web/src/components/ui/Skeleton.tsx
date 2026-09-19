'use client';

import { cn } from '@/lib/cn';

export interface SkeletonProps {
  width?: number | `${number}%`;
  height?: number;
  className?: string;
}

/**
 * Web equivalent of `apps/mobile/src/components/ui/Skeleton` — same
 * pulsing placeholder shape, using a plain CSS animation
 * (`animate-pulse`, Tailwind's built-in) instead of RN's `Animated`
 * loop, since the DOM already has one for exactly this.
 */
export function Skeleton({ width = '100%', height = 16, className }: SkeletonProps) {
  return (
    <div
      className={cn('animate-pulse rounded-sm bg-surface-elevated', className)}
      style={{ width, height }}
      aria-hidden
    />
  );
}
