-- Run after schema.sql. Installing this function does NOT schedule automatic cleanup.
-- Schedule it separately with Supabase Cron, as documented in README.md.
begin;

create index if not exists phone_requests_retention on public.phone_requests (archived, created_at, updated_at);

create or replace function public.purge_expired_phone_requests()
returns integer language plpgsql security definer set search_path = '' as $$
declare removed integer;
begin
  delete from public.phone_requests
  where (not archived and created_at < now() - interval '30 days')
     or (archived and updated_at < now() - interval '45 days');
  get diagnostics removed = row_count;
  return removed;
end;
$$;

-- No browser role, including the Google owner, may purge requests through the API.
-- The project administrator/cron executor retains its function-owner rights.
revoke all on function public.purge_expired_phone_requests() from public, anon, authenticated;
grant execute on function public.purge_expired_phone_requests() to service_role;

commit;
