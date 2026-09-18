'use client';

import { cn } from '@/lib/cn';
import { Text } from '@/components/ui/Text';

export interface TabRowOption<T extends string> {
  key: T;
  label: string;
}

export interface TabRowProps<T extends string> {
  options: TabRowOption<T>[];
  value: T;
  onChange: (key: T) => void;
  /** Horizontal-scrolling row of natural-width tabs (e.g. Markets'
   * category list) instead of a short, fixed set stretched to equal
   * width — same distinction as mobile's `scroll` prop. */
  scroll?: boolean;
  className?: string;
}

/**
 * Web equivalent of `apps/mobile/src/components/ui/TabRow` — same
 * bold-label + bottom-border-indicator shape, same single component
 * used everywhere the app switches between a small set of views. A
 * plain overflow-x-auto row replaces RN's `ScrollView horizontal`.
 */
export function TabRow<T extends string>({
  options,
  value,
  onChange,
  scroll = false,
  className,
}: TabRowProps<T>) {
  const tabs = options.map((option) => {
    const active = option.key === value;
    return (
      <button
        key={option.key}
        type="button"
        onClick={() => onChange(option.key)}
        role="tab"
        aria-selected={active}
        className={cn(
          'flex items-center justify-center whitespace-nowrap border-b-2 py-3',
          scroll ? 'px-4' : 'flex-1',
          active ? 'border-text-primary' : 'border-transparent'
        )}
      >
        <Text variant="bodyStrong" color={active ? 'textPrimary' : 'textTertiary'}>
          {option.label}
        </Text>
      </button>
    );
  });

  if (scroll) {
    return (
      <div role="tablist" className={cn('scrollbar-none flex flex-shrink-0 overflow-x-auto', className)}>
        {tabs}
      </div>
    );
  }

  return (
    <div role="tablist" className={cn('flex border-b border-border', className)}>
      {tabs}
    </div>
  );
}
