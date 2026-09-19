import { Area, AreaChart, ResponsiveContainer } from "recharts";

export function Sparkline({
  points,
  positive = true,
  height = 56,
}: {
  points: number[];
  positive?: boolean;
  height?: number;
}) {
  const data = points.map((value, index) => ({ index, value }));
  return (
    <div
      style={{ height }}
      className="w-full"
      aria-label={`${positive ? "Rising" : "Falling"} price trend`}
    >
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data}>
          <defs>
            <linearGradient id={positive ? "up" : "down"} x1="0" y1="0" x2="0" y2="1">
              <stop
                offset="0%"
                stopColor={positive ? "var(--positive)" : "var(--negative)"}
                stopOpacity={0.26}
              />
              <stop
                offset="100%"
                stopColor={positive ? "var(--positive)" : "var(--negative)"}
                stopOpacity={0}
              />
            </linearGradient>
          </defs>
          <Area
            type="monotone"
            dataKey="value"
            stroke={positive ? "var(--positive)" : "var(--negative)"}
            strokeWidth={2}
            fill={`url(#${positive ? "up" : "down"})`}
            isAnimationActive={false}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
