import { withErrorHandling } from '@/lib/apiError';
import { fetchEventsPage } from '@/lib/polymarket/gammaClient';
import { toDomainEvent } from '@/lib/polymarket/normalize';

/** `GET /events`  see `eventService.getEvents()` (mobile). Not
 * paginated in the mobile contract (`Event[]`, not `Paginated<Event>`)
 *  returns Polymarket's first page of currently active events. */
export async function GET() {
  return withErrorHandling(async () => {
    const { events } = await fetchEventsPage(undefined);
    return Response.json(events.map(toDomainEvent));
  });
}
