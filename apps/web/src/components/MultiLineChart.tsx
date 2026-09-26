'use client';

import { useRef, useState, useLayoutEffect } from 'react';
import { Text } from '@/components/ui/Text';
import { GlassSurface } from '@/components/ui/GlassSurface';
import { Skeleton } from '@/components/ui/Skeleton';
import { formatProbability } from '@/lib/formatters';
import { cn } from '@/lib/cn';
import type { PriceRange } from '@/types/social';

const RANGES: PriceRange[] = ['1H', '6H', '1D', '1W', '1M', 'ALL'];
const PLOT_HEIGHT = 140;
const AXIS_HEIGHT = 18;
const VALUE_GUTTER = 36;
const CHART_HEIGHT = PLOT_HEIGHT + AXIS_HEIGHT;
/** Keeps the highest/lowest line (and the min/max gridline labels) off
 * the plot's own edge, so nothing collides with the card border. */
const PLOT_PADDING_Y = 10;
const MAX_POINTS = 120;
const TOOLTIP_ROWS = 4;

export interface ChartSeries {
  key: string;
  label: string;
  color: string;
  values: number[];
  /** ISO timestamps parallel to `values`  shown by the crosshair
   * tooltip. Same length as `values`. */
  timestamps: string[];
  /** Optional SVG dash pattern  used to disambiguate extra event lines
   * once the identity palette starts repeating. */
  dash?: string;
}

export interface MultiLineChartProps {
  series: ChartSeries[];
  loading: boolean;
  range: PriceRange;
  onChangeRange: (range: PriceRange) => void;
}

interface Point {
  x: number;
  y: number;
}

interface Scale {
  min: number;
  max: number;
}

/** Uniform down-sample so dragging stays smooth on long series; keeps
 * the first and last points so the line always spans the full range. */
function downsample(values: number[], timestamps: string[]): { values: number[]; timestamps: string[] } {
  if (values.length <= MAX_POINTS) return { values, timestamps };
  const stride = Math.ceil(values.length / MAX_POINTS);
  const outValues: number[] = [];
  const outTimestamps: string[] = [];
  for (let i = 0; i < values.length; i += stride) {
    outValues.push(values[i]);
    outTimestamps.push(timestamps[i]);
  }
  const last = values.length - 1;
  if (outValues[outValues.length - 1] !== values[last]) {
    outValues.push(values[last]);
    outTimestamps.push(timestamps[last]);
  }
  return { values: outValues, timestamps: outTimestamps };
}

/** Value → y, padded top/bottom so extremes never touch the card edge;
 * a flat series (`min === max`) draws through the vertical center. */
function scaleToY(value: number, scale: Scale): number {
  const spread = scale.max - scale.min;
  if (spread <= 0) return PLOT_HEIGHT / 2;
  const usable = PLOT_HEIGHT - 2 * PLOT_PADDING_Y;
  return PLOT_PADDING_Y + (1 - (value - scale.min) / spread) * usable;
}

function toPoints(values: number[], plotWidth: number, scale: Scale, offsetX: number): Point[] {
  const stepX = values.length > 1 ? plotWidth / (values.length - 1) : 0;
  return values.map((value, index) => ({
    x: offsetX + index * stepX,
    y: scaleToY(value, scale),
  }));
}

/** Index of the point whose timestamp is closest to `target`
 * timestamps are ascending, so a binary search is enough. */
function nearestIndex(timestamps: string[], targetTime: number): number {
  if (timestamps.length === 0) return -1;
  let low = 0;
  let high = timestamps.length - 1;
  while (low < high) {
    const mid = (low + high) >> 1;
    if (new Date(timestamps[mid]).getTime() < targetTime) low = mid + 1;
    else high = mid;
  }
  const candidates = [low, Math.max(0, low - 1)];
  candidates.sort(
    (a, b) =>
      Math.abs(new Date(timestamps[a]).getTime() - targetTime) -
      Math.abs(new Date(timestamps[b]).getTime() - targetTime)
  );
  return candidates[0];
}

/** Monotone-cubic (Fritsch–Carlson) path  Polymarket-style smooth lines
 * without overshoot, no dependency. */
function buildSmoothPath(points: Point[]): string {
  if (points.length < 2) return '';
  if (points.length === 2) {
    return `M${points[0].x.toFixed(2)},${points[0].y.toFixed(2)} L${points[1].x.toFixed(2)},${points[1].y.toFixed(2)}`;
  }

  const n = points.length;
  const dx: number[] = [];
  const slopes: number[] = [];
  for (let i = 0; i < n - 1; i += 1) {
    dx[i] = points[i + 1].x - points[i].x || 1;
    slopes[i] = (points[i + 1].y - points[i].y) / dx[i];
  }

  const tangents: number[] = [slopes[0]];
  for (let i = 1; i < n - 1; i += 1) {
    if (slopes[i - 1] * slopes[i] <= 0) {
      tangents[i] = 0;
    } else {
      const w1 = 2 * dx[i] + dx[i - 1];
      const w2 = dx[i] + 2 * dx[i - 1];
      tangents[i] = (w1 + w2) / (w1 / slopes[i - 1] + w2 / slopes[i]);
    }
  }
  tangents[n - 1] = slopes[n - 2];

  let path = `M${points[0].x.toFixed(2)},${points[0].y.toFixed(2)}`;
  for (let i = 0; i < n - 1; i += 1) {
    const c1x = points[i].x + dx[i] / 3;
    const c1y = points[i].y + (tangents[i] * dx[i]) / 3;
    const c2x = points[i + 1].x - dx[i] / 3;
    const c2y = points[i + 1].y - (tangents[i + 1] * dx[i]) / 3;
    path +=
      ` C${c1x.toFixed(2)},${c1y.toFixed(2)}` +
      ` ${c2x.toFixed(2)},${c2y.toFixed(2)}` +
      ` ${points[i + 1].x.toFixed(2)},${points[i + 1].y.toFixed(2)}`;
  }
  return path;
}

function formatAxisTime(iso: string, range: PriceRange): string {
  const date = new Date(iso);
  if (range === '1H' || range === '6H' || range === '1D') {
    return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
  }
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function formatTooltipTime(iso: string): string {
  return new Date(iso).toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

/**
 * Shared line-chart primitive  one smooth line per `series` entry with
 * a padded plot, a horizontal grid + value labels and time labels on the
 * x-axis, a clickable legend (each item toggles its line, at least one
 * stays visible), and a crosshair + tooltip while hovering/dragging
 * (values are picked by nearest timestamp, so lines with different point
 * counts stay time-aligned). Series without enough data are skipped
 * instead of blanking the whole chart; a chart with nothing to draw says
 * so. No area fill under any line, by request.
 */
export function MultiLineChart({ series, loading, range, onChangeRange }: MultiLineChartProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(0);
  const [hiddenKeys, setHiddenKeys] = useState<Set<string>>(new Set());
  const [fraction, setFraction] = useState<number | null>(null);

  const visible = series.filter((s) => !hiddenKeys.has(s.key));
  const plotted = visible
    .map((s) => ({ series: s, ...downsample(s.values, s.timestamps) }))
    .filter((p) => p.values.length > 1);
  const allValues = plotted.flatMap((p) => p.values);
  const scale: Scale | null =
    plotted.length > 0 && allValues.length > 0
      ? { min: Math.min(...allValues), max: Math.max(...allValues) }
      : null;
  const plotWidth = Math.max(0, width - VALUE_GUTTER);

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

  function toggleSeries(key: string) {
    setHiddenKeys((previous) => {
      const next = new Set(previous);
      if (next.has(key)) {
        next.delete(key);
      } else if (series.length - next.size > 1) {
        next.add(key);
      }
      return next;
    });
  }

  function moveCrosshair(clientX: number) {
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect || plotWidth <= 0) return;
    const x = clientX - rect.left - VALUE_GUTTER;
    setFraction(Math.min(1, Math.max(0, x / plotWidth)));
  }

  const reference = plotted[0];
  const referenceIndex =
    reference && fraction != null
      ? Math.min(reference.values.length - 1, Math.round(fraction * (reference.values.length - 1)))
      : -1;
  const referenceTime =
    reference && referenceIndex >= 0
      ? new Date(reference.timestamps[referenceIndex]).getTime()
      : null;
  const crosshairX = fraction != null ? VALUE_GUTTER + fraction * plotWidth : 0;

  // A flat scale has one honest gridline (the value itself) instead of
  // three identical ones stacked on top of each other.
  const gridSteps =
    scale == null
      ? []
      : scale.max === scale.min
        ? [{ fraction: 0.5, value: scale.min }]
        : [0, 0.5, 1].map((gridFraction) => ({
            fraction: gridFraction,
            value: scale.min + gridFraction * (scale.max - scale.min),
          }));

  return (
    <GlassSurface tone="dark" blur={false} radius={18} contentClassName="flex flex-col gap-3 p-4">
      <div
        ref={containerRef}
        style={{ height: CHART_HEIGHT }}
        className="relative"
        onMouseMove={(e) => moveCrosshair(e.clientX)}
        onMouseLeave={() => setFraction(null)}
        onTouchStart={(e) => {
          const touch = e.touches[0];
          if (touch) moveCrosshair(touch.clientX);
        }}
        onTouchMove={(e) => {
          const touch = e.touches[0];
          if (touch) moveCrosshair(touch.clientX);
        }}
        onTouchEnd={() => setFraction(null)}
        onTouchCancel={() => setFraction(null)}
      >
        {loading ? (
          <Skeleton height={CHART_HEIGHT} className="rounded-lg" />
        ) : width > 0 && scale && plotted.length > 0 ? (
          <>
            <svg width={width} height={CHART_HEIGHT}>
              {gridSteps.map((step) => {
                const y = scaleToY(step.value, scale);
                return (
                  <g key={step.fraction}>
                    <line x1={VALUE_GUTTER} x2={width} y1={y} y2={y} stroke="#2A3040" strokeWidth={1} />
                    <text x={VALUE_GUTTER - 6} y={y + 3} textAnchor="end" fontSize={9} fill="#5C6577">
                      {formatProbability(step.value)}
                    </text>
                  </g>
                );
              })}

              {reference
                ? [0, 0.5, 1].map((tick) => {
                    const index = Math.min(
                      reference.values.length - 1,
                      Math.round(tick * (reference.values.length - 1))
                    );
                    return (
                      <text
                        key={tick}
                        x={VALUE_GUTTER + tick * plotWidth}
                        y={PLOT_HEIGHT + 13}
                        textAnchor={tick === 0 ? 'start' : tick === 1 ? 'end' : 'middle'}
                        fontSize={9}
                        fill="#5C6577"
                      >
                        {formatAxisTime(reference.timestamps[index], range)}
                      </text>
                    );
                  })
                : null}

              {plotted.map(({ series: chartSeries, values }) => (
                <path
                  key={chartSeries.key}
                  d={buildSmoothPath(toPoints(values, plotWidth, scale, VALUE_GUTTER))}
                  stroke={chartSeries.color}
                  strokeWidth={2}
                  fill="none"
                  strokeLinejoin="round"
                  strokeLinecap="round"
                  strokeDasharray={chartSeries.dash}
                />
              ))}

              {fraction != null && referenceIndex >= 0 && referenceTime != null ? (
                <g>
                  <line
                    x1={crosshairX}
                    x2={crosshairX}
                    y1={0}
                    y2={PLOT_HEIGHT}
                    stroke="#5C6577"
                    strokeWidth={1}
                    strokeDasharray="3 3"
                  />
                  {plotted.map(({ series: chartSeries, values, timestamps }) => {
                    const index = nearestIndex(timestamps, referenceTime);
                    if (index < 0) return null;
                    const point = toPoints(values, plotWidth, scale, VALUE_GUTTER)[index];
                    if (!point) return null;
                    return (
                      <circle
                        key={chartSeries.key}
                        cx={point.x}
                        cy={point.y}
                        r={3.5}
                        fill={chartSeries.color}
                        stroke="#000000"
                        strokeWidth={1}
                      />
                    );
                  })}
                </g>
              ) : null}
            </svg>

            {fraction != null && referenceIndex >= 0 && referenceTime != null ? (
              <div
                className="pointer-events-none absolute top-1 w-44 rounded-md border border-border bg-surface p-2"
                style={{
                  left: Math.min(Math.max(crosshairX + 8, 0), Math.max(0, width - 176)),
                }}
              >
                <Text variant="micro" color="textTertiary" className="block">
                  {formatTooltipTime(reference.timestamps[referenceIndex])}
                </Text>
                {plotted.slice(0, TOOLTIP_ROWS).map(({ series: chartSeries, values, timestamps }) => {
                  const index = nearestIndex(timestamps, referenceTime);
                  if (index < 0) return null;
                  return (
                    <div key={chartSeries.key} className="mt-0.5 flex items-center justify-between gap-2">
                      <div className="flex min-w-0 items-center gap-1.5">
                        <span
                          className="inline-block h-2 w-2 flex-shrink-0 rounded-full"
                          style={{ backgroundColor: chartSeries.color }}
                        />
                        <Text variant="micro" color="textSecondary" numberOfLines={1} className="truncate">
                          {chartSeries.label}
                        </Text>
                      </div>
                      <Text variant="micro" color="textPrimary">
                        {formatProbability(values[index])}
                      </Text>
                    </div>
                  );
                })}
                {plotted.length > TOOLTIP_ROWS ? (
                  <Text variant="micro" color="textTertiary" className="mt-0.5 block">
                    +{plotted.length - TOOLTIP_ROWS} more
                  </Text>
                ) : null}
              </div>
            ) : null}
          </>
        ) : (
          <div className="flex h-full items-center justify-center">
            <Text variant="caption" color="textTertiary">
              No price history
            </Text>
          </div>
        )}
      </div>

      <div className="flex flex-wrap items-center gap-4">
        {series.map((s) => {
          const hidden = hiddenKeys.has(s.key);
          const hasData = s.values.length > 1;
          return (
            <button
              key={s.key}
              type="button"
              onClick={() => hasData && toggleSeries(s.key)}
              aria-pressed={hasData && !hidden}
              aria-label={`${hidden ? 'Show' : 'Hide'} ${s.label} on chart${hasData ? '' : ' (no data)'}`}
              className={cn('flex items-center gap-1.5', (hidden || !hasData) && 'opacity-40')}
            >
              <span
                className="inline-block h-2 w-2 rounded-full"
                style={{ backgroundColor: s.color }}
              />
              <Text variant="caption" color={hidden || !hasData ? 'textTertiary' : 'textSecondary'}>
                {hasData ? s.label : `${s.label} · no data`}
              </Text>
            </button>
          );
        })}
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
