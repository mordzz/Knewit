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
  where u.id <> p_user_id
    and not exists (
      select 1
      from follows vf
      where vf.follower_id = p_user_id
        and vf.following_id = u.id
    )
  order by
    (select count(*) from follows mutual
      where mutual.following_id = u.id
        and mutual.follower_id in (
          select followed.following_id from follows followed where followed.follower_id = p_user_id
        )) desc,
    (select count(*) from follows popularity where popularity.following_id = u.id) desc,
    (select max(posts.created_at) from posts where posts.author_id = u.id and posts.created_at >= now() - interval '30 days') desc nulls last,
    u.created_at desc
  limit p_limit offset p_offset;
$$;
