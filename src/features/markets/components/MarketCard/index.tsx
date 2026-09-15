import { View, Image, Pressable } from 'react-native';
import { Text } from '@/components/ui/Text';
import { Icon } from '@/components/ui/Icon';
import { GlassSurface } from '@/components/ui/GlassSurface';
import { MarketVisual } from '@/components/ui/MarketVisual';
import { MarketOutcomeButtons } from '@/components/ui/MarketOutcomeButtons';
import { Skeleton } from '@/components/ui/Skeleton';
import { formatProbability } from '@/utils/formatCurrency';
import { buildMarketMetrics } from '@/utils/marketMetrics';
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
 * The Markets tab's discovery card — distinct from `MarketAttachment`
 * (the compact card embedded in a social post/Call, which stays as-is).
 * This is denser and more visually varied by design, matching how
 * Polymarket's own discovery surfaces mix several market shapes on one
 * screen — but still **one flexible component**, never a component per
 * category: which of the two layouts below renders is decided purely
 * by the data's shape (a single YES/NO pair vs. several named outcome
 * rows), never by `category` — see docs/DESIGN.md and
 * docs/DECISIONS.md (Markets visual refresh).
 *
 * No buy/sell action anywhere in this card — every tap (the whole
 * single-market card, a group's header, or one of its outcome rows)
 * opens Market Detail. The solid Yes/No buttons look tappable-for-
 * trading on purpose (matching the reference UX this card is modeled
 * on), but Sprint 3 is discovery-only — see docs/PRD.md.
 *
 * Deliberately doesn't display category at all, not even indirectly
 * via icon — `MarketVisual`'s `fallbackIcon` is fixed here rather than
 * left to its default category-derived glyph, since `CategoryTabs`
 * (above the list) is already this screen's category signal; repeating
 * it per-card would be redundant. `MarketAttachment` keeps the default
 * category icon — see that component's own docs for why the two
 * differ — see docs/DECISIONS.md.
 *
 * No status badge (Trending/Closed/Resolved) either, by request —
 * `MarketAttachment` still shows one; this card doesn't. A group's
 * header (visual + title) uses the same left-icon/right-text row as
 * the single-market layout, not a centered column — a centered header
 * was tried and reverted once it actually rendered next to the
 * row-style single-market cards in the same list; the inconsistency
 * between the two read as messier than either choice on its own — see
 * docs/DECISIONS.md.
 */
export function MarketCard({ item, onOpenMarket }: MarketCardProps) {
  if (item.kind === 'group') {
    return <GroupCard group={item.group} onOpenMarket={onOpenMarket} />;
  }
  return <SingleMarketCard market={item.market} onOpenMarket={onOpenMarket} />;
}

function SingleMarketCard({
  market,
  onOpenMarket,
}: {
  market: MarketSummary;
  onOpenMarket: (id: string) => void;
}) {
  const isBinary = market.isBinary !== false;
  const metrics = buildMarketMetrics(market);

  return (
    <Pressable
      onPress={() => onOpenMarket(market.id)}
      className="mb-3 active:opacity-90"
      accessibilityRole="button"
      accessibilityLabel={`Open market: ${market.question}`}
    >
      <GlassSurface contentClassName="gap-3 p-3.5">
        <View className="flex-row items-start gap-3">
          <MarketVisual
            imageUrl={market.imageUrl}
            category={market.category}
            fallbackIcon="trending-up-outline"
          />
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
          <MarketOutcomeButtons
            yesPrice={market.yesPrice}
            noPrice={market.noPrice}
            labels={market.outcomeLabels}
            onPress={() => onOpenMarket(market.id)}
          />
        )}

        {metrics.length > 0 ? (
          <Text variant="micro" color="textTertiary" numberOfLines={1}>
            {metrics.join(' · ')}
          </Text>
        ) : null}
      </GlassSurface>
    </Pressable>
  );
}

const ROW_LIMIT = 4;

function GroupCard({
  group,
  onOpenMarket,
}: {
  group: MarketGroupSummary;
  onOpenMarket: (id: string) => void;
}) {
  const metrics = buildMarketMetrics(group);
  const visibleRows = group.outcomes.slice(0, ROW_LIMIT);
  const remaining = group.outcomes.length - visibleRows.length;
  const isHeadToHead = group.outcomes.length === 2;

  return (
    <View className="mb-3">
      <GlassSurface contentClassName="gap-3 p-3.5">
        <Pressable
          onPress={() => onOpenMarket(group.id)}
          className="flex-row items-start gap-3 active:opacity-80"
          accessibilityRole="button"
          accessibilityLabel={`Open market: ${group.title}`}
        >
          <MarketVisual
            imageUrl={group.imageUrl}
            category={group.category}
            fallbackIcon="trending-up-outline"
          />
          <Text
            variant="bodyStrong"
            numberOfLines={2}
            className="flex-1"
            style={{ fontFamily: typography.family.bold }}
          >
            {group.title}
          </Text>
        </Pressable>

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

        {metrics.length > 0 ? (
          <Text variant="micro" color="textTertiary" numberOfLines={1}>
            {metrics.join(' · ')}
          </Text>
        ) : null}
      </GlassSurface>
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
      accessibilityLabel={`${row.label}, ${formatProbability(row.yesPrice)} yes`}
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
      <Text variant={large ? 'bodyStrong' : 'caption'} color="textPrimary">
        {formatProbability(row.yesPrice)}
      </Text>
      <View className="flex-row gap-1">
        <MiniPill label="Yes" color="yes" />
        <MiniPill label="No" color="no" />
      </View>
    </Pressable>
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

/** Loading placeholder matching the single-market card's shape (the
 * more common of the two) on the same glass surface as the loaded
 * cards, so a loading list doesn't visually jump once real cards swap
 * in — see docs/DESIGN.md. */
export function MarketCardSkeleton() {
  return (
    <View className="mb-3">
      <GlassSurface contentClassName="gap-3 p-3.5">
        <View className="flex-row items-start gap-3">
          <Skeleton width={40} height={40} className="rounded-xl" />
          <View className="flex-1 gap-1.5 pt-0.5">
            <Skeleton height={18} />
            <Skeleton height={18} className="w-3/4" />
          </View>
        </View>
        <View className="flex-row gap-2">
          <Skeleton height={48} className="flex-1 rounded-xl" />
          <Skeleton height={48} className="flex-1 rounded-xl" />
        </View>
      </GlassSurface>
    </View>
  );
}
