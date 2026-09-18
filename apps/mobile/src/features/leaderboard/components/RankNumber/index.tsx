import { Text } from '@/components/ui/Text';
import { typography, colors } from '@/theme';

/**
 * Gold/silver/bronze — bigger and colored, everything else plain. Not a
 * `ColorToken` (these colors have no other meaning anywhere else in the
 * app, unlike `yes`/`no`/`accent`), so this stays a raw hex map rather
 * than extending the shared palette for a one-component use — see
 * docs/DECISIONS.md ("Decorated Top-3 Rank Numbers").
 */
const RANK_DECORATION: Record<number, { fontSize: number; color: string }> = {
  1: { fontSize: 26, color: '#FFD700' },
  2: { fontSize: 22, color: '#C7CDD6' },
  3: { fontSize: 20, color: '#D08A4E' },
};

const ROW_FONT_SIZE = 15;

export interface RankNumberProps {
  rank: number;
}

/**
 * Sizes and decorates a rank for the leaderboard's dense list column
 * (`LeaderboardUserCard`) — #1/#2/#3 bigger and gold/silver/bronze,
 * every other rank plain `textSecondary`. See docs/DECISIONS.md
 * ("Decorated Top-3 Rank Numbers").
 */
export function RankNumber({ rank }: RankNumberProps) {
  const decoration = RANK_DECORATION[rank];
  const fontSize = decoration ? decoration.fontSize : ROW_FONT_SIZE;

  return (
    <Text
      className="w-8 text-center"
      style={{
        fontSize,
        lineHeight: fontSize + 6,
        fontFamily: decoration ? typography.family.extrabold : typography.family.semibold,
        color: decoration?.color ?? colors.textSecondary,
      }}
    >
      {rank}
    </Text>
  );
}
