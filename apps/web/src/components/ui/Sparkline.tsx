/**
 * Lightweight pure-SVG sparkline (no chart library dependency) used by
 * the desktop sign-in showcase and desktop market previews. Renders an
 * area + stroke from a series of numbers, using the same `--color-yes`/
 * `--color-no` tokens the rest of the app uses for gain/loss, instead of
 * the placeholder palette `apps/dekstop`'s version used.
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
  const color = positive ? 'var(--color-yes)' : 'var(--color-no)';
  const gradientId = positive ? 'sparkline-up' : 'sparkline-down';

  return (
    <div style={{ height }} className="w-full" aria-label={`${positive ? 'Rising' : 'Falling'} price trend`}>
      <svg viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="none" className="h-full w-full">
        <defs>
          <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity={0.26} />
            <stop offset="100%" stopColor={color} stopOpacity={0} />
          </linearGradient>
        </defs>
        <path d={areaPath} fill={`url(#${gradientId})`} stroke="none" />
        <path d={linePath} fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </div>
  );
}
