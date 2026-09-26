import { apiRequest } from '@/lib/apiClient';
import type { EventDetail, EventHolderRow, FeedItem } from '@/types/social';

/** Web equivalent of `apps/mobile`'s event service  Event Detail
 * (grouped event) reads. Real endpoints only; no dev-mock fallback. */
export async function getEventDetail(eventId: string): Promise<EventDetail> {
  return apiRequest<EventDetail>(`/api/events/${eventId}`);
}

/** Event Detail's Callouts tab  Posts/Calls referencing any of the
 * event's child markets. */
export async function getEventActivity(eventId: string): Promise<FeedItem[]> {
  return apiRequest<FeedItem[]>(`/api/events/${eventId}/activity`);
}

/** Event Detail's Top Holders tab  optionally filtered to one child
 * market (`?market=`); without it, holders across every child. */
export async function getEventHolders(eventId: string, marketId?: string): Promise<EventHolderRow[]> {
  const query = marketId ? `?market=${encodeURIComponent(marketId)}` : '';
  return apiRequest<EventHolderRow[]>(`/api/events/${eventId}/holders${query}`);
}
