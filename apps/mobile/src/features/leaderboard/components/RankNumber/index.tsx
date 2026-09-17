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
const HERO_FONT_SIZE = 32;

export interface RankNumberProps {
  rank: number;
  /** `'row'` (default): sized for a dense list column, no "#" prefix,
   * fixed width for alignment across rows — used by `LeaderboardUserCard`.
   * `'hero'`: a bigger, standalone display with a "#" prefix — used by
   * `YourRankCard`. Ranks 1-3 get the same gold/silver/bronze decoration
   * either way, just scaled up for `'hero'`. */
  size?: 'row' | 'hero';
}

/**
 * Shared by `LeaderboardUserCard` and `YourRankCard` so #1/#2/#3 read
 * identically everywhere a rank number appears — bigger and
 * gold/silver/bronze-colored, every other rank stays the same plain
 * `textSecondary` styling it always had. See docs/DECISIONS.md
 * ("Decorated Top-3 Rank Numbers").
 */
export function RankNumber({ rank, size = 'row' }: RankNumberProps) {
  const decoration = RANK_DECORATION[rank];
  const baseFontSize = size === 'hero' ? HERO_FONT_SIZE : ROW_FONT_SIZE;
  const fontSize = decoration
    ? size === 'hero'
      ? decoration.fontSize + 10
      : decoration.fontSize
    : baseFontSize;
  const prefix = size === 'hero' ? '#' : '';

  return (
    <Text
      className={size === 'row' ? 'w-8 text-center' : undefined}
      style={{
        fontSize,
        lineHeight: fontSize + 6,
        fontFamily: decoration ? typography.family.extrabold : typography.family.semibold,
        color: decoration?.color ?? colors.textSecondary,
      }}
    >
      {prefix}
      {rank}
    </Text>
  );
}
