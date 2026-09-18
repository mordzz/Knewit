import { PrivyClient } from '@privy-io/node';
import { env } from '@/lib/env';
import { unauthorized } from '@/lib/apiError';

let client: PrivyClient | null = null;

function getPrivyClient(): PrivyClient {
  if (!client) {
    client = new PrivyClient({ appId: env.privyAppId, appSecret: env.privyAppSecret });
  }
  return client;
}

/**
 * Verifies the `Authorization: Bearer <token>` header the mobile app
 * attaches (`src/services/api/client.ts::apiRequest`) against Privy,
 * per docs/API.md's auth convention. Returns the Privy user id
 * (`sub`/`user_id` of the token) for endpoints that require a caller
 * identity — nothing in this Foundation phase calls this yet (markets/
 * categories/events are public reads), but it's built now so Phase 2's
 * social endpoints (feed, likes, follows, calls) can use it directly.
 *
 * @throws ApiError(401) if the header is missing or the token is invalid.
 */
export async function requireAuth(request: Request): Promise<{ privyUserId: string }> {
  const header = request.headers.get('authorization');
  const token = header?.startsWith('Bearer ') ? header.slice('Bearer '.length) : null;
  if (!token) {
    throw unauthorized('Missing Authorization header.');
  }

  try {
    const result = await getPrivyClient().utils().auth().verifyAccessToken(token);
    return { privyUserId: result.user_id };
  } catch {
    throw unauthorized('Invalid or expired session token.');
  }
}

/** Same as `requireAuth`, but returns `null` instead of throwing when
 * there's no/invalid token — for endpoints whose response shape
 * depends on the viewer (e.g. a future `liked`/`isFollowing` field)
 * but that still work for an unauthenticated caller. Unused by any
 * Foundation-phase endpoint; kept alongside `requireAuth` since both
 * are part of the same auth primitive. */
export async function optionalAuth(request: Request): Promise<{ privyUserId: string } | null> {
  try {
    return await requireAuth(request);
  } catch {
    return null;
  }
}
