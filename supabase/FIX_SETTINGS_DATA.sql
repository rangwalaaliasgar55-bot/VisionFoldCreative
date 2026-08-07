-- =============================================================================
-- VisionFold — fix settings for durable CMS / theme / media (NOT NULL safe)
-- Supabase → SQL Editor → Run ALL of this
-- =============================================================================

begin;

-- Ensure table exists (won't wipe existing rows)
create table if not exists public.settings (
  id text primary key default 'default',
  baseline_rate numeric default 700,
  addon_rates jsonb default '{}'::jsonb,
  metrics jsonb default '{}'::jsonb,
  updated_at text not null default now()::text,
  data jsonb not null default '{}'::jsonb
);

-- Add missing columns without breaking existing NOT NULL rules
alter table public.settings add column if not exists baseline_rate numeric default 700;
alter table public.settings add column if not exists addon_rates jsonb default '{}'::jsonb;
alter table public.settings add column if not exists metrics jsonb default '{}'::jsonb;
alter table public.settings add column if not exists data jsonb default '{}'::jsonb;

-- updated_at: add if missing, backfill nulls, then enforce NOT NULL
alter table public.settings add column if not exists updated_at text;

update public.settings
set updated_at = now()::text
where updated_at is null;

alter table public.settings
  alter column updated_at set default now()::text;

-- Only set NOT NULL after nulls are gone
do $$
begin
  alter table public.settings alter column updated_at set not null;
exception
  when others then null;
end $$;

-- data column: never null
update public.settings
set data = coalesce(data, '{}'::jsonb)
where data is null;

alter table public.settings
  alter column data set default '{}'::jsonb;

do $$
begin
  alter table public.settings alter column data set not null;
exception
  when others then null;
end $$;

-- Upsert the default row with ALL required fields (no null updated_at)
insert into public.settings (id, baseline_rate, addon_rates, metrics, updated_at, data)
values (
  'default',
  700,
  '{"render4k": 100, "customSound": 200, "multiFormat": 150}'::jsonb,
  '{}'::jsonb,
  now()::text,
  '{}'::jsonb
)
on conflict (id) do update set
  updated_at = now()::text,
  data = coalesce(public.settings.data, '{}'::jsonb);

commit;

-- Verify (optional): should return 1 row with non-null updated_at and data
-- select id, updated_at, data is not null as has_data from public.settings where id = 'default';
