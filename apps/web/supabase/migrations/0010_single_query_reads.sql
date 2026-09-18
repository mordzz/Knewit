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
