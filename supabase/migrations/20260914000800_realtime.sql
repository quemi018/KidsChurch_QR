-- Phase 2: Realtime. The Admin dashboard subscribes to database changes on
-- attendance (live table) and church_sessions (open/close status).
-- RLS still applies: Realtime evaluates the SELECT policies per subscriber,
-- so Members (no policy) receive nothing.

alter publication supabase_realtime add table public.attendance;
alter publication supabase_realtime add table public.church_sessions;
