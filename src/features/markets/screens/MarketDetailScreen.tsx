import { useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, View } from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { Screen } from '@/components/layout/Screen';
import { Text } from '@/components/ui/Text';
import { Icon } from '@/components/ui/Icon';
import { Badge } from '@/components/ui/Badge';
import { Avatar } from '@/components/ui/Avatar';
import { GlassSurface } from '@/components/ui/GlassSurface';
import { MarketVisual } from '@/components/ui/MarketVisual';
import { Skeleton } from '@/components/ui/Skeleton';
import { TabRow, TabRowOption } from '@/components/ui/TabRow';
import { LoadingState } from '@/components/feedback/LoadingState';
import { EmptyState } from '@/components/feedback/EmptyState';
import { ErrorState } from '@/components/feedback/ErrorState';
import { SocialActionBar } from '@/features/home/components/SocialActionBar';
import { TradingPanel } from '@/features/markets/components/TradingPanel';
import { MyPositionCard } from '@/features/markets/components/MyPositionCard';
import { useMarket } from '@/features/markets/hooks/useMarket';
import { useMarketActivity } from '@/features/markets/hooks/useMarketActivity';
import { useTopHolders } from '@/features/markets/hooks/useTopHolders';
import { useMarketPosition } from '@/features/portfolio/hooks/useMarketPosition';
import { ApiRequestError } from '@/services/api/client';
import { getStatusBadge } from '@/utils/marketStatus';
import { formatCompactUsd, formatProbability } from '@/utils/formatCurrency';
import { formatTimeRemaining, formatShortDate } from '@/utils/formatDate';
import { formatRelativeTime } from '@/utils/formatRelativeTime';
import { typography } from '@/theme';
import type { ColorToken } from '@/theme/colors';
import type { Outcome } from '@/types/market';
import type { FeedItem, MarketDetail, MarketHolder } from '@/types/social';
import type { AppParamList } from '@/types/navigation';

type DetailTab = 'comments' | 'holders' | 'about';

const DETAIL_TAB_OPTIONS: TabRowOption<DetailTab>[] = [
  { key: 'comments', label: 'Comments' },
  { key: 'holders', label: 'Top Holders' },
  { key: 'about', label: 'About' },
];

function outcomeLabel(market: MarketDetail, outcome: Outcome): string {
  const labels = market.outcomeLabels ?? { yes: 'Yes', no: 'No' };
  return outcome === 'YES' ? labels.yes : labels.no;
}

/**
 * Only `marketId` travels through navigation (never a full market
 * object — see docs/DECISIONS.md), so this screen fetches its own
 * up-to-date copy rather than trusting stale data a list screen
 * happened to have. Modeled on Polymarket's own market page — see
 * docs/DECISIONS.md (Market Detail rebuild, Sprint 5) for the layout/
 * content reasoning: "Callouts" → **Comments** (Posts/Calls
 * referencing this market, not a new comment system), "Holders" →
 * **Top Holders** (read-only position-size list), "About" → **Rules**
 * (+ Resolution, when settled).
 *
 * No price chart — no historical price series exists in this data
 * model, and fabricating one would violate this project's standing
 * rule against presenting invented data as real (see
 * docs/DECISIONS.md).
 *
 * Real trading (Sprint 7, see docs/DECISIONS.md): `TradingPanel` owns
 * outcome/amount selection and the Confirm Trade sheet; `MyPositionCard`
 * shows the user's real (or honestly absent) position, fetched via
 * `useMarketPosition`. Neither ever fabricates a filled trade or a
 * position that doesn't exist.
 */
export function MarketDetailScreen() {
  const navigation = useNavigation();
  const route = useRoute<RouteProp<AppParamList, 'MarketDetail'>>();
  const { marketId } = route.params;
  const market = useMarket(marketId);
  const position = useMarketPosition(marketId);
  const [tab, setTab] = useState<DetailTab>('comments');

  const openAuthor = (userId: string) => navigation.navigate('Profile', { userId });
  const openPost = (postId: string) => navigation.navigate('PostDetail', { postId });

  const isNotFound =
    market.status === 'error' &&
    market.error instanceof ApiRequestError &&
    market.error.status === 404;

  return (
    <Screen className="gap-0 px-0 pt-4">
      <View className="flex-row items-center px-4 pb-2">
        <Pressable
          onPress={() => navigation.goBack()}
          accessibilityRole="button"
          accessibilityLabel="Go back"
          hitSlop={8}
        >
          <Icon name="chevron-back" size={24} />
        </Pressable>
      </View>

      {market.status === 'pending' ? <MarketDetailSkeleton /> : null}

      {market.status === 'error' && isNotFound ? (
        <View className="flex-1 px-4">
          <EmptyState
            icon="search"
            title="Market not found"
            message="This market may have been removed or the link is incorrect."
            actionLabel="Go back"
            onAction={() => navigation.goBack()}
          />
        </View>
      ) : null}

      {market.status === 'error' && !isNotFound ? (
        <View className="px-4">
          <ErrorState
            message="Unable to load market. Try again."
            onRetry={() => market.refetch()}
          />
        </View>
      ) : null}

      {market.status === 'success' ? (
        <KeyboardAvoidingView
          className="flex-1"
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
        >
          <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
            <View className="gap-3 px-4 pb-4">
              <MarketHero market={market.data} />
              <ProbabilityPanel market={market.data} />
              <MarketStats market={market.data} />
              {position.status === 'success' && position.data ? (
                <MyPositionCard
                  position={position.data}
                  liveCurrentPriceCents={
                    position.data.outcome === 'YES' ? market.data.yesPrice : market.data.noPrice
                  }
                />
              ) : null}
              <TradingPanel market={market.data} />
            </View>

            <TabRow options={DETAIL_TAB_OPTIONS} value={tab} onChange={setTab} />

            {tab === 'comments' ? (
              <CommentsTab marketId={marketId} onOpenAuthor={openAuthor} onOpenPost={openPost} />
            ) : null}
            {tab === 'holders' ? <HoldersTab marketId={marketId} /> : null}
            {tab === 'about' ? <AboutTab market={market.data} /> : null}
          </ScrollView>
        </KeyboardAvoidingView>
      ) : null}
    </Screen>
  );
}

/** Category, status, image, and the question — the dominant element on
 * the page (see docs/DESIGN.md). No probability/stats here — those are
 * their own sections, kept separate per Sprint 5's information
 * hierarchy rather than crammed into one "everything" card. */
function MarketHero({ market }: { market: MarketDetail }) {
  const badge = getStatusBadge(market);

  return (
    <GlassSurface contentClassName="gap-3 p-4">
      <View className="flex-row items-start gap-3">
        <MarketVisual imageUrl={market.imageUrl} category={market.category} size={56} />
        <View className="flex-1 gap-1.5">
          <View className="flex-row items-center gap-2">
            <Text variant="caption" color="textSecondary">
              {market.category}
            </Text>
            {badge ? <Badge label={badge.label} variant={badge.variant} /> : null}
          </View>
          <Text variant="title" style={{ fontFamily: typography.family.bold }}>
            {market.question}
          </Text>
        </View>
      </View>
    </GlassSurface>
  );
}

/**
 * Read-only "current probability" — a labeled bar + large YES/NO
 * percentages, distinct from the Trade panel below it (section 12:
 * never show a bare, unlabeled percentage). Non-binary markets get the
 * same honest preview `MarketCard`/`MarketAttachment` use — never a
 * fabricated YES/NO split.
 */
function ProbabilityPanel({ market }: { market: MarketDetail }) {
  if (market.isBinary === false) {
    return (
      <GlassSurface contentClassName="p-4">
        <MultiOutcomeNotice outcomeCount={market.outcomeCount} />
      </GlassSurface>
    );
  }

  const total = market.yesPrice + market.noPrice || 100;
  const yesWidth = Math.max(0, Math.min(100, (market.yesPrice / total) * 100));

  return (
    <GlassSurface contentClassName="gap-3 p-4">
      <Text variant="caption" color="textSecondary">
        Current probability
      </Text>
      <View
        className="h-2 flex-row overflow-hidden rounded-full bg-surface-elevated"
        accessibilityElementsHidden
        importantForAccessibility="no-hide-descendants"
      >
        <View className="h-full bg-yes" style={{ width: `${yesWidth}%` }} />
        <View className="h-full bg-no" style={{ width: `${100 - yesWidth}%` }} />
      </View>
      <View className="flex-row justify-between">
        <View>
          <Text variant="micro" color="yes">
            {outcomeLabel(market, 'YES').toUpperCase()}
          </Text>
          <Text variant="display" color="yes">
            {formatProbability(market.yesPrice)}
          </Text>
        </View>
        <View className="items-end">
          <Text variant="micro" color="no">
            {outcomeLabel(market, 'NO').toUpperCase()}
          </Text>
          <Text variant="display" color="no">
            {formatProbability(market.noPrice)}
          </Text>
        </View>
      </View>
    </GlassSurface>
  );
}

/** Volume/Liquidity/Ends — only the stats the data actually has, never
 * a fabricated placeholder for a missing one (section 13). */
function MarketStats({ market }: { market: MarketDetail }) {
  const stats: { label: string; value: string }[] = [];

  if (market.volume != null) {
    stats.push({ label: 'Volume', value: formatCompactUsd(market.volume) });
  }
  if (market.liquidity != null) {
    stats.push({ label: 'Liquidity', value: formatCompactUsd(market.liquidity) });
  }
  if (market.resolved) {
    // Settled — a countdown/status stat would be noise here.
  } else if (market.closed) {
    stats.push({ label: 'Status', value: 'Closed' });
  } else if (market.endDate) {
    stats.push({ label: 'Ends', value: formatTimeRemaining(market.endDate) });
  }

  if (stats.length === 0) return null;

  return (
    <GlassSurface contentClassName="flex-row justify-between p-4">
      {stats.map((stat) => (
        <View key={stat.label} className="items-center gap-1">
          <Text variant="caption" color="textTertiary">
            {stat.label}
          </Text>
          <Text variant="bodyStrong">{stat.value}</Text>
        </View>
      ))}
    </GlassSurface>
  );
}

function CommentsTab({
  marketId,
  onOpenAuthor,
  onOpenPost,
}: {
  marketId: string;
  onOpenAuthor: (userId: string) => void;
  onOpenPost: (postId: string) => void;
}) {
  const activity = useMarketActivity(marketId);

  if (activity.status === 'pending') {
    return (
      <View className="px-4">
        <LoadingState rows={3} />
      </View>
    );
  }
  if (activity.status === 'error') {
    return (
      <View className="px-4">
        <ErrorState message="Couldn't load comments." onRetry={() => activity.refetch()} />
      </View>
    );
  }
  if (activity.data.length === 0) {
    return (
      <EmptyState
        icon="chatbubble-outline"
        title="No comments yet"
        message="Posts and Calls about this market will show up here."
      />
    );
  }

  return (
    <View>
      {activity.data.map((item) => (
        <MarketActivityRow
          key={item.id}
          item={item}
          onOpenAuthor={onOpenAuthor}
          onOpenPost={onOpenPost}
        />
      ))}
    </View>
  );
}

/**
 * A Post/Call referencing this market — "Comments" is this tab's
 * user-facing label (Sprint 5), but the underlying data is the same
 * `FeedItem` model Home renders, so it gets the same real
 * `SocialActionBar` (Sprint 9) rather than a second, divergent Like
 * implementation — see docs/DECISIONS.md.
 */
function MarketActivityRow({
  item,
  onOpenAuthor,
  onOpenPost,
}: {
  item: FeedItem;
  onOpenAuthor: (userId: string) => void;
  onOpenPost: (postId: string) => void;
}) {
  return (
    <Pressable
      onPress={() => onOpenPost(item.id)}
      className="flex-row gap-3 border-b border-border px-4 py-3 active:bg-surface"
      accessibilityRole="button"
      accessibilityLabel={`Open post by ${item.author.displayName}`}
    >
      <Pressable
        onPress={() => onOpenAuthor(item.author.id)}
        accessibilityRole="button"
        accessibilityLabel={`Open ${item.author.displayName}'s profile`}
      >
        <Avatar uri={item.author.avatarUrl} fallbackLabel={item.author.displayName} size={36} />
      </Pressable>
      <View className="flex-1">
        <View className="flex-row items-baseline gap-1">
          <Text variant="bodyStrong" numberOfLines={1}>
            {item.author.displayName}
          </Text>
          <Text variant="caption" color="textTertiary">
            @{item.author.handle} · {formatRelativeTime(item.createdAt)}
          </Text>
        </View>
        <Text variant="body" className="mt-0.5">
          {item.body}
        </Text>
        <SocialActionBar
          postId={item.id}
          liked={item.liked}
          likeCount={item.likeCount}
          commentCount={item.commentCount}
          onPressComment={() => onOpenPost(item.id)}
        />
      </View>
    </Pressable>
  );
}

function HoldersTab({ marketId }: { marketId: string }) {
  const holders = useTopHolders(marketId);

  if (holders.status === 'pending') {
    return (
      <View className="px-4">
        <LoadingState rows={3} />
      </View>
    );
  }
  if (holders.status === 'error') {
    return (
      <View className="px-4">
        <ErrorState message="Couldn't load holders." onRetry={() => holders.refetch()} />
      </View>
    );
  }
  if (holders.data.length === 0) {
    return (
      <EmptyState
        icon="person-outline"
        title="No holders yet"
        message="Positions in this market will show up here."
      />
    );
  }

  return (
    <View>
      {holders.data.map((holder) => (
        <HolderRow key={holder.id} holder={holder} />
      ))}
    </View>
  );
}

function HolderRow({ holder }: { holder: MarketHolder }) {
  const color: ColorToken = holder.outcome === 'YES' ? 'yes' : 'no';

  return (
    <View className="flex-row items-center gap-3 border-b border-border px-4 py-3">
      <Avatar uri={holder.avatarUrl} fallbackLabel={holder.displayName} size={36} />
      <View className="flex-1">
        <Text variant="bodyStrong" numberOfLines={1}>
          {holder.displayName}
        </Text>
        <Text variant="caption" color="textTertiary">
          @{holder.handle}
        </Text>
      </View>
      <View className="items-end">
        <Text variant="bodyStrong" color={color}>
          {holder.outcome}
        </Text>
        <Text variant="caption" color="textSecondary">
          {holder.shares.toFixed(1)} shares
        </Text>
      </View>
    </View>
  );
}

function AboutTab({ market }: { market: MarketDetail }) {
  const resolvedLabel =
    market.resolved && market.resolvedOutcome ? outcomeLabel(market, market.resolvedOutcome) : null;

  return (
    <View className="gap-3 px-4 py-3">
      {resolvedLabel ? (
        <GlassSurface contentClassName="gap-1 p-3">
          <Text variant="caption" color="textSecondary">
            Resolution
          </Text>
          <Text variant="bodyStrong" color={market.resolvedOutcome === 'YES' ? 'yes' : 'no'}>
            Resolved {resolvedLabel}
          </Text>
        </GlassSurface>
      ) : null}
      <GlassSurface contentClassName="gap-2 p-3">
        <Text variant="bodyStrong">Rules</Text>
        <Text variant="body" color="textSecondary">
          {market.rules ?? "Rules aren't available for this market yet."}
        </Text>
        {market.openedAt ? (
          <Text variant="caption" color="textTertiary">
            Market opened {formatShortDate(market.openedAt)}
          </Text>
        ) : null}
      </GlassSurface>
    </View>
  );
}

/**
 * MVP trading is binary-only — this never forces a non-binary market
 * into a fabricated YES/NO split. Mirrors `MarketCard`/`MarketAttachment`'s
 * own non-binary treatment so the app never disagrees with itself about
 * what "this market isn't binary" looks like.
 */
function MultiOutcomeNotice({ outcomeCount }: { outcomeCount?: number | null }) {
  const label = outcomeCount != null ? `${outcomeCount} outcomes` : 'Multiple outcomes';

  return (
    <View className="flex-row items-center gap-2">
      <Icon name="layers-outline" size={16} color="textSecondary" />
      <Text variant="caption" color="textSecondary" className="flex-1">
        {label} · not available for YES/NO trading yet
      </Text>
    </View>
  );
}

/** Glass-style skeleton matching the loaded layout's actual shape
 * (hero, probability, stats) rather than a generic placeholder — see
 * docs/DESIGN.md. */
function MarketDetailSkeleton() {
  return (
    <View className="gap-3 px-4">
      <GlassSurface contentClassName="gap-3 p-4">
        <View className="flex-row items-start gap-3">
          <Skeleton width={56} height={56} className="rounded-xl" />
          <View className="flex-1 gap-2 pt-1">
            <Skeleton height={12} className="w-20" />
            <Skeleton height={20} />
            <Skeleton height={20} className="w-2/3" />
          </View>
        </View>
      </GlassSurface>
      <GlassSurface contentClassName="gap-3 p-4">
        <Skeleton height={12} className="w-32" />
        <Skeleton height={8} className="rounded-full" />
        <View className="flex-row justify-between">
          <Skeleton height={36} className="w-16" />
          <Skeleton height={36} className="w-16" />
        </View>
      </GlassSurface>
      <GlassSurface contentClassName="flex-row justify-between p-4">
        <Skeleton height={32} className="w-14" />
        <Skeleton height={32} className="w-14" />
        <Skeleton height={32} className="w-14" />
      </GlassSurface>
    </View>
  );
}
