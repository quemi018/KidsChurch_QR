-- Phase 2: shared helpers.
-- pgcrypto provides gen_random_bytes() for QR token generation.
create extension if not exists pgcrypto with schema extensions;

-- Keeps updated_at current on every UPDATE. Attached per table below.
create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

comment on function public.set_updated_at() is 'Trigger: sets updated_at = now() on update.';
