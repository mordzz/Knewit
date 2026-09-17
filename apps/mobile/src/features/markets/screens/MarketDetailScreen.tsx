import { useMemo, useState } from 'react';
import { Image, KeyboardAvoidingView, Platform, Pressable, ScrollView, View } from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { Screen } from '@/components/layout/Screen';
import { Text } from '@/components/ui/Text';
import { Button } from '@/components/ui/Button';
import { Icon } from '@/components/ui/Icon';
import { Avatar } from '@/components/ui/Avatar';
import { GlassSurface } from '@/components/ui/GlassSurface';
import { MarketVisual } from '@/components/ui/MarketVisual';
import { Skeleton } from '@/components/ui/Skeleton';
import { TabRow, TabRowOption } from '@/components/ui/TabRow';
import { BottomSheet } from '@/components/ui/BottomSheet';
import { LoadingState } from '@/components/feedback/LoadingState';
import { EmptyState } from '@/components/feedback/EmptyState';
import { ErrorState } from '@/components/feedback/ErrorState';
import { SocialActionBar } from '@/features/home/components/SocialActionBar';
import { CallCard } from '@/features/home/components/CallCard';
import { TradingPanel, TradeSheet } from '@/features/markets/components/TradingPanel';
import { MarketPriceChart } from '@/features/markets/components/MarketPriceChart';
import { EventPriceChart } from '@/features/markets/components/EventPriceChart';
import { MyPositionCard } from '@/features/markets/components/MyPositionCard';
import { useMarket } from '@/features/markets/hooks/useMarket';
import { useMarketActivity } from '@/features/markets/hooks/useMarketActivity';
import { useTopHolders } from '@/features/markets/hooks/useTopHolders';
import { useEvent } from '@/features/markets/hooks/useEvent';
import { useEventActivity } from '@/features/markets/hooks/useEventActivity';
import { useEventHolders } from '@/features/markets/hooks/useEventHolders';
import { useMarketPosition } from '@/features/portfolio/hooks/useMarketPosition';
import { navigateToMarketDetail } from '@/features/markets/utils/openMarketDetail';
import { useWallet } from '@/hooks/useWallet';
import { ApiRequestError } from '@/services/api/client';
import { formatRelativeTime } from '@/utils/formatRelativeTime';
import { formatShortDate } from '@/utils/formatDate';
import { formatCompactUsd, formatUsd } from '@/utils/formatCurrency';
import { typography, KEYBOARD_OFFSET_IOS } from '@/theme';
import { choiceTextColor, choiceTone } from '@/utils/choiceTone';
import type {
  EventDetail,
  EventHolderRow,
  FeedItem,
  MarketDetail,
  MarketHolder,
  MarketSummary,
} from '@/types/social';
import type { AppParamList } from '@/types/navigation';

type DetailTab = 'about' | 'comments' | 'holders';

const DETAIL_TAB_OPTIONS: TabRowOption<DetailTab>[] = [
  { key: 'about', label: 'About' },
  { key: 'comments', label: 'Callouts' },
  { key: 'holders', label: 'Top Holders' },
];

/**
 * Only `marketId` travels through navigation (never a full market
 * object — see docs/DECISIONS.md), so this screen fetches its own
 * up-to-date copy rather than trusting stale data a list screen
 * happened to have. Modeled on Polymarket's own market page — see
 * docs/DECISIONS.md (Market Detail rebuild, Sprint 5) for the layout/
 * content reasoning: **About** (rules, resolution state, dates,
 * volume/liquidity — all from fields the API actually returns),
 * "Callouts" (Posts/Calls referencing this market, not a new comment
 * system), and "Top Holders" (read-only position-size list). Order
 * Book/trade Activity are deliberately absent: no honest data source
 * exists for them.
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
/**
 * One detail screen for both a single market and a grouped event:
 * MarketCard passes `marketId` for a market and `eventId` for a group
 * card, and event mode renders the same page shape (hero, chart, tabs)
 * with one chart line per child market, a Trade affordance per child
 * that opens the shared `TradeSheet` in place, and combined
 * Callouts/Top Holders. No separate event screen exists.
 */
export function MarketDetailScreen() {
  const navigation = useNavigation();
  const route = useRoute<RouteProp<AppParamList, 'MarketDetail'>>();
  const { marketId, eventId } = route.params ?? {};
  const { isConnected } = useWallet();
  const [tab, setTab] = useState<DetailTab>('about');
  const [tradeMarketId, setTradeMarketId] = useState<string | null>(null);

  const isEventMode = eventId != null;
  const market = useMarket(marketId ?? '', { enabled: marketId != null });
  const event = useEvent(eventId ?? '', { enabled: isEventMode });
  const position = useMarketPosition(marketId ?? '', {
    enabled: marketId != null && market.status === 'success',
  });
  const tradeMarket = useMarket(tradeMarketId ?? '', { enabled: tradeMarketId != null });

  const openAuthor = (userId: string) => navigation.navigate('Profile', { userId });
  const openPost = (postId: string) => navigation.navigate('PostDetail', { postId });
  const openTrade = (childId: string) => {
    if (!isConnected) {
      navigation.navigate('Auth');
      return;
    }
    setTradeMarketId(childId);
  };

  const isNotFound = isEventMode
    ? event.status === 'error' &&
      event.error instanceof ApiRequestError &&
      event.error.status === 404
    : market.status === 'error' &&
      market.error instanceof ApiRequestError &&
      market.error.status === 404;
  const pending = isEventMode ? event.status === 'pending' : market.status === 'pending';
  const loaded = isEventMode ? event.status === 'success' : market.status === 'success';

  return (
    <Screen className="gap-0 px-0 pt-4">
      {!loaded ? (
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

      {pending ? <MarketDetailSkeleton /> : null}

      {isNotFound ? (
        <View className="flex-1 px-4">
          <EmptyState
            icon="search"
            title={isEventMode ? 'Event not found' : 'Market not found'}
            message="This market may have been removed or the link is incorrect."
            actionLabel="Go back"
            onAction={() => navigation.goBack()}
          />
        </View>
      ) : null}

      {!pending && !loaded && !isNotFound ? (
        <View className="px-4">
          <ErrorState
            message={isEventMode ? 'Unable to load event. Try again.' : 'Unable to load market. Try again.'}
            onRetry={() => (isEventMode ? event.refetch() : market.refetch())}
          />
        </View>
      ) : null}

      {!isEventMode && market.status === 'success' ? (
        <KeyboardAvoidingView
          className="flex-1"
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          keyboardVerticalOffset={Platform.OS === 'ios' ? KEYBOARD_OFFSET_IOS : 0}
        >
          <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
            <View className="gap-4 px-4 pb-4">
              <MarketHero market={market.data} onBack={() => navigation.goBack()} />
              {market.data.choices.length > 0 ? (
                <MarketPriceChart marketId={marketId ?? ''} choices={market.data.choices} />
              ) : null}
              {position.status === 'success' && position.data ? (
                <MyPositionCard
                  position={position.data}
                  liveCurrentPriceCents={
                    market.data.choices.find((c) => c.index === position.data?.choiceIndex)?.price ??
                    null
                  }
                />
              ) : null}
              <TradingPanel market={market.data} />
            </View>

            <TabRow options={DETAIL_TAB_OPTIONS} value={tab} onChange={setTab} />

            {tab === 'about' ? <AboutTab market={market.data} /> : null}
            {tab === 'comments' ? (
              <CommentsTab marketId={marketId ?? ''} onOpenAuthor={openAuthor} onOpenPost={openPost} />
            ) : null}
            {tab === 'holders' ? <HoldersTab marketId={marketId ?? ''} /> : null}
          </ScrollView>
        </KeyboardAvoidingView>
      ) : null}

      {isEventMode && event.status === 'success' ? (
        <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
          <View className="gap-4 px-4 pb-4">
            <EventHero event={event.data} onBack={() => navigation.goBack()} />
            <EventPriceChart markets={event.data.markets} />

            <View className="gap-1">
              <Text variant="bodyStrong">All markets</Text>
              {event.data.markets.map((child) => (
                <EventMarketRow key={child.id} market={child} onTrade={() => openTrade(child.id)} />
              ))}
            </View>
          </View>

          <TabRow options={DETAIL_TAB_OPTIONS} value={tab} onChange={setTab} />

          {tab === 'about' ? <EventAboutTab event={event.data} /> : null}
          {tab === 'comments' ? (
            <EventCalloutsTab
              eventId={eventId}
              onOpenAuthor={openAuthor}
              onOpenMarket={(market) =>
                navigateToMarketDetail(navigation, market, { currentEventId: eventId })
              }
              onOpenPost={openPost}
            />
          ) : null}
          {tab === 'holders' ? (
            <EventHoldersTab eventId={eventId} markets={event.data.markets} />
          ) : null}
        </ScrollView>
      ) : null}

      <TradeSheet
        market={tradeMarket.data ?? null}
        visible={tradeMarketId != null}
        onClose={() => setTradeMarketId(null)}
      />
    </Screen>
  );
}

function EventHero({ event, onBack }: { event: EventDetail; onBack: () => void }) {
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
      <MarketVisual imageUrl={event.imageUrl} fallbackIcon="trending-up-outline" size={48} />
      <Text
        variant="title"
        numberOfLines={3}
        className="flex-1"
        style={{ fontFamily: typography.family.bold }}
      >
        {event.title}
      </Text>
    </View>
  );
}

/**
 * One child market row — headline is the API's short `label` (what the
 * group card showed), long question as secondary text. The row itself is
 * display-only (no press, no hover); the only action is the yellow Trade
 * button, which opens the shared `TradeSheet` for this child in place —
 * no navigation, no separate page.
 */
function EventMarketRow({ market, onTrade }: { market: MarketSummary; onTrade: () => void }) {
  const headline = market.label ?? market.question;

  return (
    <View className="flex-row items-center gap-3 border-b border-border py-3">
      {market.imageUrl ? (
        <Image source={{ uri: market.imageUrl }} className="h-10 w-10 rounded-xl" />
      ) : null}
      <View className="flex-1 gap-0.5">
        <Text variant="bodyStrong" numberOfLines={2}>
          {headline}
        </Text>
        {market.label ? (
          <Text variant="caption" color="textTertiary" numberOfLines={2}>
            {market.question}
          </Text>
        ) : null}
      </View>
      <Button
        variant="primary"
        label="Trade"
        onPress={onTrade}
        className="min-h-0 px-4 py-2"
        accessibilityLabel={`Trade ${headline}`}
      />
    </View>
  );
}

function EventAboutTab({ event }: { event: EventDetail }) {
  return (
    <View className="gap-4 px-4 pt-4">
      <AboutSection title="About">
        <Text variant="body" color="textSecondary">
          {event.description ?? 'No description was provided for this event.'}
        </Text>
      </AboutSection>

      <AboutSection title="Dates">
        <AboutRow label="Ends" value={event.endDate ? formatShortDate(event.endDate) : 'No end date'} />
      </AboutSection>

      <AboutSection title="Statistics">
        <AboutRow
          label="Volume"
          value={event.volume != null ? formatCompactUsd(event.volume) : 'Unavailable'}
        />
        <AboutRow
          label="Liquidity"
          value={event.liquidity != null ? formatUsd(event.liquidity) : 'Unavailable'}
        />
      </AboutSection>
    </View>
  );
}

function EventCalloutsTab({
  eventId,
  onOpenAuthor,
  onOpenMarket,
  onOpenPost,
}: {
  eventId: string;
  onOpenAuthor: (userId: string) => void;
  onOpenMarket: (market: MarketSummary) => void;
  onOpenPost: (postId: string) => void;
}) {
  const activity = useEventActivity(eventId);

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
        <ErrorState message="Couldn't load callouts." onRetry={() => activity.refetch()} />
      </View>
    );
  }
  if (activity.data.length === 0) {
    return (
      <EmptyState
        icon="chatbubble-outline"
        title="No callouts yet"
        message="Callouts referencing any market in this event will show up here."
      />
    );
  }

  return (
    <View>
      {activity.data.map((item) => (
        <CallCard
          key={item.id}
          item={item}
          onOpenAuthor={onOpenAuthor}
          onOpenMarket={onOpenMarket}
          onOpenPost={onOpenPost}
        />
      ))}
    </View>
  );
}

/**
 * Event Top Holders — rows stay per market+outcome, with a horizontally
 * **dropdown** (a field that opens a sheet listing the event's child
 * markets) narrowing the list to one market (`?market=` on the
 * endpoint).
 */
function EventHoldersTab({ eventId, markets }: { eventId: string; markets: MarketSummary[] }) {
  // Polymarket's holder data is per market, so there is no honest "all
  // markets" list — the tab defaults to the event's largest market and
  // the dropdown switches between children.
  const defaultMarket = useMemo(
    () => [...markets].sort((a, b) => (b.volume ?? 0) - (a.volume ?? 0))[0] ?? null,
    [markets]
  );
  const [marketFilter, setMarketFilter] = useState<string | null>(defaultMarket?.id ?? null);
  const [pickerVisible, setPickerVisible] = useState(false);
  const holders = useEventHolders(eventId, marketFilter ?? undefined);
  const selectedMarket = markets.find((market) => market.id === marketFilter) ?? defaultMarket;

  return (
    <View>
      <View className="px-4 pb-3 pt-3">
        <Pressable
          onPress={() => setPickerVisible(true)}
          className="flex-row items-center gap-2 rounded-xl border border-border bg-surface-elevated px-3 py-2.5 active:opacity-90"
          accessibilityRole="button"
          accessibilityLabel="Filter holders by market"
        >
          <Text variant="caption" color="textPrimary" className="flex-1" numberOfLines={1}>
            {selectedMarket ? selectedMarket.label ?? selectedMarket.question : 'Select market'}
          </Text>
          <View style={{ transform: [{ rotate: '90deg' }] }}>
            <Icon name="chevron-forward" size={14} color="textTertiary" />
          </View>
        </Pressable>
      </View>

      {holders.status === 'pending' ? (
        <View className="px-4">
          <LoadingState rows={3} />
        </View>
      ) : holders.status === 'error' ? (
        <View className="px-4">
          <ErrorState message="Couldn't load holders." onRetry={() => holders.refetch()} />
        </View>
      ) : holders.data.length === 0 ? (
        <EmptyState
          icon="person-outline"
          title="No holders yet"
          message="Holders of this market will show up here."
        />
      ) : (
        <View>
          {holders.data.map((holder) => (
            <EventHolderRowView key={holder.id} holder={holder} />
          ))}
        </View>
      )}

      <BottomSheet visible={pickerVisible} onClose={() => setPickerVisible(false)}>
        <Text variant="heading" className="mb-3">
          Market
        </Text>
        <ScrollView className="max-h-96">
          <View className="gap-2 pb-2">
            {markets.map((market) => {
              const active = market.id === marketFilter;
              const label = market.label ?? market.question;
              return (
                <Pressable
                  key={market.id}
                  onPress={() => {
                    setMarketFilter(market.id);
                    setPickerVisible(false);
                  }}
                  className="flex-row items-center gap-3 rounded-xl border border-border p-3 active:opacity-90"
                  accessibilityRole="button"
                  accessibilityState={{ selected: active }}
                  accessibilityLabel={label}
                >
                  <Text variant="body" className="flex-1" numberOfLines={2}>
                    {label}
                  </Text>
                  {active ? <Icon name="checkmark" size={16} color="accent" /> : null}
                </Pressable>
              );
            })}
          </View>
        </ScrollView>
      </BottomSheet>
    </View>
  );
}

function EventHolderRowView({ holder }: { holder: EventHolderRow }) {
  const color = choiceTextColor(choiceTone({ index: 0, label: holder.outcome }));

  return (
    <View className="flex-row items-center gap-3 border-b border-border px-4 py-3">
      <Avatar uri={holder.user.avatarUrl} fallbackLabel={holder.user.displayName} size={36} />
      <View className="flex-1">
        <Text variant="bodyStrong" numberOfLines={1}>
          {holder.user.displayName}
        </Text>
        <Text variant="caption" color="textTertiary" numberOfLines={1}>
          {holder.marketLabel}
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
      <View className="flex-1 gap-0.5">
        <Text
          variant="title"
          numberOfLines={3}
          style={{ fontFamily: typography.family.bold }}
        >
          {market.label ?? market.question}
        </Text>
        {/* A grouped child keeps the long question as a subtitle so the
            headline matches what was clicked on the event page. */}
        {market.label ? (
          <Text variant="caption" color="textTertiary" numberOfLines={2}>
            {market.question}
          </Text>
        ) : null}
      </View>
    </View>
  );
}

/**
 * Market Detail's "About" tab — Polymarket's own About/Rules section,
 * built only from fields this app actually has: the market's rules text,
 * its resolution state (backend still has no reliable "resolved
 * outcome" signal, so that line stays honest), its open/end dates, and
 * the volume/liquidity figures already on the summary. Nothing here is
 * derived or invented — a missing field shows its own honest fallback.
 */
function AboutTab({ market }: { market: MarketDetail }) {
  const resolution = market.resolved
    ? market.resolvedOutcome
      ? `Resolved ${market.resolvedOutcome === 'YES' ? 'Yes' : 'No'}.`
      : 'This market has resolved.'
    : market.closed
      ? 'Trading closed — awaiting resolution.'
      : 'Not resolved yet — this market is still open.';

  return (
    <View className="gap-4 px-4 pt-4">
      <AboutSection title="Rules">
        <Text variant="body" color="textSecondary">
          {market.rules ?? 'No rules text was provided for this market.'}
        </Text>
      </AboutSection>

      <AboutSection title="Resolution">
        <Text variant="body" color="textSecondary">
          {resolution}
        </Text>
      </AboutSection>

      <AboutSection title="Dates">
        <AboutRow label="Opened" value={market.openedAt ? formatShortDate(market.openedAt) : 'Unknown'} />
        <AboutRow label="Ends" value={market.endDate ? formatShortDate(market.endDate) : 'No end date'} />
      </AboutSection>

      <AboutSection title="Statistics">
        <AboutRow
          label="Volume"
          value={market.volume != null ? formatCompactUsd(market.volume) : 'Unavailable'}
        />
        <AboutRow
          label="Liquidity"
          value={market.liquidity != null ? formatUsd(market.liquidity) : 'Unavailable'}
        />
      </AboutSection>
    </View>
  );
}

function AboutSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View className="gap-2 border-b border-border pb-3">
      <Text variant="bodyStrong">{title}</Text>
      {children}
    </View>
  );
}

function AboutRow({ label, value }: { label: string; value: string }) {
  return (
    <View className="flex-row justify-between">
      <Text variant="caption" color="textSecondary">
        {label}
      </Text>
      <Text variant="caption" color="textPrimary">
        {value}
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
        message="Callouts about this market will show up here."
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
  const color = choiceTextColor(choiceTone({ index: 0, label: holder.outcome }));

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
