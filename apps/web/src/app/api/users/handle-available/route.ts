import { badRequest, withErrorHandling } from '@/lib/apiError';
import { requireAuth } from '@/lib/privy';
import { getOrCreateUser } from '@/lib/users';
import { checkHandleAvailability } from '@/lib/handles';

/**
 * `GET /users/handle-available?handle=` — checks a prospective username
 * for the authenticated caller with the same rules `PATCH /users/me`
 * applies (format, other Knewit accounts, Polymarket trader names), so
 * the edit screen can say "available" / "taken" while the user types.
 * Returns `HandleAvailability`; an invalid handle is a normal
 * `available: false` answer, not a 400.
 */
export async function GET(request: Request) {
  return withErrorHandling(async () => {
    const handle = new URL(request.url).searchParams.get('handle');
    if (handle == null) {
      throw badRequest('Expected ?handle=.');
    }

    const { privyUserId } = await requireAuth(request);
    const viewer = await getOrCreateUser(privyUserId);

    return Response.json(await checkHandleAvailability(handle, viewer));
  });
}
