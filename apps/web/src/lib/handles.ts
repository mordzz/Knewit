import { ApiError } from '@/lib/apiError';
import { getSupabase } from '@/lib/supabase';
import { fetchLeaderboardRowsForUsername } from '@/lib/polymarket/dataApiClient';
import type { HandleAvailability } from '@/types/social';

/** 3-20 lowercase letters, numbers, or underscores. */
export const HANDLE_RE = /^[a-z0-9_]{3,20}$/;

/**
 * Whether a Polymarket trader already uses this name — Knewit usernames
 * must not impersonate one. Throws a 503 `ApiError` when Polymarket
 * can't be reached, since "unknown" must not be treated as "free".
 */
export async function isHandleUsedByPolymarketTrader(handle: string): Promise<boolean> {
  const rows = await fetchLeaderboardRowsForUsername(handle).catch((error: unknown) => {
    console.warn('[profile] Polymarket username check failed:', error);
    throw new ApiError(
      503,
      'leaderboard_username_check_failed',
      "Couldn't verify username with Polymarket right now. Please try again."
    );
  });
  const normalized = handle.toLowerCase();
  return rows.some((row) => row.userName.trim().toLowerCase() === normalized);
}

/** Whether another Knewit account (not `excludeUserId`) has this handle. */
async function isHandleTakenInKnewit(handle: string, excludeUserId: string): Promise<boolean> {
  const { data, error } = await getSupabase()
    .from('users')
    .select('id')
    .eq('handle', handle)
    .neq('id', excludeUserId)
    .limit(1);
  if (error) throw error;
  return (data ?? []).length > 0;
}

/**
 * The same checks `PATCH /users/me` applies to a new handle, run ahead of
 * time so the client can tell the user while they type. Advisory only:
 * the PATCH (and the `users.handle` unique constraint) remain the source
 * of truth, since a handle can be claimed between this check and a save.
 */
export async function checkHandleAvailability(
  rawHandle: string,
  viewer: { id: string; handle: string }
): Promise<HandleAvailability> {
  const handle = rawHandle.trim().toLowerCase();

  if (!HANDLE_RE.test(handle)) {
    return {
      handle,
      available: false,
      reason: 'invalid',
      message: 'Use 3-20 lowercase letters, numbers, or underscores.',
    };
  }
  if (handle === viewer.handle) {
    return { handle, available: true, reason: 'current', message: 'This is your current username.' };
  }
  if (await isHandleTakenInKnewit(handle, viewer.id)) {
    return { handle, available: false, reason: 'taken', message: 'That username is already taken.' };
  }

  try {
    if (await isHandleUsedByPolymarketTrader(handle)) {
      return {
        handle,
        available: false,
        reason: 'polymarket_trader',
        message: 'That username is already used by a Polymarket trader.',
      };
    }
  } catch (error) {
    if (error instanceof ApiError && error.code === 'leaderboard_username_check_failed') {
      return {
        handle,
        available: null,
        reason: 'unverified',
        message: "Couldn't check this username right now. You can still try to save it.",
      };
    }
    throw error;
  }

  return { handle, available: true, reason: null, message: 'Username is available.' };
}
