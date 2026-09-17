import type { InputHTMLAttributes } from 'react';
import { cn } from '@/lib/cn';
import { Text } from '@/components/ui/Text';

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

/** Web equivalent of `apps/mobile/src/components/ui/Input`. */
export function Input({ label, error, className, ...rest }: InputProps) {
  return (
    <div className="flex flex-col gap-1">
      {label ? (
        <Text variant="caption" color="textSecondary" className="ml-1">
          {label}
        </Text>
      ) : null}
      <input
        className={cn(
          'min-h-12 rounded-md border border-border bg-surface-elevated px-3 py-3 text-body text-text-primary placeholder:text-text-tertiary focus:outline-none',
          error && 'border-danger',
          className
        )}
        aria-label={label}
        {...rest}
      />
      {error ? (
        <Text variant="caption" color="danger" className="ml-1">
          {error}
        </Text>
      ) : null}
    </div>
  );
}
