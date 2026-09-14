-- Phase 2: Kids Church sessions. Attendance is grouped per session.

create table public.church_sessions (
  id uuid primary key default gen_random_uuid(),
  name text not null check (length(btrim(name)) between 1 and 120),
  session_date date not null,
  service_time time,
  status text not null default 'open' check (status in ('open', 'closed')),
  opened_by uuid references public.profiles (id),
  opened_at timestamptz,
  closed_by uuid references public.profiles (id),
  closed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint church_sessions_closed_has_timestamp check (status <> 'closed' or closed_at is not null)
);

comment on table public.church_sessions is 'One Kids Church service/session. Only one may be open at a time (V1).';

create index church_sessions_session_date_idx on public.church_sessions (session_date desc);
create index church_sessions_status_idx on public.church_sessions (status);

-- V1 invariant: at most one open session for the church. Partial unique index
-- means a second concurrent "open" insert/update fails at the database.
create unique index church_sessions_single_open_idx
  on public.church_sessions (status)
  where status = 'open';

create trigger church_sessions_set_updated_at
  before update on public.church_sessions
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- Row Level Security: Admin-only. Members have no policy (no access).
-- ---------------------------------------------------------------------------
alter table public.church_sessions enable row level security;

create policy "church_sessions_select_admin"
  on public.church_sessions for select
  to authenticated
  using (public.is_admin());

create policy "church_sessions_insert_admin"
  on public.church_sessions for insert
  to authenticated
  with check (public.is_admin());

create policy "church_sessions_update_admin"
  on public.church_sessions for update
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

-- No DELETE policy: sessions are closed, never deleted (attendance history depends on them).

revoke all on public.church_sessions from anon;
revoke delete, truncate, references, trigger on public.church_sessions from authenticated;
