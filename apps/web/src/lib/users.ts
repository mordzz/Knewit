import { PrivyClient } from "@privy-io/node";
import { env } from "@/lib/env";
import { getSupabase } from "@/lib/supabase";
import { notFound, unauthorized } from "@/lib/apiError";
import { isWalletAddress, normalizeWalletAddress } from "@/lib/polymarket/address";

export interface DbUser {
  id: string;
  privy_user_id: string;
  handle: string;
  display_name: string;
  avatar_url: string | null;
  banner_url: string | null;
  bio: string | null;
  wallet_address: string | null;
  created_at: string;
}

let privyClient: PrivyClient | null = null;
function getPrivyClient(): PrivyClient {
  if (!privyClient) {
    privyClient = new PrivyClient({ appId: env.privyAppId, appSecret: env.privyAppSecret });
  }
  return privyClient;
}

/** Best-effort hints for a first-time user's default handle/wallet —
 * failure here must never block account creation, since Privy's Users
 * API is a convenience lookup, not the source of truth for our own
 * `users` row. */
async function fetchPrivyProfileHints(
  privyUserId: string,
): Promise<{ email?: string | undefined; walletAddress?: string | undefined }> {
  try {
    const user = await getPrivyClient().users()._get(privyUserId);
    const linkedAccounts = user.linked_accounts as unknown as Array<Record<string, unknown>>;
    const email = linkedAccounts.find((a) => a["type"] === "email")?.["email"] as
      string | undefined;
    const walletAddress = linkedAccounts.find((a) => a["type"] === "wallet")?.["address"] as
      string | undefined;
    return { email, walletAddress };
  } catch {
    return {};
  }
}

export interface PrimaryEthereumWallet {
  id: string;
  address: string;
}

/**
 * The caller's Privy-custodied embedded Ethereum wallet — id + address
 * — resolved live from Privy rather than our own cached
 * `users.wallet_address` column, since nothing in this API surface
 * (docs/API.md has no "connect wallet" endpoint) ever tells the
 * backend when a wallet is created/changed after account creation;
 * only Privy itself is the live source of truth. Used by the trading
 * flow, which needs the Privy wallet **id** (not just the address) for
 * the Polymarket client's Privy signer adapter — see
 * `lib/trading/client.ts`. Returns `null` if the user has no embedded
 * Ethereum wallet yet.
 */
export async function getPrimaryEthereumWallet(
  privyUserId: string,
): Promise<PrimaryEthereumWallet | null> {
  const user = await getPrivyClient().users()._get(privyUserId);
  const linkedAccounts = user.linked_accounts as unknown as Array<Record<string, unknown>>;
  const wallet = linkedAccounts.find(
    (a) =>
      a["type"] === "wallet" &&
      a["chain_type"] === "ethereum" &&
      a["wallet_client_type"] === "privy",
  );
  if (!wallet || typeof wallet["id"] !== "string" || typeof wallet["address"] !== "string")
    return null;
  return { id: wallet["id"], address: wallet["address"] };
}

async function uniqueHandle(base: string): Promise<string> {
  const supabase = getSupabase();
  const sanitized = base.replace(/[^a-zA-Z0-9_]/g, "").slice(0, 20) || "user";

  for (let attempt = 0; attempt < 5; attempt++) {
    const candidate =
      attempt === 0 ? sanitized : `${sanitized}${Math.floor(Math.random() * 10_000)}`;
    const { data } = await supabase
      .from("users")
      .select("id")
      .eq("handle", candidate)
      .maybeSingle();
    if (!data) return candidate;
  }
  return `${sanitized}${Date.now()}`;
}

/**
 * Resolves the Privy-authenticated caller to our own `users` row,
 * creating one on first sight — Privy's own auth (email-OTP, embedded
 * wallet) is the account-creation moment for this app; there's no
 * separate signup step. `handle`/`displayName` default to an
 * email-derived or generated placeholder (see `fetchPrivyProfileHints`)
 * — editable afterward via `PATCH /users/me` (docs/DATABASE.md,
 * "Sprint 11" bio/displayName editability).
 */
export async function getOrCreateUser(privyUserId: string): Promise<DbUser> {
  const supabase = getSupabase();

  const { data: existing } = await supabase
    .from("users")
    .select("*")
    .eq("privy_user_id", privyUserId)
    .maybeSingle();
  if (existing) return existing as DbUser;

  const hints = await fetchPrivyProfileHints(privyUserId);
  const baseHandle = hints.email?.split("@")[0] ?? `user${privyUserId.slice(-8)}`;
  const handle = await uniqueHandle(baseHandle);

  const { data: created, error } = await supabase
    .from("users")
    .insert({
      privy_user_id: privyUserId,
      handle,
      display_name: handle,
      wallet_address: hints.walletAddress ?? null,
    })
    .select("*")
    .single();

  if (error) {
    // A concurrent request may have created the row between the select
    // and insert above (no unique constraint race guard beyond the DB's
    // own `handle` uniqueness) — re-select rather than fail the request.
    const { data: raceWinner } = await supabase
      .from("users")
      .select("*")
      .eq("privy_user_id", privyUserId)
      .maybeSingle();
    if (raceWinner) return raceWinner as DbUser;
    throw error;
  }

  return created as DbUser;
}

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** Our own `users` row for a Polymarket wallet, if this app has one. */
export async function findUserByWalletAddress(walletAddress: string): Promise<DbUser | null> {
  const { data } = await getSupabase()
    .from("users")
    .select("*")
    .eq("wallet_address", normalizeWalletAddress(walletAddress))
    .maybeSingle();
  return (data as DbUser | null) ?? null;
}

/** Resolves a `:id` path param that may be the literal `"me"`
 * (docs/API.md, "Literal `me` as the Self-Profile Identifier") to an
 * internal user id. A UUID is trusted as-is — it can only be an id this
 * backend itself emitted in a prior response (a `FeedItem.author.id`,
 * `FollowListItem.user.id`, etc.), never a client-invented value with
 * authorization implications.
 *
 * A wallet address (`0x…`, a `users.wallet_address`) resolves to that
 * account's row when one exists. It stays accepted because it is the exact
 * key `users.wallet_address` is stored under, not because the leaderboard
 * hands out wallet ids any more — `GET /leaderboard`'s rows are Polymarket
 * traders, never profiles (docs/DECISIONS.md, "Round 6: Leaderboard Is a
 * Read-Only Polymarket Ranking — No Follow, No Profile Links"), and no
 * Polymarket trader is ever imported or synthesized into a `users` row.
 * Anything else — including a malformed id, which used to reach Postgres
 * and fail as a `uuid` cast error (a 500) — is an honest 404, so every
 * `users/:id/...` read answers "no such user" instead of "something went
 * wrong".
 */
export async function resolveTargetUserId(
  idParam: string,
  viewerPrivyUserId: string | null,
): Promise<string> {
  if (idParam === "me") {
    if (!viewerPrivyUserId) {
      throw unauthorized('Authentication required to resolve "me".');
    }
    const viewer = await getOrCreateUser(viewerPrivyUserId);
    return viewer.id;
  }

  if (UUID_RE.test(idParam)) return idParam;

  if (isWalletAddress(idParam)) {
    const local = await findUserByWalletAddress(idParam);
    if (local) return local.id;
    throw notFound(`No Knewit profile for wallet ${idParam} yet.`);
  }

  throw notFound(`User ${idParam} not found.`);
}
