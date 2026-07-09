-- Read-later app schema
-- Run this in the Supabase SQL editor (or via `supabase db push`).

create extension if not exists "pgcrypto";

-- One row per auth.users account, auto-created on signup via trigger below.
-- username powers public profile URLs (/u/[username]) so it must be set at signup time.
create table if not exists profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  username text not null unique,
  full_name text,
  avatar_url text,
  bio text,
  created_at timestamptz not null default now()
);

-- One row per save. Same URL saved by two different users = two rows —
-- each person's save is their own annotated copy, matching Curius's model.
create table if not exists links (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles (id) on delete cascade,
  url text not null,
  title text,
  description text,
  image_url text,
  favicon_url text,
  note text,
  is_private boolean not null default false,
  source text not null default 'web' check (source in ('web', 'pwa_share', 'extension')),
  created_at timestamptz not null default now()
);

create index if not exists links_user_id_created_at_idx on links (user_id, created_at desc);

-- Global tag vocabulary, shared across users (not per-user namespaces).
-- App code normalizes to lowercase before insert.
create table if not exists tags (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  created_at timestamptz not null default now()
);

create table if not exists link_tags (
  link_id uuid not null references links (id) on delete cascade,
  tag_id uuid not null references tags (id) on delete cascade,
  primary key (link_id, tag_id)
);

-- Discussion on a saved link. Keyed to link_id (not denormalized onto
-- links.note) so a later phase can add passage-level highlights via a
-- nullable highlight_id FK without a breaking migration.
create table if not exists comments (
  id uuid primary key default gen_random_uuid(),
  link_id uuid not null references links (id) on delete cascade,
  user_id uuid not null references profiles (id) on delete cascade,
  body text not null,
  created_at timestamptz not null default now()
);

create index if not exists comments_link_id_created_at_idx on comments (link_id, created_at);

create table if not exists follows (
  follower_id uuid not null references profiles (id) on delete cascade,
  following_id uuid not null references profiles (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (follower_id, following_id),
  check (follower_id <> following_id)
);

-- Personal access tokens for the Chrome extension (MV3 service workers can't
-- hold a Supabase session the way a browser tab can — see AGENTS.md).
create table if not exists access_tokens (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles (id) on delete cascade,
  token_hash text not null unique,
  name text not null default 'Chrome extension',
  created_at timestamptz not null default now(),
  last_used_at timestamptz
);

-- Auto-create a profile row whenever a new auth user signs up.
-- username/full_name are passed in via supabase.auth.signUp's `options.data`.
create or replace function handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, username, full_name)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'username', 'user_' || substr(new.id::text, 1, 8)),
    new.raw_user_meta_data ->> 'full_name'
  );
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function handle_new_user();

-- Row Level Security
alter table profiles enable row level security;
alter table links enable row level security;
alter table tags enable row level security;
alter table link_tags enable row level security;
alter table comments enable row level security;
alter table follows enable row level security;
alter table access_tokens enable row level security;

-- profiles: public by default, everyone can view (needed for public profile pages)
create policy "profiles are publicly viewable"
  on profiles for select
  using (true);

create policy "users can update their own profile"
  on profiles for update
  using (auth.uid() = id);

-- links: public-by-default privacy model. is_private = false is visible to
-- anyone (incl. signed-out visitors); is_private = true only to the owner.
create policy "public links are viewable by anyone, private links by owner"
  on links for select
  using (is_private = false or user_id = auth.uid());

create policy "users can create their own links"
  on links for insert
  with check (user_id = auth.uid());

create policy "users can update their own links"
  on links for update
  using (user_id = auth.uid());

create policy "users can delete their own links"
  on links for delete
  using (user_id = auth.uid());

-- tags: public vocabulary, any signed-in user can add a new tag on the fly
create policy "tags are publicly viewable"
  on tags for select
  using (true);

create policy "signed-in users can create tags"
  on tags for insert
  with check (auth.role() = 'authenticated');

-- link_tags: visibility/ownership mirrors the parent link. Safe as a direct
-- exists() check (no recursion risk — the links policy above doesn't
-- reference link_tags, unlike family-chat-app's thread_participants case
-- which needed a security-definer function to avoid self-referential recursion).
create policy "link_tags follow parent link visibility"
  on link_tags for select
  using (
    exists (
      select 1 from links
      where links.id = link_tags.link_id
        and (links.is_private = false or links.user_id = auth.uid())
    )
  );

create policy "link owners can tag their own links"
  on link_tags for insert
  with check (
    exists (select 1 from links where links.id = link_tags.link_id and links.user_id = auth.uid())
  );

create policy "link owners can untag their own links"
  on link_tags for delete
  using (
    exists (select 1 from links where links.id = link_tags.link_id and links.user_id = auth.uid())
  );

-- comments: visibility mirrors the parent link; only the comment's own
-- author can edit/delete it (not the link owner).
create policy "comments follow parent link visibility"
  on comments for select
  using (
    exists (
      select 1 from links
      where links.id = comments.link_id
        and (links.is_private = false or links.user_id = auth.uid())
    )
  );

create policy "signed-in users can comment on visible links"
  on comments for insert
  with check (
    user_id = auth.uid()
    and exists (
      select 1 from links
      where links.id = comments.link_id
        and (links.is_private = false or links.user_id = auth.uid())
    )
  );

create policy "users can update their own comments"
  on comments for update
  using (user_id = auth.uid());

create policy "users can delete their own comments"
  on comments for delete
  using (user_id = auth.uid());

-- follows: follower lists are public (needed for followers/following pages)
create policy "follows are publicly viewable"
  on follows for select
  using (true);

create policy "users can follow others as themselves"
  on follows for insert
  with check (follower_id = auth.uid());

create policy "users can unfollow as themselves"
  on follows for delete
  using (follower_id = auth.uid());

-- access_tokens: fully private to the owning user. Reads/writes from the app
-- itself go through this policy; the extension's own bearer-token auth path
-- uses the admin/service-role client, which bypasses RLS entirely.
create policy "users manage their own access tokens"
  on access_tokens for all
  using (user_id = auth.uid())
  with check (user_id = auth.uid());
