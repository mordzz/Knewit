import { useEffect, useState } from 'react';
import { Animated } from 'react-native';
import { cn } from '@/utils/cn';

export interface SkeletonProps {
  width?: number | `${number}%`;
  height?: number;
  className?: string;
}

export function Skeleton({ width = '100%', height = 16, className }: SkeletonProps) {
  const [opacity] = useState(() => new Animated.Value(0.4));

  useEffect(() => {
    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, { toValue: 1, duration: 700, useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 0.4, duration: 700, useNativeDriver: true }),
      ])
    );
    pulse.start();
    return () => pulse.stop();
  }, [opacity]);

  return (
    <Animated.View
      className={cn('rounded-sm bg-surface-elevated', className)}
      style={{ width, height, opacity }}
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
    />
  );
}
