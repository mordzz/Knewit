import { useQuery } from '@tanstack/react-query';
import { getEventDetail } from '@/features/markets/lib/eventService';

/** Event Detail's own data — header + every discoverable child market. */
export function useEvent(eventId: string, options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: ['event', eventId],
    queryFn: () => getEventDetail(eventId),
    enabled: options?.enabled ?? true,
  });
}
