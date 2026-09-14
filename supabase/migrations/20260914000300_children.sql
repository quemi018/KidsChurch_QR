-- Phase 2: children. One row per child; one permanent opaque QR token per child.

create table public.children (
  id uuid primary key default gen_random_uuid(),
  guardian_id uuid not null references public.profiles (id) on delete restrict,
  full_name text not null check (length(btrim(full_name)) between 1 and 120),
  -- Extensible: adding a value later is a non-destructive constraint swap.
  gender text not null check (gender in ('Male', 'Female')),
  birthday date not null check (birthday <= current_date),
  -- Opaque, cryptographically random (192 bits, hex). Never PII, never sequential.
  -- Set once at insert; changing it is blocked by trigger for all non-server callers.
  qr_token text not null unique default encode(extensions.gen_random_bytes(24), 'hex'),
  is_active boolean not null default true,
  archived_at timestamptz,
  archived_by uuid references public.profiles (id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint children_archive_state_consistent check (
    (is_active and archived_at is null) or (not is_active and archived_at is not null)
  )
);

comment on table public.children is 'Children attached to a guardian profile. Soft-deleted via is_active/archived_*.';
comment on column public.children.qr_token is 'Opaque QR token (QR payload is vckc:<qr_token>). Permanent; no PII.';

create index children_guardian_id_idx on public.children (guardian_id);
create index children_is_active_idx on public.children (is_active);
-- qr_token lookup uses the unique index created by the UNIQUE constraint.

create trigger children_set_updated_at
  before update on public.children
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- Column guard:
--   qr_token                              -> server only (future Admin reissue flow)
--   guardian_id, is_active, archived_*    -> admins or server
--   id                                    -> never
-- ---------------------------------------------------------------------------
create or replace function public.protect_child_privileged_columns()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  caller uuid := auth.uid();
begin
  if new.id is distinct from old.id then
    raise exception 'children.id cannot be changed' using errcode = '42501';
  end if;

  if caller is not null then
    if new.qr_token is distinct from old.qr_token then
      raise exception 'QR token cannot be changed' using errcode = '42501';
    end if;

    if not public.is_admin() and (
      new.guardian_id is distinct from old.guardian_id
      or new.is_active is distinct from old.is_active
      or new.archived_at is distinct from old.archived_at
      or new.archived_by is distinct from old.archived_by
    ) then
      raise exception 'Only an Admin may archive, reactivate or reassign a child' using errcode = '42501';
    end if;
  end if;

  return new;
end;
$$;

create trigger children_protect_privileged_columns
  before update on public.children
  for each row execute function public.protect_child_privileged_columns();

-- ---------------------------------------------------------------------------
-- Row Level Security
-- ---------------------------------------------------------------------------
alter table public.children enable row level security;

create policy "children_select_own_or_admin"
  on public.children for select
  to authenticated
  using (guardian_id = (select auth.uid()) or public.is_admin());

-- Members insert children for themselves only, always active. Admins may insert for any guardian.
create policy "children_insert_own_or_admin"
  on public.children for insert
  to authenticated
  with check (
    (
      guardian_id = (select auth.uid())
      and is_active
      and archived_at is null
      and archived_by is null
    )
    or public.is_admin()
  );

-- Members update their own ACTIVE children (privileged columns guarded by trigger).
create policy "children_update_own_active_or_admin"
  on public.children for update
  to authenticated
  using ((guardian_id = (select auth.uid()) and is_active) or public.is_admin())
  with check (guardian_id = (select auth.uid()) or public.is_admin());

-- No DELETE policy: children are archived, never deleted by clients.
-- attendance.child_id is ON DELETE RESTRICT, so even the server cannot delete a child with history.

revoke all on public.children from anon;
revoke delete, truncate, references, trigger on public.children from authenticated;
