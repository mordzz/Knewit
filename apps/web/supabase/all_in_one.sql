-- Knewit - complete Supabase setup (all migrations in one file).
--
-- Paste the whole file into the Supabase SQL editor (or run it with the
-- Supabase CLI). Generated from the numbered files in
-- `supabase/migrations/` - the canonical source, kept for history and
-- referenced by code comments.
--
-- Re-runnable: tables/indexes use IF NOT EXISTS, functions are dropped
-- before being recreated when their return type changes, and the data
-- backfills are idempotent. That means it is safe to run again after a
-- partially-applied run (for example after the 42P13 error older copies
-- of 0003/0004 could throw) - no need to drop the database.
--
-- Fresh project: run it once and you are done. Existing project with
-- data: re-running never deletes or rewrites rows - the only DELETE is
-- 0006's removal of the legacy position-less Posts, which is already done
-- if you are on a current database.

-- ============================================================
-- 0001_init.sql
-- ============================================================

-- Full schema per docs/DATABASE.md. Written once, upfront, since the
-- entity model there is already complete — later phases (social,
-- trading) add API endpoints against these tables, not new migrations
-- for the core shape. Only `events`/`markets` are populated by the
-- Foundation phase (Phase 1); the rest exist now so Phase 2/3 don't
-- need a schema migration of their own.

create extension if not exists pgcrypto;

-- Event/Market: a cache of Polymarket data, not authored by our users
-- (docs/DATABASE.md). Primary keys are Polymarket's own string ids, not
-- generated uuids, since we're caching their records under their ids.
create table if not exists events (
  id text primary key,
  title text not null,
  category text not null,
  updated_at timestamptz not null default now()
);

create table if not exists markets (
  id text primary key,
  event_id text not null references events (id) on delete cascade,
  question text not null,
  yes_price integer not null, -- cents, 1-99
  no_price integer not null, -- cents, 1-99
  volume numeric not null default 0,
  liquidity numeric not null default 0,
  end_date timestamptz,
  resolved boolean not null default false,
  resolved_outcome text check (resolved_outcome in ('YES', 'NO')),
  updated_at timestamptz not null default now()
);

create index if not exists markets_event_id_idx on markets (event_id);

create table if not exists users (
  id uuid primary key default gen_random_uuid(),
  privy_user_id text not null unique,
  handle text not null unique,
  display_name text not null,
  avatar_url text,
  bio text,
  wallet_address text,
  created_at timestamptz not null default now()
);

create table if not exists positions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references users (id) on delete cascade,
  market_id text not null references markets (id) on delete cascade,
  outcome text not null check (outcome in ('YES', 'NO')),
  entry_price integer not null, -- cents
  size numeric not null, -- shares
  opened_at timestamptz not null default now()
);

create index if not exists positions_user_id_idx on positions (user_id);
create index if not exists positions_market_id_idx on positions (market_id);

create table if not exists orders (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references users (id) on delete cascade,
  market_id text not null references markets (id) on delete cascade,
  outcome text not null check (outcome in ('YES', 'NO')),
  size numeric not null,
  price integer not null, -- cents
  status text not null check (status in ('pending', 'filled', 'failed')),
  created_at timestamptz not null default now()
);

create index if not exists orders_user_id_idx on orders (user_id);
create index if not exists orders_market_id_status_idx on orders (market_id, status);

-- A "Call" is a Post whose position_snapshot_* fields are non-null —
-- no separate Call table (docs/SOCIAL-FEATURE.md, docs/DATABASE.md).
-- The snapshot is embedded and immutable: no UPDATE path should ever
-- touch these columns after insert.
create table if not exists posts (
  id uuid primary key default gen_random_uuid(),
  author_id uuid not null references users (id) on delete cascade,
  body text not null,
  market_id text references markets (id) on delete set null,
  position_snapshot_market_id text,
  position_snapshot_outcome text check (position_snapshot_outcome in ('YES', 'NO')),
  position_snapshot_entry_price integer, -- cents
  position_snapshot_size numeric, -- shares
  position_snapshot_captured_at timestamptz,
  like_count integer not null default 0,
  comment_count integer not null default 0,
  created_at timestamptz not null default now()
);

create index if not exists posts_author_id_idx on posts (author_id);
create index if not exists posts_market_id_idx on posts (market_id);
create index if not exists posts_created_at_idx on posts (created_at desc);

-- One level deep in MVP: parent_comment_id always points at a
-- top-level comment, never another reply (docs/DATABASE.md, "One
-- Reply Level").
create table if not exists comments (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references posts (id) on delete cascade,
  author_id uuid not null references users (id) on delete cascade,
  parent_comment_id uuid references comments (id) on delete cascade,
  body text not null,
  like_count integer not null default 0,
  share_count integer not null default 0,
  created_at timestamptz not null default now()
);

create index if not exists comments_post_id_idx on comments (post_id);
create index if not exists comments_parent_comment_id_idx on comments (parent_comment_id);

create table if not exists likes (
  user_id uuid not null references users (id) on delete cascade,
  post_id uuid not null references posts (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, post_id)
);

create table if not exists comment_likes (
  user_id uuid not null references users (id) on delete cascade,
  comment_id uuid not null references comments (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, comment_id)
);

create table if not exists follows (
  follower_id uuid not null references users (id) on delete cascade,
  following_id uuid not null references users (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (follower_id, following_id),
  constraint follows_no_self_follow check (follower_id <> following_id)
);

create index if not exists follows_following_id_idx on follows (following_id);

-- ============================================================
-- 0002_leaderboard.sql
-- ============================================================

-- Leaderboard ranking (docs/DATABASE.md: "SUM(Order.size * Order.price)
-- per userId for status = 'filled' orders, ranked descending, tie-break
-- by createdAt ASC on the user's earliest filled order") — volume only,
-- never PnL, see docs/DECISIONS.md. A SQL function rather than pulling
-- every order row into the backend and aggregating in JS, since ranking
-- is exactly what the database is good at.
--
-- Returns the *full* ranking, unpaginated — the backend
-- (app/api/leaderboard/route.ts) pages and looks up the viewer's own
-- rank from this single result set, which is fine at this project's
-- current scale (bounded by distinct traders, not total orders).
create or replace function leaderboard_ranking(p_follower_id uuid default null)
returns table (
  user_id uuid,
  volume numeric,
  rank bigint
)
language sql
stable
as $$
  select
    o.user_id,
    sum(o.size * o.price / 100.0) as volume,
    rank() over (order by sum(o.size * o.price / 100.0) desc, min(o.created_at) asc) as rank
  from orders o
  where o.status = 'filled'
    and (
      p_follower_id is null
      or o.user_id in (select following_id from follows where follower_id = p_follower_id)
    )
  group by o.user_id
  order by rank asc;
$$;

-- ============================================================
-- 0003_user_activity.sql
-- ============================================================

-- Backs `GET /users/:id/activity` (docs/API.md) — a paginated union of
-- four event types this app can actually produce (TRADE, CALL, POST,
-- FOLLOW; see apps/frontend/src/types/activity.ts, "Activity Types
-- Limited to What This App Can Actually Produce"). A SQL UNION ALL
-- with ORDER BY/LIMIT/OFFSET rather than pulling all four tables into
-- the backend and merge-sorting in JS. The function is dropped first:
-- `create or replace` cannot change a return type, so re-running this
-- file over a newer `user_activity` (0004 / 0010) would otherwise fail
-- with `42P13`.
drop function if exists user_activity(uuid, integer, integer);

create function user_activity(p_user_id uuid, p_limit int default 21, p_offset int default 0)
returns table (
  id uuid,
  type text,
  created_at timestamptz,
  market_id text,
  market_question text,
  outcome text,
  usd_amount numeric,
  post_id uuid,
  followed_user_id uuid
)
language sql
stable
as $$
  with combined as (
    select
      o.id,
      'TRADE'::text as type,
      o.created_at,
      o.market_id,
      m.question as market_question,
      o.outcome,
      (o.size * o.price / 100.0)::numeric as usd_amount,
      null::uuid as post_id,
      null::uuid as followed_user_id
    from orders o
    left join markets m on m.id = o.market_id
    where o.user_id = p_user_id and o.status = 'filled'

    union all

    select
      p.id,
      'CALL'::text,
      p.created_at,
      p.market_id,
      mk.question,
      p.position_snapshot_outcome,
      null::numeric,
      p.id,
      null::uuid
    from posts p
    left join markets mk on mk.id = p.market_id
    where p.author_id = p_user_id and p.position_snapshot_market_id is not null

    union all

    select
      p.id,
      'POST'::text,
      p.created_at,
      null::text,
      null::text,
      null::text,
      null::numeric,
      p.id,
      null::uuid
    from posts p
    where p.author_id = p_user_id and p.position_snapshot_market_id is null

    union all

    select
      f.following_id,
      'FOLLOW'::text,
      f.created_at,
      null::text,
      null::text,
      null::text,
      null::numeric,
      null::uuid,
      f.following_id
    from follows f
    where f.follower_id = p_user_id
  )
  select * from combined
  order by created_at desc
  limit p_limit offset p_offset;
$$;

-- ============================================================
-- 0004_market_choices.sql
-- ============================================================

-- Trading any Polymarket choice (docs/DECISIONS.md, "Trading Any
-- Polymarket Choice"). Positions/orders/snapshots used to be constrained
-- to literal YES/NO; they now store the chosen outcome's own label (the
-- API's `outcomes` array entry, e.g. "Manchester City") plus its index in
-- that array — the index is what maps to a CLOB token
-- (`clobTokenIds[index]`). `markets` also caches the choice list so feed
-- cards can render every option without a live round-trip.

alter table markets add column if not exists choices jsonb not null default '[]'::jsonb;

alter table positions drop constraint if exists positions_outcome_check;
alter table positions add column if not exists choice_index integer not null default 0;
-- Legacy rows could only be Yes/No markets, and Polymarket lists
-- "Yes" before "No" in that array, so this is an honest best-effort.
update positions set choice_index = 1 where outcome = 'NO';

alter table orders drop constraint if exists orders_outcome_check;
alter table orders add column if not exists choice_index integer not null default 0;
update orders set choice_index = 1 where outcome = 'NO';

alter table posts drop constraint if exists posts_position_snapshot_outcome_check;
alter table posts add column if not exists position_snapshot_choice_index integer;
update posts set position_snapshot_choice_index = case when position_snapshot_outcome = 'NO' then 1 else 0 end
where position_snapshot_outcome is not null;

-- Recreated from 0003 with the choice index added to each variant. The
-- label itself keeps the `outcome` column name/shape the clients already
-- read. The return type changes (a new column), so the old function must
-- be dropped first — `create or replace` alone fails with
-- `42P13 cannot change return type of existing function`.
drop function if exists user_activity(uuid, integer, integer);

create function user_activity(p_user_id uuid, p_limit int default 21, p_offset int default 0)
returns table (
  id uuid,
  type text,
  created_at timestamptz,
  market_id text,
  market_question text,
  outcome text,
  choice_index integer,
  usd_amount numeric,
  post_id uuid,
  followed_user_id uuid
)
language sql
stable
as $$
  with combined as (
    select
      o.id,
      'TRADE'::text as type,
      o.created_at,
      o.market_id,
      m.question as market_question,
      o.outcome,
      o.choice_index,
      (o.size * o.price / 100.0)::numeric as usd_amount,
      null::uuid as post_id,
      null::uuid as followed_user_id
    from orders o
    left join markets m on m.id = o.market_id
    where o.user_id = p_user_id and o.status = 'filled'

    union all

    select
      p.id,
      'CALL'::text,
      p.created_at,
      p.market_id,
      mk.question,
      p.position_snapshot_outcome,
      coalesce(p.position_snapshot_choice_index, 0),
      null::numeric,
      p.id,
      null::uuid
    from posts p
    left join markets mk on mk.id = p.market_id
    where p.author_id = p_user_id and p.position_snapshot_market_id is not null

    union all

    select
      p.id,
      'POST'::text,
      p.created_at,
      null::text,
      null::text,
      null::text,
      null::integer,
      null::numeric,
      p.id,
      null::uuid
    from posts p
    where p.author_id = p_user_id and p.position_snapshot_market_id is null

    union all

    select
      f.following_id,
      'FOLLOW'::text,
      f.created_at,
      null::text,
      null::text,
      null::text,
      null::integer,
      null::numeric,
      null::uuid,
      f.following_id
    from follows f
    where f.follower_id = p_user_id
  )
  select * from combined
  order by created_at desc
  limit p_limit offset p_offset;
$$;

-- ============================================================
-- 0005_market_child_flag.sql
-- ============================================================

-- Whether a cached market is a child of an event with more than one
-- market ("market anak"). Feed/detail reads use it to route a post's
-- market attachment to the parent event's detail page instead of the
-- child market's own page (docs/DECISIONS.md, "Attachment of a Child
-- Market Opens Its Parent Event").
alter table markets add column if not exists is_child boolean not null default false;

-- Best-effort backfill for rows cached before this column existed: a
-- market is a child when another cached market shares its event.
update markets m
set is_child = true
where exists (
  select 1
  from markets m2
  where m2.event_id = m.event_id
    and m2.id <> m.id
);

-- ============================================================
-- 0006_remove_legacy_posts.sql
-- ============================================================

-- Normal Posts are gone: only Callouts exist, and every Callout attaches
-- a held position (`position_snapshot_market_id` non-null — docs/
-- DECISIONS.md, "Callouts Require a Held Position"). Rows with a null
-- snapshot are legacy normal Posts that can never be created again, so
-- they're removed rather than left rendering as a UI the app no longer
-- has. `comments` and `likes` cascade on the FK to `posts`.
delete from posts where position_snapshot_market_id is null;

-- ============================================================
-- 0007_decimal_prices.sql
-- ============================================================

-- Prices are cents with up to 4 decimal places, not whole cents:
-- Polymarket's tick sizes go as low as 0.001/0.0001 (0.1c/0.01c), so an
-- integer cents column silently rounds a real 0.1c price to 0 — which
-- broke trade estimates (a $1 order at $0.001/share really is 1000
-- shares) and would corrupt entry-price/PnL math for any sub-cent fill.
-- Widening to numeric(10,4) keeps the existing "cents" unit everywhere
-- while preserving the venue's own precision (docs/DECISIONS.md,
-- "Sub-Cent Prices").
alter table markets alter column yes_price type numeric(10, 4);
alter table markets alter column no_price type numeric(10, 4);
alter table orders alter column price type numeric(10, 4);
alter table positions alter column entry_price type numeric(10, 4);
alter table posts alter column position_snapshot_entry_price type numeric(10, 4);

-- ============================================================
-- 0008_profile_images.sql
-- ============================================================

-- Profile images: avatar/banner uploads go through the backend's service
-- role into this public bucket; only the resulting public URL is stored
-- on the user row (docs/DECISIONS.md, "Profile Banner, Avatar, and
-- Username Editing").
alter table users add column if not exists banner_url text;

insert into storage.buckets (id, name, public)
values ('profile-images', 'profile-images', true)
on conflict (id) do nothing;

-- ============================================================
-- 0009_follow_suggestions.sql
-- ============================================================

-- Backs `GET /users/suggestions` — the tablet/desktop "Who to follow"
-- rail (docs/API.md; docs/DECISIONS.md, "Follow Suggestions Sourced From
-- Our Own Most-Followed Accounts"). Knewit accounts only: users this
-- viewer does not follow (and is not), ordered by follower count then
-- recency — the same query shape as `user_activity` (0003), not an N+1
-- of per-user counts in JS.
create or replace function user_follow_suggestions(
  p_user_id uuid,
  p_limit int default 5,
  p_offset int default 0
)
returns table (
  id uuid,
  handle text,
  display_name text,
  avatar_url text
)
language sql
stable
as $$
  select u.id, u.handle, u.display_name, u.avatar_url
  from users u
  left join follows f on f.following_id = u.id
  where u.id <> p_user_id
    and not exists (
      select 1
      from follows vf
      where vf.follower_id = p_user_id
        and vf.following_id = u.id
    )
  group by u.id, u.handle, u.display_name, u.avatar_url, u.created_at
  order by count(f.follower_id) desc, u.created_at desc
  limit p_limit offset p_offset;
$$;

-- ============================================================
-- 0010_single_query_reads.sql
-- ============================================================

-- Single-query read paths (docs/DECISIONS.md, "Single-Query Read Paths"):
-- consolidate the multi-round-trip reads the audit found — profile stats,
-- profile overview, followers/following lists, and the activity feed's
-- followed-user lookup — into one SQL function each. Same pattern as
-- `user_activity` (0003) and `user_follow_suggestions` (0009): the
-- database does the joins/aggregates once instead of the route stitching
-- several PostgREST responses together.

-- 1) Profile counts + is_following, used by every response that returns
-- a UserProfile (GET/PATCH /users/me, image upload, profile read).
create or replace function user_profile_stats(p_user_id uuid, p_viewer_id uuid default null)
returns table (
  follower_count bigint,
  following_count bigint,
  call_count bigint,
  is_following boolean
)
language sql
stable
as $$
  select
    (select count(*) from follows f where f.following_id = p_user_id),
    (select count(*) from follows f where f.follower_id = p_user_id),
    (select count(*) from posts p
      where p.author_id = p_user_id
        and p.position_snapshot_market_id is not null),
    (
      p_viewer_id is not null
      and p_viewer_id <> p_user_id
      and exists (
        select 1 from follows f
        where f.follower_id = p_viewer_id and f.following_id = p_user_id
      )
    );
$$;

-- 2) The full profile read in one round trip: the user row plus the same
-- stats above (GET /users/:id).
create or replace function user_profile_overview(p_user_id uuid, p_viewer_id uuid default null)
returns table (
  id uuid,
  handle text,
  display_name text,
  avatar_url text,
  banner_url text,
  bio text,
  wallet_address text,
  privy_user_id text,
  created_at timestamptz,
  follower_count bigint,
  following_count bigint,
  call_count bigint,
  is_following boolean
)
language sql
stable
as $$
  select
    u.id, u.handle, u.display_name, u.avatar_url, u.banner_url, u.bio,
    u.wallet_address, u.privy_user_id, u.created_at,
    s.follower_count, s.following_count, s.call_count, s.is_following
  from users u
  cross join lateral user_profile_stats(u.id, p_viewer_id) s
  where u.id = p_user_id;
$$;

-- 3) Followers/following pages: the edge page, the users, and the
-- viewer-relative follow state in one query. `p_direction` is
-- 'followers' (who follows the target) or 'following' (who the target
-- follows); anything else returns an empty page.
create or replace function user_follow_list(
  p_target_id uuid,
  p_viewer_id uuid default null,
  p_direction text default 'followers',
  p_limit int default 21,
  p_offset int default 0
)
returns table (
  id uuid,
  handle text,
  display_name text,
  avatar_url text,
  is_following boolean,
  is_self boolean
)
language sql
stable
as $$
  with edges as (
    select
      case when p_direction = 'followers' then f.follower_id else f.following_id end as user_id,
      f.created_at
    from follows f
    where (p_direction = 'followers' and f.following_id = p_target_id)
       or (p_direction = 'following' and f.follower_id = p_target_id)
    order by f.created_at desc
    limit p_limit offset p_offset
  )
  select
    u.id, u.handle, u.display_name, u.avatar_url,
    (
      p_viewer_id is not null
      and exists (
        select 1 from follows vf
        where vf.follower_id = p_viewer_id and vf.following_id = u.id
      )
    ) as is_following,
    (u.id = p_viewer_id) as is_self
  from edges e
  join users u on u.id = e.user_id
  order by e.created_at desc;
$$;

-- 4) Activity feed: the same union as 0003, now carrying the followed
-- user's handle/display name inline (the route used to fetch them in a
-- second query), and without the legacy `POST` arm — normal Posts were
-- removed, so it could only ever produce rows the route discards.
drop function if exists user_activity(uuid, int, int);

create function user_activity(p_user_id uuid, p_limit int default 21, p_offset int default 0)
returns table (
  id uuid,
  type text,
  created_at timestamptz,
  market_id text,
  market_question text,
  outcome text,
  usd_amount numeric,
  post_id uuid,
  followed_user_id uuid,
  followed_user_handle text,
  followed_user_display_name text
)
language sql
stable
as $$
  with combined as (
    select
      o.id,
      'TRADE'::text as type,
      o.created_at,
      o.market_id,
      m.question as market_question,
      o.outcome,
      (o.size * o.price / 100.0)::numeric as usd_amount,
      null::uuid as post_id,
      null::uuid as followed_user_id,
      null::text as followed_user_handle,
      null::text as followed_user_display_name
    from orders o
    left join markets m on m.id = o.market_id
    where o.user_id = p_user_id and o.status = 'filled'

    union all

    select
      p.id,
      'CALL'::text,
      p.created_at,
      p.market_id,
      mk.question,
      p.position_snapshot_outcome,
      null::numeric,
      p.id,
      null::uuid,
      null::text,
      null::text
    from posts p
    left join markets mk on mk.id = p.market_id
    where p.author_id = p_user_id and p.position_snapshot_market_id is not null

    union all

    select
      f.following_id,
      'FOLLOW'::text,
      f.created_at,
      null::text,
      null::text,
      null::text,
      null::numeric,
      null::uuid,
      f.following_id,
      u.handle,
      u.display_name
    from follows f
    join users u on u.id = f.following_id
    where f.follower_id = p_user_id
  )
  select * from combined
  order by created_at desc
  limit p_limit offset p_offset;
$$;

-- ============================================================
-- 0011_drop_legacy_leaderboard_function.sql
-- ============================================================

-- Dead DB surface: `leaderboard_ranking` (0002) was the local
-- orders-aggregate ranking from before the leaderboard moved to
-- Polymarket's own live ranking (docs/DECISIONS.md, "Leaderboard Sourced
-- Live from Polymarket's Data API"). No code calls it any more — drop it
-- rather than leave an unused function behind.
drop function if exists leaderboard_ranking(uuid);
