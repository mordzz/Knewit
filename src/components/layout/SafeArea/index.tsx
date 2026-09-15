import { SafeAreaView, SafeAreaViewProps } from 'react-native-safe-area-context';
import { cn } from '@/utils/cn';

/**
 * Bare safe-area handling with no Screen-level padding/scroll behavior —
 * for surfaces (modals, sheets) that manage their own layout. Use
 * `components/layout/Screen` for a standard full screen.
 */
export function SafeArea({ className, ...rest }: SafeAreaViewProps) {
  return <SafeAreaView className={cn('flex-1 bg-background', className)} {...rest} />;
}
