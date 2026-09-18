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
