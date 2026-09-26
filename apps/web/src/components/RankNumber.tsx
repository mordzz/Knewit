import { Text } from '@/components/ui/Text';

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
 * Web equivalent of `apps/mobile/src/features/leaderboard/components/RankNumber`
 *  gold/silver/bronze decoration for ranks 1-3, plain otherwise, used by
 * `LeaderboardUserCard`'s dense list column.
 */
export function RankNumber({ rank }: RankNumberProps) {
  const decoration = RANK_DECORATION[rank];
  const fontSize = decoration ? decoration.fontSize : ROW_FONT_SIZE;

  return (
    <Text
      className="inline-block w-8 text-center"
      style={{
        fontSize,
        lineHeight: `${fontSize + 6}px`,
        fontFamily: decoration ? 'var(--font-inter)' : undefined,
        fontWeight: decoration ? 800 : 600,
        color: decoration?.color ?? 'var(--color-text-secondary)',
      }}
    >
      {rank}
    </Text>
  );
}
