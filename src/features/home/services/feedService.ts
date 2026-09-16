import { apiRequest } from '@/services/api/client';
import { endpoints } from '@/services/api/endpoints';
import { env } from '@/app/config/env';
import { buildMockFeed } from '@/features/home/fixtures/feed.mock';
import type { Paginated } from '@/types/common';
import type { FeedItem } from '@/types/social';

const MOCK_PAGE_SIZE = 5;
const MOCK_FEED_SIZE = 18;

function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function getMockFeedPage(cursor?: string): Promise<Paginated<FeedItem>> {
  await delay(400); // simulated latency so loading states are actually visible
  const all = buildMockFeed(MOCK_FEED_SIZE);
  const start = cursor ? Number(cursor) : 0;
  const items = all.slice(start, start + MOCK_PAGE_SIZE);
  const nextCursor = start + MOCK_PAGE_SIZE < all.length ? String(start + MOCK_PAGE_SIZE) : null;
  return { items, nextCursor };
}

/**
 * Tries the real backend first — this is the shipped code path, not a
 * fake one. Falls back to local mock fixtures only in dev, only when the
 * real request fails (no backend exists yet — see docs/API.md), and only
 * with a loud console warning so it's never mistaken for real data.
 */
export async function getFeed(cursor?: string): Promise<Paginated<FeedItem>> {
  const query = cursor ? `?cursor=${encodeURIComponent(cursor)}` : '';

  try {
    return await apiRequest<Paginated<FeedItem>>(`${endpoints.feed}${query}`);
  } catch (error) {
    if (env.isDev) {
      console.warn(
        '[feedService] backend unreachable — using local mock feed fixtures for development only.',
        error
      );
      return getMockFeedPage(cursor);
    }
    throw error;
  }
}

/**
 * The "Following" tab — Posts/Calls from accounts the caller follows
 * (Sprint 9's real Follow relationships), backend-filtered and
 * backend-ranked like `/feed` itself. **No dev-mock fallback that
 * fabricates content** — unlike `getFeed`'s generic mock feed (harmless
 * placeholder social content), a fake "following feed" would misrepresent
 * a real social relationship the user hasn't actually established in
 * mock mode; returns an honestly empty page instead, same principle as
 * Sprint 10's leaderboard mock fallback — see docs/DECISIONS.md.
 */
export async function getFollowingFeed(cursor?: string): Promise<Paginated<FeedItem>> {
  const query = cursor ? `?cursor=${encodeURIComponent(cursor)}` : '';

  try {
    return await apiRequest<Paginated<FeedItem>>(`${endpoints.feedFollowing}${query}`);
  } catch (error) {
    if (env.isDev) {
      console.warn(
        '[feedService] backend unreachable — returning no following-feed content (never fabricated) for development only.',
        error
      );
      return { items: [], nextCursor: null };
    }
    throw error;
  }
}
