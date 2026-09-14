-- Phase 2: trigger functions must not be reachable through the REST RPC endpoint.
-- Supabase's default privileges grant EXECUTE on new public functions to
-- anon/authenticated; triggers do not need EXECUTE at fire time, so revoke it.

revoke execute on function public.set_updated_at() from public, anon, authenticated;
revoke execute on function public.protect_profile_privileged_columns() from public, anon, authenticated;
revoke execute on function public.protect_child_privileged_columns() from public, anon, authenticated;
revoke execute on function public.handle_new_auth_user() from public, anon, authenticated;
revoke execute on function public.sync_auth_user_phone() from public, anon, authenticated;

-- Auth-schema triggers run as supabase_auth_admin; keep those grants explicit.
grant execute on function public.handle_new_auth_user() to supabase_auth_admin;
grant execute on function public.sync_auth_user_phone() to supabase_auth_admin;

-- Default privileges for functions created from now on: nothing for anon/authenticated
-- unless a migration grants it deliberately (is_admin() is granted explicitly above).
alter default privileges in schema public revoke execute on functions from public, anon, authenticated;
