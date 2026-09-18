-- Profile images: avatar/banner uploads go through the backend's service
-- role into this public bucket; only the resulting public URL is stored
-- on the user row (docs/DECISIONS.md, "Profile Banner, Avatar, and
-- Username Editing").
alter table users add column if not exists banner_url text;

insert into storage.buckets (id, name, public)
values ('profile-images', 'profile-images', true)
on conflict (id) do nothing;
