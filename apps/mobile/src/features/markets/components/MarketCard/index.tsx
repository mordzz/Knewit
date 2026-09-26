import { View, Image, Pressable, Share } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Text } from '@/components/ui/Text';
import { Icon } from '@/components/ui/Icon';
import { MarketVisual } from '@/components/ui/MarketVisual';
import { Skeleton } from '@/components/ui/Skeleton';
import { Sparkline } from '@/components/ui/Sparkline';
import { useQuery } from '@tanstack/react-query';
import { getMarketPriceHistory } from '@/features/markets/services/marketService';
import { formatCompactUsd } from '@/utils/formatCurrency';
import { formatTimeRemaining } from '@/utils/formatDate';
import { typography } from '@/theme';
import type { MarketChoice } from '@/types/market';
import type {
  MarketGroupSummary,
  MarketListItem,
  MarketOutcomeRow,
  MarketSummary,
} from '@/types/social';

export interface MarketCardProps {
  item: MarketListItem;
  onOpenMarket: (marketId: string) => void;
}

/**
 * The Markets tab's discovery card  a flat, borderless list row (same
 * `border-b border-border px-4 py-3` convention as the Home feed's own
 * `CallCard` row), not a boxed `Card`/glass panel  see docs/DECISIONS.md
 * ("List Rows, Not Cards, for the Markets Tab"). The image+title header
 * row itself still matches `MarketAttachment`'s exact layout (`flex-row
 * items-center gap-2.5`, bold `bodyStrong` title), so a market reads the
 * same way wherever its image+title appears  this card just isn't
 * wrapped in its own panel the way `MarketAttachment` is (that one is a
 * card *embedded inside* a feed row; this one *is* the row).
 *
 * Still **one flexible component**, never a component per category:
 * which of the two layouts below renders is decided purely by the
 * data's shape (a single YES/NO pair vs. several named outcome rows
 * the latter sometimes called a "combo" market, e.g. an election with
 * several candidates), never by `category`  see docs/DESIGN.md and
 * docs/DECISIONS.md (Markets visual refresh). Combo markets are already
 * supported today via `GroupCard`/`OutcomeRow` below.
 *
 * No buy/sell action anywhere in this card, and no *price* anywhere in
 * it either  price/trading only ever appears in Market Detail now,
 * not this discovery list (see docs/DECISIONS.md, "Price Only in
 * Market Detail"). The *choice types* still show (labels from the
 * market's own API choices, each candidate's name + pills for a combo)
 *  only the price/probability number attached to them is gone (the old
 * Yes/No price buttons, the per-candidate probability percentage, and
 * the combo trend chart). A single-market row opens Market Detail; a
 * group card opens that same detail screen in event mode and is the
 * card's **only** click target  its outcome rows are display-only, see
 * docs/DECISIONS.md ("Group Cards Are One Click"). The
 * footer shows Volume only (not Liquidity/time  see
 * `buildMarketMetrics` for the full set `MarketAttachment` still shows)
 * with a Share action on the right, native OS share sheet, same pattern
 * as `SocialActionBar`'s  see docs/DECISIONS.md ("Native Share, Not
 * In-App Repost").
 *
 * Deliberately doesn't display category at all, not even indirectly
 * via icon  the category tab row (`TabPills`, above the list) is
 * already this screen's category signal; repeating it per-card would be
 * redundant. No status badge (Trending/Closed/Resolved) either, by
 * request  `MarketAttachment` still shows one; this card doesn't.
 */
export function MarketCard({ item, onOpenMarket }: MarketCardProps) {
  if (item.kind === 'group') {
    // One click target only: the whole group card opens the same
    // Market Detail surface in event mode. Child rows are display-only
    // (no separate press)  see docs/DECISIONS.md ("One Detail
    // Surface").
    return <GroupCard group={item.group} />;
  }
  return <SingleMarketCard market={item.market} onOpenMarket={onOpenMarket} />;
}

async function shareMarket(title: string) {
  try {
    await Share.share({ message: `${title}\n\nvia Knewit` });
  } catch {
    // User dismissed the share sheet  nothing to recover from.
  }
}

function VolumeAndShare({ volume, title }: { volume: number | null; title: string }) {
  return (
    <View className="flex-row items-center justify-between">
      {volume != null ? (
        <Text variant="micro" color="textTertiary">
          {formatCompactUsd(volume)} Volume
        </Text>
      ) : (
        <View />
      )}
      <Pressable
        onPress={() => shareMarket(title)}
        className="min-h-8 min-w-8 items-center justify-center"
        accessibilityRole="button"
        accessibilityLabel="Share this market"
        hitSlop={8}
      >
        <Icon name="share-outline" size={16} color="textTertiary" />
      </Pressable>
    </View>
  );
}

function SingleMarketCard({
  market,
  onOpenMarket,
}: {
  market: MarketSummary;
  onOpenMarket: (id: string) => void;
}) {
  return (
    <Pressable
      onPress={() => onOpenMarket(market.id)}
      className="gap-3 border-b border-border px-4 py-3 active:opacity-90"
      accessibilityRole="button"
      accessibilityLabel={`Open market: ${market.question}`}
    >
      <View className="flex-row items-center gap-2.5">
        <MarketVisual imageUrl={market.imageUrl} fallbackIcon="trending-up-outline" />
        <Text
          variant="bodyStrong"
          numberOfLines={3}
          className="flex-1"
          style={{ fontFamily: typography.family.bold }}
        >
          {market.question}
        </Text>
      </View>

      {market.choices.length === 2 ? (
        <BinaryMarketPreview market={market} />
      ) : (
        <ChoiceList choices={market.choices} />
      )}

      <VolumeAndShare volume={market.volume} title={market.question} />
    </Pressable>
  );
}

/** Three or more choices  the same `MiniPill` treatment the group
 * rows' Yes/No pills already use, one per choice, wrapping. When the
 * API actually provides an image for a choice, the pills switch to the
 * same image+label row `OutcomeRow` uses; the market's own image is
 * never substituted. Prices stay off this card (docs/DECISIONS.md,
 * "Price Only in Market Detail"). */
function ChoiceList({ choices }: { choices: MarketChoice[] }) {
  if (choices.length === 0) return null;

  if (choices.some((choice) => choice.imageUrl)) {
    return (
      <View className="gap-2">
        {choices.map((choice) => (
          <View key={choice.index} className="flex-row items-center gap-2">
            {choice.imageUrl ? (
              <Image source={{ uri: choice.imageUrl }} className="h-6 w-6 rounded-full" />
            ) : null}
            <Text variant="caption" numberOfLines={1} className="flex-1">
              {choice.label}
            </Text>
          </View>
        ))}
      </View>
    );
  }

  return (
    <View className="flex-row flex-wrap gap-1.5">
      {choices.map((choice) => (
        <MiniPill key={choice.index} label={choice.label} variant={choice.index % 2 === 0 ? 'primary' : 'secondary'} />
      ))}
    </View>
  );
}

const ROW_LIMIT = 4;

/**
 * A combo market (several named outcomes under one event)  still a
 * flat list row, just a taller one. **One click target only**: the whole
 * card opens the same Market Detail surface in event mode; the outcome
 * rows below are display-only (no separate press). Rows only show an
 * image when the API provides one that identifies the child  no
 * placeholder art, no shared league/tournament art.
 */
function GroupCard({ group }: { group: MarketGroupSummary }) {
  const navigation = useNavigation();
  const visibleRows = group.outcomes.slice(0, ROW_LIMIT);
  const remaining = group.outcomes.length - visibleRows.length;
  const isHeadToHead = group.outcomes.length === 2;

  return (
    <Pressable
      onPress={() => navigation.navigate('MarketDetail', { eventId: group.id })}
      className="gap-3 border-b border-border px-4 py-3 active:opacity-90"
      accessibilityRole="button"
      accessibilityLabel={`Open event: ${group.title}`}
    >
      <View className="flex-row items-center gap-2.5">
        <MarketVisual imageUrl={group.imageUrl} fallbackIcon="trending-up-outline" />
        <Text
          variant="bodyStrong"
          numberOfLines={3}
          className="flex-1"
          style={{ fontFamily: typography.family.bold }}
        >
          {group.title}
        </Text>
      </View>

      <View className="gap-2">
        {visibleRows.map((row) => (
          <OutcomeRow key={row.id} row={row} large={isHeadToHead} />
        ))}
        {remaining > 0 ? (
          <Text variant="micro" color="textTertiary">
            +{remaining} more
          </Text>
        ) : null}
      </View>

      <VolumeAndShare volume={group.volume} title={group.title} />
    </Pressable>
  );
}

function OutcomeRow({ row, large }: { row: MarketOutcomeRow; large: boolean }) {
  const avatarSize = large ? 32 : 22;

  return (
    <View className="flex-row items-center gap-2">
      {row.imageUrl ? (
        <Image
          source={{ uri: row.imageUrl }}
          style={{ width: avatarSize, height: avatarSize }}
          className="rounded-full"
        />
      ) : null}
      <Text variant={large ? 'body' : 'caption'} numberOfLines={1} className="flex-1">
        {row.label}
      </Text>
      <View className="flex-row gap-1">
        {row.choices.slice(0, 2).map((choice) => (
          <MiniPill key={choice.index} label={choice.label} variant={choice.index % 2 === 0 ? 'primary' : 'secondary'} />
        ))}
      </View>
    </View>
  );
}

/**
 * The binary single-market card's preview  same layout as the web
 * Markets list (`apps/web` `MarketCard`'s `BinaryMarketPreview`): the
 * first choice's chance and a 1D sparkline side by side, then the two
 * choice labels as half-width blocks (label only, no price).
 */
function BinaryMarketPreview({ market }: { market: MarketSummary }) {
  const firstChoice = market.choices[0];
  const secondChoice = market.choices[1];
  const history = useQuery({
    queryKey: ['market-price-history', market.id, '1D', firstChoice?.price, firstChoice?.index],
    queryFn: () => getMarketPriceHistory(market.id, '1D', firstChoice!.price, firstChoice!.index),
    enabled: firstChoice != null,
    staleTime: 60_000,
  });
  if (!firstChoice || !secondChoice) return null;

  const points = history.data?.map((point) => point.price) ?? [];
  const chance = Math.round(firstChoice.price);

  return (
    <View className="gap-2.5">
      <View className="flex-row items-center gap-3">
        <View className="min-w-0" style={{ flex: 2 }}>
          <Text variant="title" style={{ fontVariant: ['tabular-nums'] }}>
            {chance}%
          </Text>
          <Text variant="micro" color="textTertiary">
            chance
          </Text>
        </View>
        <View className="min-w-0" style={{ flex: 8 }}>
          {points.length >= 2 ? (
            <Sparkline points={points} positive={points[points.length - 1]! >= points[0]!} height={48} />
          ) : market.endDate ? (
            <Text variant="micro" color="textTertiary" className="text-right">
              {formatTimeRemaining(market.endDate)}
            </Text>
          ) : null}
        </View>
      </View>
      <View className="flex-row gap-2">
        <View className="flex-1 items-center rounded-md bg-accent px-3 py-2">
          <Text variant="caption" color="textInverse" numberOfLines={1} style={{ fontFamily: typography.family.semibold }}>
            {firstChoice.label}
          </Text>
        </View>
        <View className="flex-1 items-center rounded-md border border-white/15 bg-black px-3 py-2">
          <Text variant="caption" color="textPrimary" numberOfLines={1} style={{ fontFamily: typography.family.semibold }}>
            {secondChoice.label}
          </Text>
        </View>
      </View>
    </View>
  );
}

/** Same contrast choice `Button` already made (dark text on bright
 * fills, light text on the pink/red and neutral surfaces)  replicated
 * rather than shared since `Button`'s own size (min-h-12) is too tall
 * for a dense outcome-row list; this is the compact equivalent for that
 * context only. */
function MiniPill({ label, variant }: { label: string; variant: 'primary' | 'secondary' }) {
  return (
    <View className={`rounded-full px-2.5 py-1 ${variant === 'primary' ? 'bg-accent' : 'border border-border bg-surface-elevated'}`}>
      <Text variant="micro" color={variant === 'primary' ? 'textInverse' : 'textPrimary'}>
        {label}
      </Text>
    </View>
  );
}

/** Loading placeholder matching the single-market row's shape (the
 * more common of the two, and `MarketCardSkeleton`'s only current usage
 * context is the vertical `MarketsScreen` list) so a loading list
 * doesn't visually jump once real rows swap in  see docs/DESIGN.md. */
export function MarketCardSkeleton() {
  return (
    <View className="flex-row items-center gap-3 border-b border-border px-4 py-3">
      <Skeleton width={40} height={40} className="rounded-xl" />
      <View className="flex-1 gap-2">
        <Skeleton height={18} />
        <Skeleton height={18} className="w-3/4" />
      </View>
    </View>
  );
}
