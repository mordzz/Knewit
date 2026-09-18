import { apiRequest } from '@/services/api/client';
import { endpoints } from '@/services/api/endpoints';
import type { CategoryOption } from '@/types/common';
import type { EventDetail, EventHolderRow, FeedItem } from '@/types/social';

/** Grouped-event detail ("Event Detail") — header + every child market.
 * Real endpoint only; no dev-mock fallback (an event page with invented
 * markets would misrepresent the event). */
export function getEventDetail(eventId: string) {
  return apiRequest<EventDetail>(endpoints.event(eventId));
}

/** Event Detail's Callouts tab — Posts/Calls referencing any of the
 * event's child markets. */
export function getEventActivity(eventId: string) {
  return apiRequest<FeedItem[]>(endpoints.eventActivity(eventId));
}

/** Event Detail's Top Holders tab — optionally filtered to one child
 * market (`?market=`); without it, holders across every child. */
export function getEventHolders(eventId: string, marketId?: string) {
  const query = marketId ? `?market=${encodeURIComponent(marketId)}` : '';
  return apiRequest<EventHolderRow[]>(`${endpoints.eventHolders(eventId)}${query}`);
}

/** Label + slug pairs from Polymarket's live tag taxonomy — the slug is
 * the value sent back as the `category` filter (see `CategoryOption`). */
export function getCategories() {
  return apiRequest<CategoryOption[]>(endpoints.categories);
}
