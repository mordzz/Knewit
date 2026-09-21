import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { env } from '@/lib/env';

let client: SupabaseClient | null = null;

/**
 * Server-only Supabase client using the service role key — bypasses
 * Row Level Security, so this must never be imported by client code.
 * There is no client code in this project (backend-only repo), but the
 * naming/comment matches the security boundary documented in
 * docs/ARCHITECTURE.md regardless.
 *
 * No generated `Database` type is wired up (no `supabase gen types`
 * step in this pass — see the web app README), so this is the
 * untyped `SupabaseClient` — every table read/write in `src/lib/`
 * is typed by hand against `supabase/migrations/0001_init.sql`
 * instead of inferred from a schema type. A follow-up could generate
 * and wire in real types for compile-time column checking.
 */
export function getSupabase(): SupabaseClient {
  if (!client) {
    client = createClient(env.supabaseUrl, env.supabaseServiceRoleKey, {
      auth: { persistSession: false },
    });
  }
  return client;
}
