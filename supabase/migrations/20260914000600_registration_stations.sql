-- Phase 2: registration stations. Supports the church-laptop-only Member workflow.
-- A station is activated by an Admin; the browser receives an HttpOnly cookie whose
-- hash is stored here. Validation happens server-side (service role), so no client
-- policy ever needs to read the hash.

create table public.registration_stations (
  id uuid primary key default gen_random_uuid(),
  name text not null check (length(btrim(name)) between 1 and 120),
  station_token_hash text not null unique,
  is_active boolean not null default true,
  activated_by uuid not null references public.profiles (id) on delete restrict,
  created_at timestamptz not null default now(),
  last_used_at timestamptz,
  deactivated_at timestamptz,
  deactivated_by uuid references public.profiles (id)
);

comment on table public.registration_stations is 'Admin-activated browsers allowed to use Member registration/profile screens.';
comment on column public.registration_stations.station_token_hash is 'SHA-256 of the station cookie value. Raw token is never stored.';

create index registration_stations_is_active_idx on public.registration_stations (is_active);

-- ---------------------------------------------------------------------------
-- Row Level Security: Admin-only management. The hash column is written by the
-- server; admins can list/deactivate stations.
-- ---------------------------------------------------------------------------
alter table public.registration_stations enable row level security;

create policy "registration_stations_select_admin"
  on public.registration_stations for select
  to authenticated
  using (public.is_admin());

create policy "registration_stations_insert_admin_self"
  on public.registration_stations for insert
  to authenticated
  with check (public.is_admin() and activated_by = (select auth.uid()));

create policy "registration_stations_update_admin"
  on public.registration_stations for update
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

revoke all on public.registration_stations from anon;
revoke delete, truncate, references, trigger on public.registration_stations from authenticated;
