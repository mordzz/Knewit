import { useQuery } from '@tanstack/react-query';
import { getEventHolders } from '@/lib/eventService';

/** Event Detail's Top Holders tab — optionally filtered to one child
 * market; `marketId` is part of the key so switching the filter
 * refetches. */
export function useEventHolders(eventId: string, marketId?: string) {
  return useQuery({
    queryKey: ['event-holders', eventId, marketId ?? 'all'],
    queryFn: () => getEventHolders(eventId, marketId),
  });
}
