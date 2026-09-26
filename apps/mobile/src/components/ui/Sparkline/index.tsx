import { View } from 'react-native';
import Svg, { Defs, LinearGradient, Path, Stop } from 'react-native-svg';
import { colors } from '@/theme';

/**
 * Lightweight pure-SVG sparkline  mobile port of `apps/web`'s
 * `components/ui/Sparkline`, used by the Markets tab's binary card.
 * Renders an area + stroke from a series of numbers, green when the
 * series ends at or above where it started, red otherwise.
 */
export function Sparkline({
  points,
  positive = true,
  height = 56,
}: {
  points: number[];
  positive?: boolean;
  height?: number;
}) {
  if (points.length < 2) return null;

  const width = 100;
  const min = Math.min(...points);
  const max = Math.max(...points);
  const range = max - min || 1;
  const step = width / (points.length - 1);

  const coords = points.map((value, index) => {
    const x = index * step;
    const y = height - ((value - min) / range) * height;
    return [x, y] as const;
  });

  const linePath = coords.map(([x, y], index) => `${index === 0 ? 'M' : 'L'}${x},${y}`).join(' ');
  const areaPath = `${linePath} L${width},${height} L0,${height} Z`;
  const color = positive ? colors.yes : colors.no;
  const gradientId = positive ? 'sparkline-up' : 'sparkline-down';

  return (
    <View
      style={{ height }}
      className="w-full"
      accessibilityLabel={`${positive ? 'Rising' : 'Falling'} price trend`}
    >
      <Svg width="100%" height="100%" viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="none">
        <Defs>
          <LinearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0%" stopColor={color} stopOpacity={0.26} />
            <Stop offset="100%" stopColor={color} stopOpacity={0} />
          </LinearGradient>
        </Defs>
        <Path d={areaPath} fill={`url(#${gradientId})`} stroke="none" />
        <Path
          d={linePath}
          fill="none"
          stroke={color}
          strokeWidth={2}
          strokeLinecap="round"
          strokeLinejoin="round"
          vectorEffect="non-scaling-stroke"
        />
      </Svg>
    </View>
  );
}
