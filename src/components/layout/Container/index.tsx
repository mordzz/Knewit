import { View, ViewProps } from 'react-native';
import { cn } from '@/utils/cn';

/**
 * Consistent horizontal padding + max-width for content inside a Screen.
 * Kept separate from Screen so a screen can opt out (e.g. edge-to-edge
 * media) while most content wraps in this.
 */
export function Container({ className, children, ...rest }: ViewProps) {
  return (
    <View className={cn('w-full max-w-[640px] self-center px-4', className)} {...rest}>
      {children}
    </View>
  );
}
