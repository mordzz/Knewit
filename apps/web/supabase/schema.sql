-- Knewit — complete database schema (fresh Supabase project).
--
-- Paste the whole file into the Supabase SQL editor once. It creates the
-- final shape directly — no migration history, no backfills.
--
-- Access model: only the backend talks to the database, with the service
-- role key (src/lib/supabase.ts). Every table has row level security on
-- and no policies, and anon/authenticated are revoked, so the public
-- Supabase keys can read or write nothing. Identity comes from Privy
-- (`users.privy_user_id`), not Supabase Auth.
--
-- Units: prices are cents with 4 decimals (Polymarket ticks go down to
-- 0.01c); sizes are shares; outcomes are the market's own label plus its
-- index in the market's outcome list (`choice_index` → CLOB token).

-- ============================================================
-- Market cache (Polymarket data, keyed by Polymarket's ids)
-- ============================================================

create table events (
  id text primary key,
  title text not null,
  category text not null,
  updated_at timestamptz not null default now()
);

create table markets (
  id text primary key,
  event_id text not null references events (id) on delete cascade,
  question text not null,
  yes_price numeric(10, 4) not null,
  no_price numeric(10, 4) not null,
  volume numeric not null default 0,
  liquidity numeric not null default 0,
  end_date timestamptz,
  resolved boolean not null default false,
  resolved_outcome text check (resolved_outcome in ('YES', 'NO')),
  -- Every outcome of the market, so cards render without a live fetch.
  choices jsonb not null default '[]'::jsonb,
  -- Child of a multi-market event: links open the parent event.
  is_child boolean not null default false,
  updated_at timestamptz not null default now()
);

create index markets_event_id_idx on markets (event_id);

-- ============================================================
-- Users
-- ============================================================

create table users (
  id uuid primary key default gen_random_uuid(),
  privy_user_id text not null unique,
  handle text not null unique,
  display_name text not null,
  avatar_url text,
  banner_url text,
  bio text,
  wallet_address text,
  created_at timestamptz not null default now()
);

create table follows (
  follower_id uuid not null references users (id) on delete cascade,
  following_id uuid not null references users (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (follower_id, following_id),
  constraint follows_no_self_follow check (follower_id <> following_id)
);

create index follows_following_id_idx on follows (following_id);

-- ============================================================
-- Wallet ledger (money-moving actions, server only)
-- ============================================================

-- Written before any on-chain/Polymarket side effect so retries are
-- idempotent and two actions of the same type can never run at once.
--   deposit_forward  card funds: embedded wallet → Polymarket bridge
--   deposit_wrap     USDC.e → pUSD in the Deposit Wallet
--   withdraw         pUSD → USDC.e (→ bridge for other chains)
--   buy / sell       Polymarket orders
create table wallet_operations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references users (id) on delete cascade,
  operation_type text not null check (operation_type in ('deposit_forward', 'deposit_wrap', 'withdraw', 'buy', 'sell')),
  idempotency_key text not null,
  request_hash text not null,
  status text not null default 'pending'
    check (status in ('pending', 'submitted', 'confirmed', 'failed', 'reconciliation_required')),
  provider_order_id text,
  transaction_id text,
  transaction_hash text,
  request jsonb not null default '{}'::jsonb,
  result jsonb,
  error_code text,
  attempts integer not null default 0 check (attempts >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  reconciled_at timestamptz
);

create unique index wallet_operations_idempotency_uidx
  on wallet_operations (user_id, operation_type, idempotency_key);
create unique index wallet_operations_one_active_per_type_idx
  on wallet_operations (user_id, operation_type)
  where status in ('pending', 'submitted', 'reconciliation_required');

-- Every address a user can deposit to, so the Alchemy webhook (which only
-- sees an address) knows whose deposit arrived.
create table deposit_addresses (
  address text primary key check (address = lower(address)),
  user_id uuid not null references users (id) on delete cascade,
  privy_user_id text not null,
  kind text not null check (kind in ('embedded', 'deposit_wallet')),
  webhook_registered_at timestamptz, -- null = not yet added to the Alchemy webhook
  created_at timestamptz not null default now()
);

create index deposit_addresses_user_idx on deposit_addresses (user_id);

-- ============================================================
-- Trading records
-- ============================================================

create table orders (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references users (id) on delete cascade,
  market_id text not null references markets (id) on delete cascade,
  outcome text not null,
  choice_index integer not null default 0,
  size numeric not null,
  price numeric(10, 4) not null,
  status text not null check (status in ('pending', 'filled', 'failed')),
  wallet_operation_id uuid unique references wallet_operations (id),
  created_at timestamptz not null default now()
);

create index orders_user_id_idx on orders (user_id);

create table positions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references users (id) on delete cascade,
  market_id text not null references markets (id) on delete cascade,
  outcome text not null,
  choice_index integer not null default 0,
  entry_price numeric(10, 4) not null,
  size numeric not null,
  wallet_operation_id uuid unique references wallet_operations (id),
  opened_at timestamptz not null default now()
);

create index positions_user_id_idx on positions (user_id);
create index positions_market_id_idx on positions (market_id);

-- ============================================================
-- Social: callouts (posts), comments, likes
-- ============================================================

-- A callout always carries an immutable snapshot of the position it was
-- posted with (position_snapshot_*).
create table posts (
  id uuid primary key default gen_random_uuid(),
  author_id uuid not null references users (id) on delete cascade,
  body text not null,
  market_id text references markets (id) on delete set null,
  position_snapshot_market_id text,
  position_snapshot_outcome text,
  position_snapshot_choice_index integer,
  position_snapshot_entry_price numeric(10, 4),
  position_snapshot_size numeric,
  position_snapshot_captured_at timestamptz,
  like_count integer not null default 0,
  comment_count integer not null default 0,
  created_at timestamptz not null default now()
);

create index posts_author_id_idx on posts (author_id, created_at desc);
create index posts_market_id_idx on posts (market_id);
create index posts_created_at_idx on posts (created_at desc);

create table comments (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references posts (id) on delete cascade,
  author_id uuid not null references users (id) on delete cascade,
  parent_comment_id uuid references comments (id) on delete cascade,
  body text not null,
  like_count integer not null default 0,
  share_count integer not null default 0,
  created_at timestamptz not null default now()
);

create index comments_post_id_idx on comments (post_id);
create index comments_parent_created_at_idx on comments (parent_comment_id, created_at);

-- A reply must point at a comment on the same post.
create function validate_comment_parent_post()
returns trigger
language plpgsql
as $$
begin
  if new.parent_comment_id is not null then
    if new.parent_comment_id = new.id then
      raise exception 'comment cannot reply to itself';
    end if;
    if not exists (
      select 1 from comments parent
      where parent.id = new.parent_comment_id
        and parent.post_id = new.post_id
    ) then
      raise exception 'parent comment must belong to the same post';
    end if;
  end if;
  return new;
end;
$$;

create constraint trigger comments_validate_parent_post
after insert or update of post_id, parent_comment_id on comments
deferrable initially deferred
for each row execute function validate_comment_parent_post();

create table likes (
  user_id uuid not null references users (id) on delete cascade,
  post_id uuid not null references posts (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, post_id)
);

create table comment_likes (
  user_id uuid not null references users (id) on delete cascade,
  comment_id uuid not null references comments (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, comment_id)
);

-- ============================================================
-- Read functions (one round trip per screen)
-- ============================================================

-- Home feed "Trending": engagement decayed by age, last 7 days.
create function trending_posts(p_limit int default 21, p_offset int default 0)
returns setof posts
language sql
stable
as $$
  select p.*
  from posts p
  where p.created_at >= now() - interval '7 days'
  order by
    ((p.like_count + (p.comment_count * 3))::numeric /
      power(extract(epoch from (now() - p.created_at)) / 3600 + 2, 1.2)) desc,
    p.created_at desc,
    p.id desc
  limit p_limit offset p_offset;
$$;

-- Profile counters + whether the viewer follows this user.
create function user_profile_stats(p_user_id uuid, p_viewer_id uuid default null)
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
      where p.author_id = p_user_id and p.position_snapshot_market_id is not null),
    (
      p_viewer_id is not null
      and p_viewer_id <> p_user_id
      and exists (
        select 1 from follows f
        where f.follower_id = p_viewer_id and f.following_id = p_user_id
      )
    );
$$;

-- GET /users/:id — user row + stats.
create function user_profile_overview(p_user_id uuid, p_viewer_id uuid default null)
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

-- Followers ('followers') or following ('following') page of a user,
-- with the viewer's follow state.
create function user_follow_list(
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

-- "Who to follow": users the viewer doesn't follow, by mutual followers,
-- then popularity, then recent activity.
create function user_follow_suggestions(p_user_id uuid, p_limit int default 5, p_offset int default 0)
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
  where u.id <> p_user_id
    and not exists (
      select 1 from follows vf
      where vf.follower_id = p_user_id and vf.following_id = u.id
    )
  order by
    (select count(*) from follows mutual
      where mutual.following_id = u.id
        and mutual.follower_id in (
          select followed.following_id from follows followed where followed.follower_id = p_user_id
        )) desc,
    (select count(*) from follows popularity where popularity.following_id = u.id) desc,
    (select max(posts.created_at) from posts
      where posts.author_id = u.id and posts.created_at >= now() - interval '30 days') desc nulls last,
    u.created_at desc
  limit p_limit offset p_offset;
$$;

-- Profile activity tab: trades, callouts and follows, newest first.
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
      o.id, 'TRADE'::text as type, o.created_at, o.market_id,
      m.question as market_question, o.outcome,
      (o.size * o.price / 100.0)::numeric as usd_amount,
      null::uuid as post_id, null::uuid as followed_user_id,
      null::text as followed_user_handle, null::text as followed_user_display_name
    from orders o
    left join markets m on m.id = o.market_id
    where o.user_id = p_user_id and o.status = 'filled'

    union all

    select
      p.id, 'CALL'::text, p.created_at, p.market_id,
      mk.question, p.position_snapshot_outcome,
      null::numeric, p.id, null::uuid, null::text, null::text
    from posts p
    left join markets mk on mk.id = p.market_id
    where p.author_id = p_user_id and p.position_snapshot_market_id is not null

    union all

    select
      f.following_id, 'FOLLOW'::text, f.created_at, null::text,
      null::text, null::text,
      null::numeric, null::uuid, f.following_id, u.handle, u.display_name
    from follows f
    join users u on u.id = f.following_id
    where f.follower_id = p_user_id
  )
  select * from combined
  order by created_at desc
  limit p_limit offset p_offset;
$$;

-- ============================================================
-- Lockdown: backend (service role) only
-- ============================================================

do $$
declare t text;
begin
  foreach t in array array[
    'events', 'markets', 'users', 'follows', 'wallet_operations', 'deposit_addresses',
    'orders', 'positions', 'posts', 'comments', 'likes', 'comment_likes'
  ] loop
    execute format('alter table %I enable row level security', t);
    execute format('revoke all on table %I from anon, authenticated', t);
    execute format('grant all on table %I to service_role', t);
  end loop;
end $$;

revoke execute on all functions in schema public from anon, authenticated, public;
grant execute on all functions in schema public to service_role;

-- ============================================================
-- Storage: avatar/banner uploads (backend uploads, public read)
-- ============================================================

insert into storage.buckets (id, name, public)
values ('profile-images', 'profile-images', true)
on conflict (id) do nothing;
