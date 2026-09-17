import { View, ViewProps, ScrollView, ScrollViewProps } from 'react-native';
import { SafeAreaView, Edge } from 'react-native-safe-area-context';
import { cn } from '@/utils/cn';

export interface ScreenProps extends ViewProps {
  scroll?: boolean;
  edges?: Edge[];
  contentContainerClassName?: ScrollViewProps['contentContainerClassName'];
}

/**
 * `className` is layout/spacing for the content (padding, gap, etc). For
 * scroll=true this must go on ScrollView's `contentContainerClassName`,
 * not its own `className` — RN doesn't apply padding/gap from a
 * ScrollView's outer style to its scrollable content, only to the
 * content container.
 */
export function Screen({
  scroll = false,
  edges = ['top', 'bottom'],
  className,
  contentContainerClassName,
  children,
  ...rest
}: ScreenProps) {
  if (scroll) {
    return (
      <SafeAreaView className="flex-1 bg-background" edges={edges}>
        <ScrollView
          className="flex-1"
          contentContainerClassName={cn('px-4', contentContainerClassName ?? className)}
          {...rest}
        >
          {children}
        </ScrollView>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-background" edges={edges}>
      <View className={cn('flex-1 px-4', className)} {...rest}>
        {children}
      </View>
    </SafeAreaView>
  );
}
