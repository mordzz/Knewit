import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';
import { create } from 'zustand';
import { createJSONStorage, persist, type StateStorage } from 'zustand/middleware';
import type { ActivityItem } from '@/types/activity';
import type { Order } from '@/types/market';
import type { CommentItem, FeedItem, MarketSummary, User, UserPosition } from '@/types/social';

/**
 * Guest mode — a persisted demo session that lets the app run without
 * Privy or this project's backend (see docs/DECISIONS.md, "Guest Mode").
 * `isGuest` plus the guest identity/balance survive app restarts (the
 * only fields `partialize` persists); every sandbox collection below is
 * in-memory only and reseeds on launch, which also keeps the persisted
 * value clear of `expo-secure-store`'s ~2KB-per-value limit.
 *
 * Nothing here is real account data: `guestBackend.ts` serves every API
 * request from these fields plus the existing `*.mock.ts` fixtures, and
 * the app never sends a guest request to a real backend.
 */
export const GUEST_USER_ID = 'guest-user';
export const GUEST_STARTING_BALANCE_USD = 1000;
/** A syntactically valid Ethereum address (40 hex chars) so address
 * rendering/copy affordances behave exactly as with a real wallet. */
export const GUEST_WALLET_ADDRESS = '0x9a17e5000000000000000000000000000000c0de';

export interface GuestProfile extends User {
  bio: string | null;
  bannerUrl: string | null;
  followerCount: number;
  followingCount: number;
  tradingVolume: number | null;
}

export interface GuestState {
  isGuest: boolean;
  /** `false` until the persisted session (if any) has been read back —
   * `RootNavigator` waits on it so a returning guest doesn't flash the
   * sign-in screen on cold start. */
  hasHydrated: boolean;
  enteredAt: string;
  profile: GuestProfile;
  walletAddress: string;
  balanceUsdc: number;

  // Sandbox collections — never persisted (see the file comment).
  positions: UserPosition[];
  orders: Order[];
  /** Market summaries seen while trading, so a Callout created from a
   * sandbox position can still render its market attachment. */
  markets: Record<string, MarketSummary>;
  createdCalls: FeedItem[];
  deletedCallIds: string[];
  /** Call id -> the social state after this guest liked/unliked it, so
   * fixture calls (no real backend row) can carry a viewer-relative
   * like too. */
  callLikes: Record<string, { liked: boolean; likeCount: number }>;
  comments: CommentItem[];
  deletedCommentIds: string[];
  commentLikes: Record<string, { liked: boolean; likeCount: number }>;
  commentShares: Record<string, number>;
  follows: Record<string, boolean>;
  /** Per-user follower-count change caused by this guest following or
   * unfollowing them. */
  followerDeltas: Record<string, number>;
  activity: ActivityItem[];
  tradingVolume: number;
  nextId: number;
  /** Everything the guest session has already served, by id — lets a
   * later like/share/delete find the exact item the UI is showing
   * without re-deriving it from a fixture id. */
  knownCalls: Record<string, FeedItem>;
  knownComments: Record<string, CommentItem>;

  enterGuest: () => void;
  exitGuest: () => void;
  markHydrated: () => void;
}

export const DEFAULT_GUEST_PROFILE: GuestProfile = {
  id: GUEST_USER_ID,
  handle: 'guest',
  displayName: 'Guest',
  avatarUrl: null,
  walletAddress: GUEST_WALLET_ADDRESS,
  bio: 'Exploring Knewit in guest demo mode.',
  bannerUrl: null,
  followerCount: 3,
  followingCount: 0,
  tradingVolume: null,
};

function emptySandbox() {
  return {
    positions: [] as UserPosition[],
    orders: [] as Order[],
    markets: {} as Record<string, MarketSummary>,
    createdCalls: [] as FeedItem[],
    deletedCallIds: [] as string[],
    callLikes: {} as GuestState['callLikes'],
    comments: [] as CommentItem[],
    deletedCommentIds: [] as string[],
    commentLikes: {} as GuestState['commentLikes'],
    commentShares: {} as Record<string, number>,
    follows: {} as Record<string, boolean>,
    followerDeltas: {} as Record<string, number>,
    activity: [] as ActivityItem[],
    tradingVolume: 0,
    nextId: 1,
    knownCalls: {} as Record<string, FeedItem>,
    knownComments: {} as Record<string, CommentItem>,
  };
}

/** Storage behind `persist` — SecureStore on device, `localStorage` (or
 * an in-memory fallback) when this app runs on web, where SecureStore
 * isn't available. */
const memoryStorage = new Map<string, string>();

/** `persist` calls `setItem` on every sandbox mutation; since sandbox
 * collections aren't persisted, their writes all serialize to the same
 * string — skipping those avoids a SecureStore/Keychain write per like,
 * trade, or comment. */
let lastPersistedValue: string | null = null;

const guestStorage: StateStorage = {
  getItem: async (name) => {
    try {
      if (Platform.OS === 'web') {
        return typeof localStorage === 'undefined'
          ? (memoryStorage.get(name) ?? null)
          : localStorage.getItem(name);
      }
      return await SecureStore.getItemAsync(name);
    } catch {
      return memoryStorage.get(name) ?? null;
    }
  },
  setItem: async (name, value) => {
    if (value === lastPersistedValue) return;
    lastPersistedValue = value;
    try {
      if (Platform.OS === 'web') {
        if (typeof localStorage === 'undefined') {
          memoryStorage.set(name, value);
        } else {
          localStorage.setItem(name, value);
        }
        return;
      }
      await SecureStore.setItemAsync(name, value);
    } catch {
      memoryStorage.set(name, value);
    }
  },
  removeItem: async (name) => {
    lastPersistedValue = null;
    try {
      if (Platform.OS === 'web') {
        if (typeof localStorage === 'undefined') {
          memoryStorage.delete(name);
        } else {
          localStorage.removeItem(name);
        }
        return;
      }
      await SecureStore.deleteItemAsync(name);
    } catch {
      memoryStorage.delete(name);
    }
  },
};

export const useGuestStore = create<GuestState>()(
  persist(
    (set, get) => ({
      isGuest: false,
      hasHydrated: false,
      enteredAt: '',
      profile: DEFAULT_GUEST_PROFILE,
      walletAddress: GUEST_WALLET_ADDRESS,
      balanceUsdc: GUEST_STARTING_BALANCE_USD,
      ...emptySandbox(),

      enterGuest: () => {
        if (get().isGuest) return;
        set({
          isGuest: true,
          enteredAt: new Date().toISOString(),
          profile: DEFAULT_GUEST_PROFILE,
          walletAddress: GUEST_WALLET_ADDRESS,
          balanceUsdc: GUEST_STARTING_BALANCE_USD,
          ...emptySandbox(),
        });
      },
      exitGuest: () =>
        set({
          isGuest: false,
          enteredAt: '',
          profile: DEFAULT_GUEST_PROFILE,
          walletAddress: GUEST_WALLET_ADDRESS,
          balanceUsdc: GUEST_STARTING_BALANCE_USD,
          ...emptySandbox(),
        }),
      markHydrated: () => set({ hasHydrated: true }),
    }),
    {
      name: 'knewit-guest-session',
      storage: createJSONStorage(() => guestStorage),
      partialize: (state) => ({
        isGuest: state.isGuest,
        profile: state.profile,
        walletAddress: state.walletAddress,
        balanceUsdc: state.balanceUsdc,
      }),
      onRehydrateStorage: () => (state, error) => {
        if (error && __DEV__) console.warn('[guest] session rehydrate failed', error);
        (state ? state : useGuestStore.getState()).markHydrated();
      },
    }
  )
);

/** Non-React accessor for the API client and other service code. */
export function isGuestSession(): boolean {
  return useGuestStore.getState().isGuest;
}
