-- Phase 2: audit log for sensitive Admin actions (append-only).
-- Examples: child_archived, child_reactivated, session_opened, session_closed,
-- attendance_removed, admin_created, station_activated, station_deactivated.

create table public.audit_logs (
  id uuid primary key default gen_random_uuid(),
  actor_id uuid references public.profiles (id) on delete set null,
  action text not null check (length(action) between 1 and 80),
  entity_type text not null check (length(entity_type) between 1 and 80),
  entity_id uuid,
  metadata jsonb,
  created_at timestamptz not null default now()
);

comment on table public.audit_logs is 'Append-only record of sensitive Admin/server actions.';

create index audit_logs_created_at_idx on public.audit_logs (created_at desc);
create index audit_logs_entity_idx on public.audit_logs (entity_type, entity_id);
create index audit_logs_actor_id_idx on public.audit_logs (actor_id);

-- ---------------------------------------------------------------------------
-- Row Level Security: Admins read; Admins (as themselves) or the server write.
-- Nobody updates or deletes through the API.
-- ---------------------------------------------------------------------------
alter table public.audit_logs enable row level security;

create policy "audit_logs_select_admin"
  on public.audit_logs for select
  to authenticated
  using (public.is_admin());

create policy "audit_logs_insert_admin_self"
  on public.audit_logs for insert
  to authenticated
  with check (public.is_admin() and actor_id = (select auth.uid()));

revoke all on public.audit_logs from anon;
revoke update, delete, truncate, references, trigger on public.audit_logs from authenticated;
