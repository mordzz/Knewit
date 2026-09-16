import { useState } from 'react';
import { View, Pressable, LayoutChangeEvent } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { Text } from '@/components/ui/Text';
import { GlassSurface } from '@/components/ui/GlassSurface';
import { Skeleton } from '@/components/ui/Skeleton';
import { cn } from '@/utils/cn';
import type { PriceRange } from '@/types/social';

const RANGES: PriceRange[] = ['1H', '6H', '1D', '1W', '1M', 'ALL'];
const CHART_HEIGHT = 140;

export interface ChartSeries {
  key: string;
  label: string;
  color: string;
  values: number[];
}

export interface MultiLineChartProps {
  /** One line per entry — the line count always follows however many
   * series were actually fetched, never a hardcoded number. */
  series: ChartSeries[];
  loading: boolean;
  range: PriceRange;
  onChangeRange: (range: PriceRange) => void;
}

/**
 * Shared line-chart primitive — draws exactly one line per `series`
 * entry, each in its own color, with a color-swatch legend beneath
 * naming every line, and a 1H/6H/1D/1W/1M/ALL range picker. No
 * data-fetching here — `MarketPriceChart` (Market Detail's binary
 * market YES/NO chart, always 2 lines) fetches its own series and hands
 * them to this component, so the line count is always driven by the
 * real number of variants that were actually fetched, not hardcoded —
 * see docs/DECISIONS.md ("Lines Follow Variant Count"). Combo/group
 * markets no longer get a chart at all — `ComboPriceChart` (which used
 * to render one line per candidate on the Markets tab's `GroupCard`)
 * was removed along with every other price display on that card — see
 * docs/DECISIONS.md ("Price Only in Market Detail"). This component
 * still generalizes to any series count, so a future real per-candidate
 * chart could reuse it directly. No area/gradient fill under any line,
 * by request — just the stroked line itself. Rendered as black glass
 * (`GlassSurface` `tone="dark"`), matching `MarketAttachment`.
 */
export function MultiLineChart({ series, loading, range, onChangeRange }: MultiLineChartProps) {
  const [width, setWidth] = useState(0);
  const hasSeries = series.length > 0 && series.every((s) => s.values.length > 1);
  const allValues = series.flatMap((s) => s.values);
  const scale = hasSeries ? { min: Math.min(...allValues), max: Math.max(...allValues) } : null;

  function handleLayout(event: LayoutChangeEvent) {
    setWidth(event.nativeEvent.layout.width);
  }

  return (
    <GlassSurface tone="dark" blur={false} radius={18} contentClassName="gap-3 p-4">
      <View onLayout={handleLayout} style={{ height: CHART_HEIGHT }}>
        {loading ? (
          <Skeleton height={CHART_HEIGHT} className="rounded-lg" />
        ) : width > 0 && scale ? (
          <Svg width={width} height={CHART_HEIGHT}>
            {series.map((s) => (
              <Path
                key={s.key}
                d={buildLinePath(s.values, width, CHART_HEIGHT, scale)}
                stroke={s.color}
                strokeWidth={2}
                fill="none"
                strokeLinejoin="round"
                strokeLinecap="round"
              />
            ))}
          </Svg>
        ) : null}
      </View>

      <View className="flex-row flex-wrap items-center gap-4">
        {series.map((s) => (
          <LegendItem key={s.key} color={s.color} label={s.label} />
        ))}
      </View>

      <View className="flex-row justify-between">
        {RANGES.map((option) => {
          const active = option === range;
          return (
            <Pressable
              key={option}
              onPress={() => onChangeRange(option)}
              className={cn('rounded-full px-3 py-1.5', active && 'bg-accent-muted')}
              accessibilityRole="button"
              accessibilityLabel={`${option} range`}
              accessibilityState={{ selected: active }}
            >
              <Text variant="caption" color={active ? 'accent' : 'textTertiary'}>
                {option}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </GlassSurface>
  );
}

function LegendItem({ color, label }: { color: string; label: string }) {
  return (
    <View className="flex-row items-center gap-1.5">
      <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: color }} />
      <Text variant="caption" color="textSecondary">
        {label}
      </Text>
    </View>
  );
}

function buildLinePath(
  values: number[],
  width: number,
  height: number,
  scale: { min: number; max: number }
): string {
  if (values.length < 2 || width <= 0) return '';
  const spread = scale.max - scale.min || 1;
  const stepX = width / (values.length - 1);

  return values
    .map((value, index) => {
      const x = index * stepX;
      const y = height - ((value - scale.min) / spread) * height;
      return `${index === 0 ? 'M' : 'L'}${x.toFixed(2)},${y.toFixed(2)}`;
    })
    .join(' ');
}
