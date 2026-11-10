-- VentureHub database schema for Supabase (PostgreSQL)
-- Run this in Supabase Dashboard > SQL Editor.
create extension if not exists pgcrypto;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null default 'Community member',
  bio text default '',
  role text not null default 'member' check (role in ('member','admin')),
  created_at timestamptz not null default now()
);

create table if not exists public.ideas (
  id uuid primary key default gen_random_uuid(),
  author_id uuid not null references public.profiles(id) on delete cascade,
  title text not null check (char_length(title) between 5 and 100),
  category text not null,
  stage text not null default 'Exploring',
  plan text not null check (char_length(plan) >= 20),
  startup_costs text not null,
  projected_monthly_revenue text not null,
  help_needed text default '',
  status text not null default 'published' check (status in ('published','hidden','removed')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.comments (
  id uuid primary key default gen_random_uuid(),
  idea_id uuid not null references public.ideas(id) on delete cascade,
  author_id uuid not null references public.profiles(id) on delete cascade,
  parent_id uuid references public.comments(id) on delete cascade,
  body text not null check (char_length(body) between 1 and 3000),
  created_at timestamptz not null default now()
);

create index if not exists ideas_created_at_idx on public.ideas(created_at desc);
create index if not exists ideas_category_idx on public.ideas(category);
create index if not exists comments_idea_idx on public.comments(idea_id, created_at);

-- Automatically create a member profile after email sign-up.
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  insert into public.profiles (id, full_name)
  values (new.id, coalesce(new.raw_user_meta_data ->> 'full_name', 'Community member'));
  return new;
end;
$$;
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created after insert on auth.users
for each row execute procedure public.handle_new_user();

-- Helper avoids recursive profile RLS policies.
create or replace function public.is_admin()
returns boolean language sql stable security definer set search_path = public as $$
  select exists(select 1 from public.profiles where id = auth.uid() and role = 'admin');
$$;

alter table public.profiles enable row level security;
alter table public.ideas enable row level security;
alter table public.comments enable row level security;

create policy "Profiles are publicly readable" on public.profiles
for select using (true);
create policy "Members update own profile" on public.profiles
for update using (auth.uid() = id or public.is_admin())
with check (auth.uid() = id or public.is_admin());

create policy "Published ideas are public" on public.ideas
for select using (status = 'published' or author_id = auth.uid() or public.is_admin());
create policy "Members create ideas" on public.ideas
for insert with check (auth.uid() = author_id);
create policy "Authors and admins update ideas" on public.ideas
for update using (auth.uid() = author_id or public.is_admin())
with check (auth.uid() = author_id or public.is_admin());
create policy "Authors and admins delete ideas" on public.ideas
for delete using (auth.uid() = author_id or public.is_admin());

create policy "Comments on visible ideas are readable" on public.comments
for select using (exists(select 1 from public.ideas i where i.id = idea_id and (i.status = 'published' or i.author_id = auth.uid() or public.is_admin())));
create policy "Members comment on published ideas" on public.comments
for insert with check (
  auth.uid() = author_id and
  exists(select 1 from public.ideas i where i.id = idea_id and i.status = 'published')
);
create policy "Authors and admins delete comments" on public.comments
for delete using (auth.uid() = author_id or public.is_admin());

-- IMPORTANT: after creating your account, promote a trusted account to admin
-- manually in the Supabase SQL editor:
-- update public.profiles set role = 'admin' where id = 'YOUR-AUTH-USER-UUID';
-- Never expose a service_role key in config.js or frontend code.
