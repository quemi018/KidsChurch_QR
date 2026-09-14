-- Phase 2: attendance. One row per child per session, with check-in snapshots.

create table public.attendance (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references public.church_sessions (id) on delete restrict,
  child_id uuid not null references public.children (id) on delete restrict,
  guardian_id uuid not null references public.profiles (id) on delete restrict,

  checked_in_at timestamptz not null default now(),
  checked_in_by uuid not null references public.profiles (id) on delete restrict,

  -- Snapshots: what the record looked like at check-in, preserved for history/audit.
  child_name_snapshot text not null,
  child_gender_snapshot text not null,
  child_age_snapshot integer not null check (child_age_snapshot between 0 and 150),

  guardian_name_snapshot text not null,
  guardian_relationship_snapshot text,
  guardian_contact_snapshot text not null,

  created_at timestamptz not null default now(),

  -- Final defense against duplicate / concurrent check-ins.
  constraint attendance_session_child_unique unique (session_id, child_id)
);

comment on table public.attendance is 'Check-in records. UNIQUE(session_id, child_id) prevents duplicate check-ins.';

create index attendance_session_id_idx on public.attendance (session_id);
create index attendance_child_id_idx on public.attendance (child_id);
create index attendance_guardian_id_idx on public.attendance (guardian_id);
create index attendance_checked_in_at_idx on public.attendance (checked_in_at desc);

-- Realtime DELETE events carry the full old row (admin corrections show up live).
alter table public.attendance replica identity full;

-- ---------------------------------------------------------------------------
-- Row Level Security: Admin-only. Members have no policy (no access, incl. Realtime).
-- Inserts happen from the protected server check-in endpoint, authenticated as the Admin.
-- ---------------------------------------------------------------------------
alter table public.attendance enable row level security;

create policy "attendance_select_admin"
  on public.attendance for select
  to authenticated
  using (public.is_admin());

create policy "attendance_insert_admin_self"
  on public.attendance for insert
  to authenticated
  with check (public.is_admin() and checked_in_by = (select auth.uid()));

-- Admins may remove an incorrect record (audited by the app). Snapshots are never edited.
create policy "attendance_delete_admin"
  on public.attendance for delete
  to authenticated
  using (public.is_admin());

revoke all on public.attendance from anon;
revoke update, truncate, references, trigger on public.attendance from authenticated;
