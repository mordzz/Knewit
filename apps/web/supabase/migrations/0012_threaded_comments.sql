-- Threaded comments: parent_comment_id may point to any comment in the
-- same callout, enabling nested replies while keeping one comments table.
create index if not exists comments_parent_created_at_idx
  on comments (parent_comment_id, created_at asc);

create or replace function validate_comment_parent_post()
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

drop trigger if exists comments_validate_parent_post on comments;
create constraint trigger comments_validate_parent_post
after insert or update of post_id, parent_comment_id on comments
deferrable initially deferred
for each row execute function validate_comment_parent_post();
