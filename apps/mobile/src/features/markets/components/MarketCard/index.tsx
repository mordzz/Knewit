import { View, Image, Pressable, Share } from 'react-native';
import { Text } from '@/components/ui/Text';
import { Icon } from '@/components/ui/Icon';
import { MarketVisual } from '@/components/ui/MarketVisual';
import { Skeleton } from '@/components/ui/Skeleton';
import { formatCompactUsd } from '@/utils/formatCurrency';
import { typography } from '@/theme';
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
 * The Markets tab's discovery card — a flat, borderless list row (same
 * `border-b border-border px-4 py-3` convention as the Home feed's own
 * `CallCard` row), not a boxed `Card`/glass panel — see docs/DECISIONS.md
 * ("List Rows, Not Cards, for the Markets Tab"). The image+title header
 * row itself still matches `MarketAttachment`'s exact layout (`flex-row
 * items-center gap-2.5`, bold `bodyStrong` title), so a market reads the
 * same way wherever its image+title appears — this card just isn't
 * wrapped in its own panel the way `MarketAttachment` is (that one is a
 * card *embedded inside* a feed row; this one *is* the row).
 *
 * Still **one flexible component**, never a component per category:
 * which of the two layouts below renders is decided purely by the
 * data's shape (a single YES/NO pair vs. several named outcome rows —
 * the latter sometimes called a "combo" market, e.g. an election with
 * several candidates), never by `category` — see docs/DESIGN.md and
 * docs/DECISIONS.md (Markets visual refresh). Combo markets are already
 * supported today via `GroupCard`/`OutcomeRow` below.
 *
 * No buy/sell action anywhere in this card, and no *price* anywhere in
 * it either — price/trading only ever appears in Market Detail now,
 * not this discovery list (see docs/DECISIONS.md, "Price Only in
 * Market Detail"). The *choice types* still show (Yes/No pills for a
 * binary market, each candidate's name + Yes/No pills for a combo) —
 * only the price/probability number attached to them is gone (the old
 * Yes/No price buttons, the per-candidate probability percentage, and
 * the combo trend chart). Every tap (the whole single-market row, a
 * group's header, or one of its outcome rows) opens Market Detail. The
 * footer shows Volume only (not Liquidity/time — see
 * `buildMarketMetrics` for the full set `MarketAttachment` still shows)
 * with a Share action on the right, native OS share sheet, same pattern
 * as `SocialActionBar`'s — see docs/DECISIONS.md ("Native Share, Not
 * In-App Repost").
 *
 * Deliberately doesn't display category at all, not even indirectly
 * via icon — the category tab row (`TabPills`, above the list) is
 * already this screen's category signal; repeating it per-card would be
 * redundant. No status badge (Trending/Closed/Resolved) either, by
 * request — `MarketAttachment` still shows one; this card doesn't.
 */
export function MarketCard({ item, onOpenMarket }: MarketCardProps) {
  if (item.kind === 'group') {
    return <GroupCard group={item.group} onOpenMarket={onOpenMarket} />;
  }
  return <SingleMarketCard market={item.market} onOpenMarket={onOpenMarket} />;
}

async function shareMarket(title: string) {
  try {
    await Share.share({ message: `${title}\n\nvia Knewit` });
  } catch {
    // User dismissed the share sheet — nothing to recover from.
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
  const isBinary = market.isBinary !== false;

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

      {!isBinary ? (
        <MultiOutcomeNotice outcomeCount={market.outcomeCount} />
      ) : (
        <View className="flex-row gap-2">
          <ChoiceBlock label={market.outcomeLabels?.yes ?? 'Yes'} color="yes" />
          <ChoiceBlock label={market.outcomeLabels?.no ?? 'No'} color="no" />
        </View>
      )}

      <VolumeAndShare volume={market.volume} title={market.question} />
    </Pressable>
  );
}

const ROW_LIMIT = 4;

/**
 * A combo market (several named outcomes under one market entity, e.g.
 * an election with multiple candidates) — still a flat list row, same
 * as `SingleMarketCard`, just a taller one (header + its own internal
 * outcome sub-list) rather than a separate boxed panel — see
 * docs/DECISIONS.md ("List Rows, Not Cards, for the Markets Tab").
 */
function GroupCard({
  group,
  onOpenMarket,
}: {
  group: MarketGroupSummary;
  onOpenMarket: (id: string) => void;
}) {
  const visibleRows = group.outcomes.slice(0, ROW_LIMIT);
  const remaining = group.outcomes.length - visibleRows.length;
  const isHeadToHead = group.outcomes.length === 2;

  return (
    <View className="gap-3 border-b border-border px-4 py-3">
      {/* `group.id` is Polymarket's *event* id, not a market id —
          `getMarketById`/`GET /markets/:id` only ever resolves a real
          market id (see docs/ARCHITECTURE.md: "a group's individual
          outcome row is still just an ordinary market with its own
          id"). A combo market has no single-market detail screen to
          open with this header, so it's plain (non-pressable), not a
          button — only each `OutcomeRow` below is a real market id and
          navigable. Previously pressable anyway, which opened Market
          Detail to a 404 every time. */}
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
          <OutcomeRow
            key={row.id}
            row={row}
            large={isHeadToHead}
            onPress={() => onOpenMarket(row.id)}
          />
        ))}
        {remaining > 0 ? (
          <Text variant="micro" color="textTertiary">
            +{remaining} more
          </Text>
        ) : null}
      </View>

      <VolumeAndShare volume={group.volume} title={group.title} />
    </View>
  );
}

function OutcomeRow({
  row,
  large,
  onPress,
}: {
  row: MarketOutcomeRow;
  large: boolean;
  onPress: () => void;
}) {
  const avatarSize = large ? 32 : 22;

  return (
    <Pressable
      onPress={onPress}
      className="flex-row items-center gap-2 active:opacity-70"
      accessibilityRole="button"
      accessibilityLabel={row.label}
    >
      {row.imageUrl ? (
        <Image
          source={{ uri: row.imageUrl }}
          style={{ width: avatarSize, height: avatarSize }}
          className="rounded-full"
        />
      ) : (
        <View
          style={{ width: avatarSize, height: avatarSize }}
          className="items-center justify-center rounded-full bg-accent-muted"
        >
          <Icon name="person-outline" size={Math.round(avatarSize * 0.55)} color="accent" />
        </View>
      )}
      <Text variant={large ? 'body' : 'caption'} numberOfLines={1} className="flex-1">
        {row.label}
      </Text>
      <View className="flex-row gap-1">
        <MiniPill label="Yes" color="yes" />
        <MiniPill label="No" color="no" />
      </View>
    </Pressable>
  );
}

/**
 * The binary single-market card's choice-type display — big, square-
 * cornered, and exactly half-width each (`flex-1`), showing only the
 * choice label (Yes/No or a market-specific override), never a price —
 * see docs/DECISIONS.md ("Price Only in Market Detail"). Deliberately
 * not `MiniPill` (small, pill-rounded, meant for a dense outcome-row
 * list) — this card only ever shows one pair of these, so it can afford
 * to be the bigger, more square-cornered treatment the request asked
 * for.
 */
function ChoiceBlock({ label, color }: { label: string; color: 'yes' | 'no' }) {
  const bgClass = color === 'yes' ? 'bg-yes' : 'bg-no';
  const textColor = color === 'yes' ? 'textInverse' : 'textPrimary';
  return (
    <View className={`flex-1 items-center rounded-md px-3 py-2.5 ${bgClass}`}>
      <Text variant="bodyStrong" color={textColor}>
        {label}
      </Text>
    </View>
  );
}

/** Same yes/no contrast choice `Button` already made (yes: dark text on
 * bright green, no: white text on the pink/red) — replicated rather
 * than shared since `Button`'s own size (min-h-12) is too tall for a
 * dense outcome-row list; this is the compact equivalent for that
 * context only. */
function MiniPill({ label, color }: { label: string; color: 'yes' | 'no' }) {
  const bgClass = color === 'yes' ? 'bg-yes' : 'bg-no';
  const textColor = color === 'yes' ? 'textInverse' : 'textPrimary';
  return (
    <View className={`rounded-full px-2.5 py-1 ${bgClass}`}>
      <Text variant="micro" color={textColor}>
        {label}
      </Text>
    </View>
  );
}

/**
 * MVP trading is binary-only (see docs/PRD.md) — this never forces a
 * non-binary market into a fabricated YES/NO split. Mirrors
 * `MarketAttachment`'s own non-binary treatment (see docs/DECISIONS.md,
 * Sprint 3) since the two cards should never disagree about what "this
 * market isn't binary" looks like, even though they're separate
 * components for separate contexts.
 */
function MultiOutcomeNotice({ outcomeCount }: { outcomeCount?: number | null }) {
  const label = outcomeCount != null ? `${outcomeCount} outcomes` : 'Multiple outcomes';

  return (
    <View className="flex-row items-center gap-2 rounded-xl bg-surface-elevated p-2.5">
      <Icon name="layers-outline" size={16} color="textSecondary" />
      <Text variant="caption" color="textSecondary" className="flex-1">
        {label} · not available for YES/NO trading yet
      </Text>
    </View>
  );
}

/** Loading placeholder matching the single-market row's shape (the
 * more common of the two, and `MarketCardSkeleton`'s only current usage
 * context is the vertical `MarketsScreen` list) so a loading list
 * doesn't visually jump once real rows swap in — see docs/DESIGN.md. */
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
