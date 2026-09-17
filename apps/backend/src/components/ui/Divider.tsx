import type { HTMLAttributes } from 'react';
import { cn } from '@/lib/cn';

/** Web equivalent of `apps/mobile/src/components/ui/Divider`. */
export function Divider({ className, ...rest }: HTMLAttributes<HTMLDivElement>) {
  return <div className={cn('h-px w-full bg-border', className)} {...rest} />;
}
