import { useQuery } from '@tanstack/react-query';
import { getEventActivity } from '@/features/markets/lib/eventService';

/** Event Detail's Callouts tab — Posts/Calls referencing any of the
 * event's child markets. */
export function useEventActivity(eventId: string) {
  return useQuery({
    queryKey: ['event-activity', eventId],
    queryFn: () => getEventActivity(eventId),
  });
}
