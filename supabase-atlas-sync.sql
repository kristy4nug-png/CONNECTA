create extension if not exists "uuid-ossp";

create table if not exists public.atlas_sync (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references auth.users(id) on delete cascade not null,
  key text not null,
  value text not null,
  updated_at timestamptz default now(),
  unique(user_id, key)
);

alter table public.atlas_sync enable row level security;

drop policy if exists "Users can manage own data" on public.atlas_sync;

create policy "Users can manage own data"
  on public.atlas_sync for all
  to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

-- Table grants and RLS are separate. This explicit grant keeps the table usable
-- when new tables are not exposed to the Data API automatically.
grant select, insert, update, delete
  on table public.atlas_sync
  to authenticated;

revoke all on table public.atlas_sync from anon;
