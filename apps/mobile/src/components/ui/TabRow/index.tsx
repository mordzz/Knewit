import { ScrollView, Pressable, View } from 'react-native';
import { Text } from '@/components/ui/Text';
import { cn } from '@/utils/cn';

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
   * width. Only Markets uses this  every other tab row in the app is a
   * small, fixed set, so it stays non-scrolling. */
  scroll?: boolean;
  className?: string;
}

/**
 * X/Twitter's own top-tab shape  a bold, full-white label with a
 * bottom-border indicator for the active tab, a muted label and no
 * indicator otherwise. No pill/background fill. The one tab style used
 * everywhere the app switches between a small set of views  Home's
 * feed tabs, Markets' category filter, Profile's content tabs, Market
 * Detail's Comments/Top Holders/About  previously each screen had its
 * own near-identical pill-chip implementation (or, for Home, a
 * different-again underline control); consolidated into one component
 * so every tab row in the app looks and behaves the same way  see
 * docs/DECISIONS.md.
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
      <Pressable
        key={option.key}
        onPress={() => onChange(option.key)}
        className={cn(
          'items-center border-b-2 py-3',
          scroll ? 'px-4' : 'flex-1',
          active ? 'border-text-primary' : 'border-transparent'
        )}
        accessibilityRole="tab"
        accessibilityState={{ selected: active }}
      >
        <Text variant="bodyStrong" color={active ? 'textPrimary' : 'textTertiary'}>
          {option.label}
        </Text>
      </Pressable>
    );
  });

  if (scroll) {
    return (
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        className={cn('flex-grow-0', className)}
      >
        <View className="flex-row" accessibilityRole="tablist">
          {tabs}
        </View>
      </ScrollView>
    );
  }

  return (
    <View className={cn('flex-row border-b border-border', className)} accessibilityRole="tablist">
      {tabs}
    </View>
  );
}
