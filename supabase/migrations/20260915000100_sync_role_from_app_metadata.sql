-- Phase 3 fix: keep profiles.role in sync with auth.users.raw_app_meta_data->>'role'.
--
-- GoTrue's admin createUser inserts the user row first and applies app_metadata
-- in a follow-up UPDATE, so the INSERT trigger alone can miss role = 'admin'.
-- app_metadata is server-settable only (never by the client), so it remains the
-- single source of truth for role; this trigger mirrors it on every change.

create or replace function public.sync_auth_user_role()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_role text := case
    when coalesce(new.raw_app_meta_data, '{}'::jsonb) ->> 'role' = 'admin' then 'admin'
    else 'member'
  end;
begin
  update public.profiles
  set role = v_role
  where id = new.id
    and role is distinct from v_role;
  return new;
end;
$$;

revoke execute on function public.sync_auth_user_role() from public, anon, authenticated;
grant execute on function public.sync_auth_user_role() to supabase_auth_admin;

create trigger on_auth_user_app_metadata_updated
  after update of raw_app_meta_data on auth.users
  for each row
  when (old.raw_app_meta_data is distinct from new.raw_app_meta_data)
  execute function public.sync_auth_user_role();

-- Backfill any user whose role was applied after insert.
update public.profiles p
set role = 'admin'
from auth.users u
where u.id = p.id
  and u.raw_app_meta_data ->> 'role' = 'admin'
  and p.role <> 'admin';
