-- ===== Tables =====
create table profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  nickname text not null default '',
  is_admin boolean not null default false,
  created_at timestamptz not null default now()
);
create table episodes (
  id uuid primary key default gen_random_uuid(),
  vol int not null,
  title text not null,
  intro text not null default '',
  cover_color text default '#5B6B74',
  created_by uuid references profiles(id) on delete set null,
  created_at timestamptz not null default now()
);
create table tracks (
  id uuid primary key default gen_random_uuid(),
  episode_id uuid not null references episodes(id) on delete cascade,
  artist text not null default '',
  song text not null default '',
  url text default '',
  reason text not null default '',
  created_by uuid references profiles(id) on delete set null,
  created_at timestamptz not null default now()
);
create table comments (
  id uuid primary key default gen_random_uuid(),
  episode_id uuid not null references episodes(id) on delete cascade,
  body text not null,
  created_by uuid references profiles(id) on delete set null,
  created_at timestamptz not null default now()
);
create table topics (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text not null default '',
  status text not null default 'candidate',
  created_by uuid references profiles(id) on delete set null,
  created_at timestamptz not null default now()
);
create table votes (
  topic_id uuid not null references topics(id) on delete cascade,
  user_id  uuid not null references profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (topic_id, user_id)
);

-- ===== New-user profile trigger =====
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, nickname)
  values (new.id, coalesce(new.raw_user_meta_data->>'name', split_part(new.email, '@', 1)));
  return new;
end; $$;
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ===== admin helper =====
create or replace function public.is_admin()
returns boolean language sql security definer stable set search_path = public as $$
  select coalesce((select is_admin from public.profiles where id = auth.uid()), false);
$$;

-- ===== Prevent non-admin self-elevation on profiles =====
create or replace function public.guard_profile_admin()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if new.is_admin is distinct from old.is_admin and not public.is_admin() then
    raise exception 'only admin can change is_admin';
  end if;
  return new;
end; $$;
drop trigger if exists trg_guard_profile_admin on public.profiles;
create trigger trg_guard_profile_admin
  before update on public.profiles
  for each row execute procedure public.guard_profile_admin();

-- ===== confirm_topic RPC (admin only) =====
create or replace function public.confirm_topic(p_topic uuid)
returns episodes language plpgsql security definer set search_path = public as $$
declare v_next int; v_topic topics; v_ep episodes;
begin
  if not public.is_admin() then raise exception 'admin only'; end if;
  select * into v_topic from topics where id = p_topic;
  if v_topic is null then raise exception 'topic not found'; end if;
  select coalesce(max(vol),0)+1 into v_next from episodes;
  insert into episodes (vol, title, intro, created_by)
    values (v_next, v_topic.title, v_topic.description, auth.uid())
    returning * into v_ep;
  update topics set status = 'confirmed' where id = p_topic;
  return v_ep;
end; $$;

-- ===== RLS =====
alter table profiles enable row level security;
alter table episodes enable row level security;
alter table tracks   enable row level security;
alter table comments enable row level security;
alter table topics   enable row level security;
alter table votes    enable row level security;

-- profiles: everyone reads; user updates own row (admin change guarded by trigger); admin updates anyone
create policy profiles_sel on profiles for select using (true);
create policy profiles_upd_own on profiles for update using (id = auth.uid()) with check (id = auth.uid());
create policy profiles_upd_admin on profiles for update using (public.is_admin());

-- episodes: everyone reads; only admin writes
create policy episodes_sel on episodes for select using (true);
create policy episodes_ins on episodes for insert with check (public.is_admin());
create policy episodes_upd on episodes for update using (public.is_admin());
create policy episodes_del on episodes for delete using (public.is_admin());

-- tracks
create policy tracks_sel on tracks for select using (true);
create policy tracks_ins on tracks for insert with check (auth.uid() = created_by);
create policy tracks_upd on tracks for update using (created_by = auth.uid() or public.is_admin());
create policy tracks_del on tracks for delete using (created_by = auth.uid() or public.is_admin());

-- comments
create policy comments_sel on comments for select using (true);
create policy comments_ins on comments for insert with check (auth.uid() = created_by);
create policy comments_upd on comments for update using (created_by = auth.uid() or public.is_admin());
create policy comments_del on comments for delete using (created_by = auth.uid() or public.is_admin());

-- topics (status flips to 'confirmed' only via confirm_topic RPC, which is security definer)
create policy topics_sel on topics for select using (true);
create policy topics_ins on topics for insert with check (auth.uid() = created_by);
create policy topics_upd on topics for update using (created_by = auth.uid() or public.is_admin());
create policy topics_del on topics for delete using (created_by = auth.uid() or public.is_admin());

-- votes
create policy votes_sel on votes for select using (true);
create policy votes_ins on votes for insert with check (user_id = auth.uid());
create policy votes_del on votes for delete using (user_id = auth.uid());
