import { View } from 'react-native';
import { Skeleton } from '@/components/ui/Skeleton';

export interface LoadingStateProps {
  rows?: number;
}

/** Generic list-loading placeholder. Screens with a distinctive card shape
 * (MarketCard, CallCard) should build their own skeleton from `Skeleton`
 * instead of this generic one — this covers the common case. */
export function LoadingState({ rows = 4 }: LoadingStateProps) {
  return (
    <View className="gap-3" accessibilityLabel="Loading" accessibilityRole="progressbar">
      {Array.from({ length: rows }).map((_, index) => (
        <Skeleton key={index} height={72} className="rounded-lg" />
      ))}
    </View>
  );
}
