-- Phase 2: profiles (one row per Supabase Auth user; guardians and admins).
-- Passwords are never stored here; Supabase Auth owns credentials.

create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  role text not null default 'member' check (role in ('member', 'admin')),
  full_name text not null check (length(btrim(full_name)) between 1 and 120),
  -- E.164, e.g. +639171234567. Mirrors auth.users.phone (kept in sync by trigger).
  phone text unique check (phone ~ '^\+[1-9][0-9]{7,14}$'),
  -- Optional; app-level only (not used for Supabase Auth sign-in). Stored lowercase.
  email text check (email = lower(email) and length(email) <= 254),
  home_city text check (length(home_city) <= 120),
  guardian_relationship text check (
    guardian_relationship in (
      'Mother', 'Father', 'Grandmother', 'Grandfather', 'Relative', 'Legal Guardian', 'Other'
    )
  ),
  guardian_relationship_other text check (length(guardian_relationship_other) <= 120),
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.profiles is 'Authenticated users: guardians (role=member) and admins (role=admin).';

create index profiles_role_idx on public.profiles (role);

create trigger profiles_set_updated_at
  before update on public.profiles
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- Role helper used by every RLS policy. SECURITY DEFINER so it can read
-- profiles without recursing into the profiles policies themselves.
-- ---------------------------------------------------------------------------
create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.profiles p
    where p.id = (select auth.uid())
      and p.role = 'admin'
      and p.is_active
  );
$$;

comment on function public.is_admin() is 'True when the current JWT belongs to an active admin profile.';

revoke execute on function public.is_admin() from public, anon;
grant execute on function public.is_admin() to authenticated, service_role;

-- ---------------------------------------------------------------------------
-- Privileged-column guard. RLS cannot compare OLD vs NEW, so this trigger
-- enforces who may change what:
--   role        -> server only (service role; auth.uid() is null)
--   phone       -> server only (must stay in sync with auth.users.phone)
--   is_active   -> admins or server
--   id          -> never
-- ---------------------------------------------------------------------------
create or replace function public.protect_profile_privileged_columns()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  caller uuid := auth.uid();
begin
  if new.id is distinct from old.id then
    raise exception 'profiles.id cannot be changed' using errcode = '42501';
  end if;

  if caller is not null then
    if new.role is distinct from old.role then
      raise exception 'Role changes are a protected server operation' using errcode = '42501';
    end if;
    if new.phone is distinct from old.phone then
      raise exception 'Phone must be changed through the account update flow' using errcode = '42501';
    end if;
    if new.is_active is distinct from old.is_active and not public.is_admin() then
      raise exception 'Only an Admin may activate or deactivate an account' using errcode = '42501';
    end if;
  end if;

  return new;
end;
$$;

create trigger profiles_protect_privileged_columns
  before update on public.profiles
  for each row execute function public.protect_profile_privileged_columns();

-- ---------------------------------------------------------------------------
-- Create a profile automatically for every new Auth user.
-- role comes from app_metadata (server-settable only, never from the client);
-- everything else from user_metadata supplied at sign-up.
-- ---------------------------------------------------------------------------
create or replace function public.handle_new_auth_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  meta jsonb := coalesce(new.raw_user_meta_data, '{}'::jsonb);
  app_meta jsonb := coalesce(new.raw_app_meta_data, '{}'::jsonb);
  v_role text := case when app_meta ->> 'role' = 'admin' then 'admin' else 'member' end;
  v_phone text := case
    when new.phone is null or new.phone = '' then null
    when left(new.phone, 1) = '+' then new.phone
    else '+' || new.phone
  end;
  v_relationship text := nullif(btrim(meta ->> 'guardian_relationship'), '');
begin
  if v_relationship is not null and v_relationship not in (
    'Mother', 'Father', 'Grandmother', 'Grandfather', 'Relative', 'Legal Guardian', 'Other'
  ) then
    v_relationship := null;
  end if;

  insert into public.profiles (
    id, role, full_name, phone, email, home_city, guardian_relationship, guardian_relationship_other
  )
  values (
    new.id,
    v_role,
    coalesce(nullif(btrim(meta ->> 'full_name'), ''), 'Unnamed'),
    v_phone,
    nullif(lower(btrim(meta ->> 'email')), ''),
    nullif(btrim(meta ->> 'home_city'), ''),
    v_relationship,
    case when v_relationship = 'Other'
      then nullif(btrim(meta ->> 'guardian_relationship_other'), '')
      else null
    end
  );

  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_auth_user();

-- Keep profiles.phone equal to auth.users.phone when Auth changes it.
create or replace function public.sync_auth_user_phone()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  update public.profiles
  set phone = case
    when new.phone is null or new.phone = '' then null
    when left(new.phone, 1) = '+' then new.phone
    else '+' || new.phone
  end
  where id = new.id;
  return new;
end;
$$;

create trigger on_auth_user_phone_updated
  after update of phone on auth.users
  for each row
  when (old.phone is distinct from new.phone)
  execute function public.sync_auth_user_phone();

grant execute on function public.handle_new_auth_user() to supabase_auth_admin;
grant execute on function public.sync_auth_user_phone() to supabase_auth_admin;

-- ---------------------------------------------------------------------------
-- Row Level Security
-- ---------------------------------------------------------------------------
alter table public.profiles enable row level security;

-- Members: own row only. Admins: every row.
create policy "profiles_select_own_or_admin"
  on public.profiles for select
  to authenticated
  using (id = (select auth.uid()) or public.is_admin());

-- Members update their own row (privileged columns guarded by trigger). Admins update any.
create policy "profiles_update_own_or_admin"
  on public.profiles for update
  to authenticated
  using (id = (select auth.uid()) or public.is_admin())
  with check (id = (select auth.uid()) or public.is_admin());

-- No INSERT policy: rows are created only by the auth.users trigger / server.
-- No DELETE policy: accounts are deactivated (is_active=false), never deleted by clients.

revoke all on public.profiles from anon;
revoke insert, delete, truncate, references, trigger on public.profiles from authenticated;
