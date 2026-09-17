'use client';

import { useRef, useState, useLayoutEffect } from 'react';
import { Text } from '@/components/ui/Text';
import { GlassSurface } from '@/components/ui/GlassSurface';
import { Skeleton } from '@/components/ui/Skeleton';
import { cn } from '@/lib/cn';
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
  series: ChartSeries[];
  loading: boolean;
  range: PriceRange;
  onChangeRange: (range: PriceRange) => void;
}

/**
 * Web equivalent of `apps/mobile/src/features/markets/components/MultiLineChart`
 * — draws exactly one line per `series` entry with an inline SVG
 * (standing in for `react-native-svg`), a color-swatch legend, and a
 * 1H/6H/1D/1W/1M/ALL range picker. No data-fetching here — the caller
 * fetches its own series and hands them to this component.
 */
export function MultiLineChart({ series, loading, range, onChangeRange }: MultiLineChartProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(0);
  const hasSeries = series.length > 0 && series.every((s) => s.values.length > 1);
  const allValues = series.flatMap((s) => s.values);
  const scale = hasSeries ? { min: Math.min(...allValues), max: Math.max(...allValues) } : null;

  useLayoutEffect(() => {
    const node = containerRef.current;
    if (!node) return;
    const observer = new ResizeObserver((entries) => {
      const entry = entries[0];
      if (entry) setWidth(entry.contentRect.width);
    });
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  return (
    <GlassSurface tone="dark" blur={false} radius={18} contentClassName="flex flex-col gap-3 p-4">
      <div ref={containerRef} style={{ height: CHART_HEIGHT }}>
        {loading ? (
          <Skeleton height={CHART_HEIGHT} className="rounded-lg" />
        ) : width > 0 && scale ? (
          <svg width={width} height={CHART_HEIGHT}>
            {series.map((s) => (
              <path
                key={s.key}
                d={buildLinePath(s.values, width, CHART_HEIGHT, scale)}
                stroke={s.color}
                strokeWidth={2}
                fill="none"
                strokeLinejoin="round"
                strokeLinecap="round"
              />
            ))}
          </svg>
        ) : null}
      </div>

      <div className="flex flex-wrap items-center gap-4">
        {series.map((s) => (
          <LegendItem key={s.key} color={s.color} label={s.label} />
        ))}
      </div>

      <div className="flex justify-between">
        {RANGES.map((option) => {
          const active = option === range;
          return (
            <button
              key={option}
              type="button"
              onClick={() => onChangeRange(option)}
              aria-label={`${option} range`}
              className={cn('rounded-full px-3 py-1.5', active && 'bg-accent-muted')}
            >
              <Text variant="caption" color={active ? 'accent' : 'textTertiary'}>
                {option}
              </Text>
            </button>
          );
        })}
      </div>
    </GlassSurface>
  );
}

function LegendItem({ color, label }: { color: string; label: string }) {
  return (
    <div className="flex items-center gap-1.5">
      <span className="inline-block h-2 w-2 rounded-full" style={{ backgroundColor: color }} />
      <Text variant="caption" color="textSecondary">
        {label}
      </Text>
    </div>
  );
}

function buildLinePath(values: number[], width: number, height: number, scale: { min: number; max: number }): string {
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
