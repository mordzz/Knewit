import type { HTMLAttributes } from 'react';
import { cn } from '@/lib/cn';

export interface CardProps extends HTMLAttributes<HTMLDivElement> {
  onPress?: () => void;
  contentClassName?: string;
}

/**
 * Web equivalent of `apps/mobile/src/components/ui/Card` — same flat
 * `bg-surface-elevated` + 1px border panel, same split between the
 * card's own sizing/positioning (`className`) and its content's
 * internal arrangement (`contentClassName`).
 */
export function Card({ onPress, className, contentClassName, children, ...rest }: CardProps) {
  const surface = (
    <div className={cn('rounded-lg border border-border bg-surface-elevated', className)}>
      <div className={cn('flex flex-col gap-4 p-4', contentClassName)}>{children}</div>
    </div>
  );

  if (onPress) {
    return (
      <button type="button" onClick={onPress} className="text-left transition-opacity hover:opacity-90" {...rest}>
        {surface}
      </button>
    );
  }

  return (
    <div {...rest}>
      {surface}
    </div>
  );
}
