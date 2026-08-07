-- Run this so CMS / theme / media registry / AI history actually persist.
-- Supabase → SQL Editor → Run

begin;

create table if not exists public.settings (
  id text primary key default 'default',
  data jsonb not null default '{}'::jsonb,
  baseline_rate numeric default 700,
  addon_rates jsonb default '{}'::jsonb,
  metrics jsonb default '{}'::jsonb,
  updated_at text default now()::text
);

-- Add data column if table already existed without it
alter table public.settings add column if not exists data jsonb default '{}'::jsonb;
alter table public.settings add column if not exists baseline_rate numeric default 700;
alter table public.settings add column if not exists addon_rates jsonb default '{}'::jsonb;
alter table public.settings add column if not exists metrics jsonb default '{}'::jsonb;
alter table public.settings add column if not exists updated_at text default now()::text;

-- Ensure row exists
insert into public.settings (id, data)
values ('default', '{}'::jsonb)
on conflict (id) do nothing;

commit;
