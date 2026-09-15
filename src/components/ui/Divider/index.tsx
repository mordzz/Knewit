import { View, ViewProps } from 'react-native';
import { cn } from '@/utils/cn';

export function Divider({ className, ...rest }: ViewProps) {
  return <View className={cn('h-px w-full bg-border', className)} {...rest} />;
}
