-- Phase 10 hardening: attendance may only be recorded against an OPEN session
-- (spec §15 "closing a session prevents new scans from being assigned to it").
-- The application already checks this; this trigger makes the database the
-- final authority, including for service-role writes.

create or replace function public.enforce_attendance_session_open()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not exists (
    select 1 from public.church_sessions s
    where s.id = new.session_id and s.status = 'open'
  ) then
    raise exception 'Attendance can only be recorded for an open session'
      using errcode = 'check_violation';
  end if;
  return new;
end;
$$;

revoke execute on function public.enforce_attendance_session_open() from public, anon, authenticated;

create trigger attendance_requires_open_session
  before insert on public.attendance
  for each row execute function public.enforce_attendance_session_open();
