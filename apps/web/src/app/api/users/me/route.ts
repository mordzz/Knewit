import { withErrorHandling } from '@/lib/apiError';
import { requireAuth } from '@/lib/privy';
import { getOrCreateUser } from '@/lib/users';
import { getSupabase } from '@/lib/supabase';

/** Deletes the Knewit-owned account data. Third-party Privy, Polymarket,
 * and public blockchain records are outside this endpoint's ownership. */
export async function DELETE(request: Request) {
  return withErrorHandling(async () => {
    const { privyUserId } = await requireAuth(request);
    const user = await getOrCreateUser(privyUserId);
    const { error } = await getSupabase().from('users').delete().eq('id', user.id);

    if (error) throw error;
    return Response.json({ deleted: true });
  });
}
