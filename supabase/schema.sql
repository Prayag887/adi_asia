create extension if not exists pgcrypto;

create table if not exists public.site_content (
  key text primary key,
  value text not null
);

create table if not exists public.posts (
  id uuid primary key default gen_random_uuid(),
  title text not null check (char_length(title) between 1 and 300),
  excerpt text not null default '' check (char_length(excerpt) <= 500),
  body text not null,
  published boolean not null default false,
  published_at timestamptz,
  author uuid not null references auth.users(id) on delete cascade,
  cover_url text,
  created_at timestamptz not null default now()
);

create index if not exists posts_published_at_idx on public.posts (published_at desc) where published = true;

-- Safe to rerun for projects created from an earlier schema where covers were required.
alter table public.posts alter column cover_url drop not null;

create table if not exists public.section_visibility (
  section_key text primary key,
  visible boolean not null default true
);

create table if not exists public.custom_sections (
  id uuid primary key default gen_random_uuid(),
  title text not null check (char_length(title) between 1 and 160),
  body text not null,
  position integer not null,
  created_at timestamptz not null default now()
);

alter table public.site_content enable row level security;
alter table public.posts enable row level security;
alter table public.section_visibility enable row level security;
alter table public.custom_sections enable row level security;

create policy "Public can read site content" on public.site_content for select using (true);
create policy "Editors can manage site content" on public.site_content for all to authenticated using (true) with check (true);

create policy "Public can read published posts" on public.posts for select using (published = true);
create policy "Editors can create their own posts" on public.posts for insert to authenticated with check (author = auth.uid());
create policy "Editors can update their own posts" on public.posts for update to authenticated using (author = auth.uid()) with check (author = auth.uid());
create policy "Editors can delete their own posts" on public.posts for delete to authenticated using (author = auth.uid());

create policy "Public can read section visibility" on public.section_visibility for select using (true);
create policy "Editors can manage section visibility" on public.section_visibility for all to authenticated using (true) with check (true);

create policy "Public can read custom sections" on public.custom_sections for select using (true);
create policy "Editors can manage custom sections" on public.custom_sections for all to authenticated using (true) with check (true);

insert into public.section_visibility (section_key, visible) values
  ('hero', true), ('about', true), ('ourWork', true), ('sectoralFocus', true),
  ('asgpp', true), ('impact', true), ('contact', true)
on conflict (section_key) do nothing;

-- Content carried forward from the local PocketBase instance.
insert into public.site_content (key, value) values
  ('page:p:2:0', 'An independent platform advancing peace across Asia through mediation, sustained engagement, and context-driven solutions. We create trusted spaces for constructive dialogue away from political pressure. Testing.'),
  ('settings:site-font', 'garamond')
on conflict (key) do update set value = excluded.value;

insert into public.section_visibility (section_key, visible) values
  ('about', true), ('asgpp', true), ('sectoralFocus', false)
on conflict (section_key) do update set visible = excluded.visible;
