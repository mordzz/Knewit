import { Text } from '@/components/ui/Text';

const RANK_DECORATION: Record<number, { fontSize: number; color: string }> = {
  1: { fontSize: 26, color: '#FFD700' },
  2: { fontSize: 22, color: '#C7CDD6' },
  3: { fontSize: 20, color: '#D08A4E' },
};

const ROW_FONT_SIZE = 15;
const HERO_FONT_SIZE = 32;

export interface RankNumberProps {
  rank: number;
  size?: 'row' | 'hero';
}

/**
 * Web equivalent of `apps/mobile/src/features/leaderboard/components/RankNumber`
 * — gold/silver/bronze decoration for ranks 1-3, plain otherwise, shared
 * by `LeaderboardUserCard` and `YourRankCard` so a rank reads
 * identically everywhere it appears.
 */
export function RankNumber({ rank, size = 'row' }: RankNumberProps) {
  const decoration = RANK_DECORATION[rank];
  const baseFontSize = size === 'hero' ? HERO_FONT_SIZE : ROW_FONT_SIZE;
  const fontSize = decoration ? (size === 'hero' ? decoration.fontSize + 10 : decoration.fontSize) : baseFontSize;
  const prefix = size === 'hero' ? '#' : '';

  return (
    <Text
      className={size === 'row' ? 'inline-block w-8 text-center' : 'inline-block'}
      style={{
        fontSize,
        lineHeight: `${fontSize + 6}px`,
        fontFamily: decoration ? 'var(--font-inter)' : undefined,
        fontWeight: decoration ? 800 : 600,
        color: decoration?.color ?? 'var(--color-text-secondary)',
      }}
    >
      {prefix}
      {rank}
    </Text>
  );
}
