import { useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, View } from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { Screen } from '@/components/layout/Screen';
import { Text } from '@/components/ui/Text';
import { Icon } from '@/components/ui/Icon';
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
import { MarketPriceChart } from '@/features/markets/components/MarketPriceChart';
import { MyPositionCard } from '@/features/markets/components/MyPositionCard';
import { useMarket } from '@/features/markets/hooks/useMarket';
import { useMarketActivity } from '@/features/markets/hooks/useMarketActivity';
import { useTopHolders } from '@/features/markets/hooks/useTopHolders';
import { useMarketPosition } from '@/features/portfolio/hooks/useMarketPosition';
import { ApiRequestError } from '@/services/api/client';
import { formatRelativeTime } from '@/utils/formatRelativeTime';
import { typography, KEYBOARD_OFFSET_IOS } from '@/theme';
import type { ColorToken } from '@/theme/colors';
import type { FeedItem, MarketDetail, MarketHolder } from '@/types/social';
import type { AppParamList } from '@/types/navigation';

type DetailTab = 'comments' | 'holders';

const DETAIL_TAB_OPTIONS: TabRowOption<DetailTab>[] = [
  { key: 'comments', label: 'Callouts' },
  { key: 'holders', label: 'Top Holders' },
];

/**
 * Only `marketId` travels through navigation (never a full market
 * object — see docs/DECISIONS.md), so this screen fetches its own
 * up-to-date copy rather than trusting stale data a list screen
 * happened to have. Modeled on Polymarket's own market page — see
 * docs/DECISIONS.md (Market Detail rebuild, Sprint 5) for the layout/
 * content reasoning: "Callouts" (Posts/Calls referencing this market,
 * not a new comment system) and "Top Holders" (read-only position-size
 * list) — no "About"/Rules tab and no separate Volume/Liquidity/Ends
 * stats block, both removed by request (see docs/DECISIONS.md, "Market
 * Price Chart").
 *
 * Header is bare image + title with the back button inline to the
 * image's left (no `Card`, no separate back-button row above it) —
 * laid out like `MarketAttachment`'s own top row otherwise — see
 * docs/DECISIONS.md ("Market Price Chart"). That same decision also
 * supersedes the screen's earlier "no price chart" stance:
 * `MarketPriceChart` now renders a real dual-line (YES/NO) chart backed
 * by `useMarketPriceHistory` (real endpoint first, dev-mock fallback
 * only in dev — the same convention every other list/read in this app
 * already follows, not a new exception to "never fabricate").
 *
 * Real trading (Sprint 7, see docs/DECISIONS.md): `TradingPanel` is a
 * single "Trade" button opening a `BottomSheet` that owns outcome/amount
 * selection and the Confirm Trade step; `MyPositionCard` shows the
 * user's real (or honestly absent) position, fetched via
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
      {market.status !== 'success' ? (
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
      ) : null}

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
          keyboardVerticalOffset={Platform.OS === 'ios' ? KEYBOARD_OFFSET_IOS : 0}
        >
          <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
            <View className="gap-4 px-4 pb-4">
              <MarketHero market={market.data} onBack={() => navigation.goBack()} />
              {market.data.isBinary === false ? (
                <GlassSurface tone="dark" blur={false} radius={18} contentClassName="p-4">
                  <MultiOutcomeNotice outcomeCount={market.data.outcomeCount} />
                </GlassSurface>
              ) : (
                <MarketPriceChart
                  marketId={marketId}
                  currentPriceCents={market.data.yesPrice}
                  labels={market.data.outcomeLabels ?? { yes: 'Yes', no: 'No' }}
                />
              )}
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
          </ScrollView>
        </KeyboardAvoidingView>
      ) : null}
    </Screen>
  );
}

/** Bare image + title, back button inline to the image's left — no
 * `Card`, no separate back-button row above it — see docs/DECISIONS.md
 * ("Market Price Chart"). Category/status badge intentionally dropped
 * from this row entirely, matching the literal "just image and title"
 * request. */
function MarketHero({ market, onBack }: { market: MarketDetail; onBack: () => void }) {
  return (
    <View className="flex-row items-center gap-3">
      <Pressable
        onPress={onBack}
        accessibilityRole="button"
        accessibilityLabel="Go back"
        hitSlop={8}
      >
        <Icon name="chevron-back" size={24} />
      </Pressable>
      <MarketVisual imageUrl={market.imageUrl} fallbackIcon="trending-up-outline" size={48} />
      <Text
        variant="title"
        numberOfLines={3}
        className="flex-1"
        style={{ fontFamily: typography.family.bold }}
      >
        {market.question}
      </Text>
    </View>
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

/** Display name only, no `@handle` — by request (see docs/DECISIONS.md,
 * "Market Price Chart"). */
function HolderRow({ holder }: { holder: MarketHolder }) {
  const color: ColorToken = holder.outcome === 'YES' ? 'yes' : 'no';

  return (
    <View className="flex-row items-center gap-3 border-b border-border px-4 py-3">
      <Avatar uri={holder.avatarUrl} fallbackLabel={holder.displayName} size={36} />
      <Text variant="bodyStrong" numberOfLines={1} className="flex-1">
        {holder.displayName}
      </Text>
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

/** Skeleton matching the loaded layout's actual shape (bare image+title
 * header, price chart) rather than a generic placeholder — see
 * docs/DESIGN.md. */
function MarketDetailSkeleton() {
  return (
    <View className="gap-4 px-4">
      <View className="flex-row items-center gap-3">
        <Skeleton width={24} height={24} className="rounded-md" />
        <Skeleton width={48} height={48} className="rounded-xl" />
        <View className="flex-1 gap-2">
          <Skeleton height={20} />
          <Skeleton height={20} className="w-2/3" />
        </View>
      </View>
      <GlassSurface tone="dark" blur={false} radius={18} contentClassName="gap-3 p-4">
        <Skeleton height={140} className="rounded-lg" />
        <Skeleton height={16} className="w-32" />
      </GlassSurface>
    </View>
  );
}
