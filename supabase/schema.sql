-- Run once in the SQL editor of a NEW Supabase project. No owner is seeded automatically.
-- Re-running this file is safe for these named objects; this is not a destructive reset.
begin;

create table if not exists public.admin_accounts (
  singleton boolean primary key default true check (singleton),
  user_id uuid not null unique references auth.users(id),
  created_at timestamptz not null default now()
);
alter table public.admin_accounts enable row level security;
revoke all on table public.admin_accounts from anon, authenticated;

create or replace function public.is_admin()
returns boolean language sql stable security definer set search_path = '' as $$
  select exists (
    select 1 from public.admin_accounts
    where user_id = (select auth.uid())
      and (select auth.jwt() -> 'app_metadata' ->> 'provider') = 'google'
  );
$$;
revoke all on function public.is_admin() from public;
grant execute on function public.is_admin() to anon, authenticated;

create or replace function public.valid_device_media(value jsonb)
returns boolean language plpgsql immutable set search_path = '' as $$
declare item jsonb; image_count integer := 0; video_count integer := 0;
begin
  if value is null or jsonb_typeof(value) <> 'array' then return false; end if;
  if jsonb_array_length(value) > 11 then return false; end if;
  for item in select * from jsonb_array_elements(value) loop
    if jsonb_typeof(item) <> 'object'
      or coalesce(item ->> 'id', '') = '' or length(item ->> 'id') > 100
      or coalesce(item ->> 'type', '') not in ('image', 'video')
      or coalesce(item ->> 'url', '') !~ '^https?://[^[:space:]]+$'
      or length(item ->> 'url') > 2048
      or length(coalesce(item ->> 'alt', '')) > 250
      or (item ? 'poster' and (coalesce(item ->> 'poster', '') !~ '^https?://[^[:space:]]+$' or length(item ->> 'poster') > 2048))
      or (item - array['id', 'type', 'url', 'poster', 'alt']) <> '{}'::jsonb
    then return false; end if;
    if item ->> 'type' = 'image' then image_count := image_count + 1;
    else video_count := video_count + 1; end if;
    if image_count > 10 or video_count > 1 then return false; end if;
  end loop;
  return true;
end;
$$;

create table if not exists public.devices (
  id uuid primary key default gen_random_uuid(),
  model text not null check (length(btrim(model)) between 1 and 100),
  storage integer not null check (storage between 1 and 4096),
  color text not null check (length(btrim(color)) between 1 and 100),
  price numeric(12,2) not null check (price between 1 and 999999999),
  condition numeric(3,1) not null check (condition between 0 and 10 and mod(condition * 2, 1) = 0),
  battery smallint check (battery between 0 and 100),
  pta text not null check (pta in ('PTA approved', 'Non-PTA')),
  carrier text not null check (carrier in ('Unlocked', 'JV')),
  sim text not null default '' check (length(sim) <= 100),
  repairs text not null default '' check (length(repairs) <= 1000),
  marks text not null default '' check (length(marks) <= 1000),
  includes text not null default '' check (length(includes) <= 1000),
  checking_days smallint not null default 7 check (checking_days between 0 and 365),
  checking_terms text not null default '' check (length(checking_terms) <= 2000),
  description text not null default '' check (length(description) <= 4000),
  availability text not null default 'available' check (availability in ('available', 'reserved', 'sold')),
  published boolean not null default false,
  archived boolean not null default false,
  featured boolean not null default false,
  media jsonb not null default '[]'::jsonb check (public.valid_device_media(media)),
  cover_index integer not null default 0 check (cover_index >= 0 and cover_index < greatest(1, jsonb_array_length(media))),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint published_device_has_photo check (not published or media @> '[{"type":"image"}]'::jsonb)
);

create table if not exists public.device_private (
  device_id uuid primary key references public.devices(id),
  purchase_cost numeric(12,2) check (purchase_cost between 0 and 999999999),
  serial text not null default '' check (length(serial) <= 100),
  imei text not null default '' check (length(imei) <= 100),
  inspection jsonb not null default '{}'::jsonb check (jsonb_typeof(inspection) = 'object' and octet_length(inspection::text) <= 16000),
  private_notes text not null default '' check (length(private_notes) <= 4000),
  updated_at timestamptz not null default now()
);

-- No contact data, request status, allocation or follow-up fields in the chosen request workflow.
create table if not exists public.phone_requests (
  id uuid primary key default gen_random_uuid(),
  model text not null check (length(btrim(model)) between 1 and 100),
  color text not null default '' check (length(color) <= 100),
  pta text not null default 'Any' check (pta in ('Any', 'PTA approved', 'Non-PTA')),
  notes text not null default '' check (length(notes) <= 2000),
  archived boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.activity_log (
  id uuid primary key default gen_random_uuid(),
  action text not null,
  entity_type text not null,
  entity_id uuid not null,
  actor_id uuid references auth.users(id),
  created_at timestamptz not null default now()
);

create index if not exists devices_public_catalogue on public.devices (created_at desc) where published and not archived;
create index if not exists phone_requests_recent on public.phone_requests (created_at desc);

alter table public.devices enable row level security;
alter table public.device_private enable row level security;
alter table public.phone_requests enable row level security;
alter table public.activity_log enable row level security;

-- Clients can read according to RLS. All mutation takes place through narrowly scoped RPCs.
-- In particular, the anonymous role has no direct INSERT on requests, bypassing neither the cap nor honeypot.
revoke all on table public.devices, public.device_private, public.phone_requests, public.activity_log from anon, authenticated;
grant select on table public.devices to anon, authenticated;
grant select on table public.device_private, public.phone_requests, public.activity_log to authenticated;

drop policy if exists devices_published_read on public.devices;
create policy devices_published_read on public.devices for select to anon, authenticated using (published and not archived);
drop policy if exists devices_owner_read on public.devices;
create policy devices_owner_read on public.devices for select to authenticated using ((select public.is_admin()));
drop policy if exists private_owner_read on public.device_private;
create policy private_owner_read on public.device_private for select to authenticated using ((select public.is_admin()));
drop policy if exists requests_owner_read on public.phone_requests;
create policy requests_owner_read on public.phone_requests for select to authenticated using ((select public.is_admin()));
drop policy if exists activity_owner_read on public.activity_log;
create policy activity_owner_read on public.activity_log for select to authenticated using ((select public.is_admin()));

create or replace function public.record_device_activity()
returns trigger language plpgsql security definer set search_path = '' as $$
declare activity text;
begin
  if tg_op = 'INSERT' then activity := 'created';
  elsif not old.archived and new.archived then activity := 'archived';
  elsif old.archived and not new.archived then activity := 'restored';
  elsif old.availability is distinct from new.availability then activity := 'availability: ' || new.availability;
  elsif old.published is distinct from new.published then activity := case when new.published then 'published' else 'unpublished' end;
  else activity := 'updated'; end if;
  insert into public.activity_log (action, entity_type, entity_id, actor_id)
  values (activity, 'device', new.id, auth.uid());
  return new;
end;
$$;
drop trigger if exists device_activity on public.devices;
create trigger device_activity after insert or update on public.devices for each row execute function public.record_device_activity();

create or replace function public.save_device(p_public jsonb, p_private jsonb default null)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare saved public.devices;
begin
  if not public.is_admin() then raise exception 'Only the approved Google owner can edit phones.' using errcode = '42501'; end if;
  if jsonb_typeof(p_public) <> 'object' then raise exception 'Invalid device record.'; end if;
  insert into public.devices (
    id, model, storage, color, price, condition, battery, pta, carrier, sim, repairs, marks, includes,
    checking_days, checking_terms, description, availability, published, archived, featured, media, cover_index
  ) values (
    (p_public ->> 'id')::uuid, btrim(p_public ->> 'model'), (p_public ->> 'storage')::integer,
    btrim(p_public ->> 'color'), (p_public ->> 'price')::numeric, (p_public ->> 'condition')::numeric,
    (p_public ->> 'battery')::smallint, p_public ->> 'pta', p_public ->> 'carrier', coalesce(p_public ->> 'sim', ''),
    coalesce(p_public ->> 'repairs', ''), coalesce(p_public ->> 'marks', ''), coalesce(p_public ->> 'includes', ''),
    coalesce((p_public ->> 'checking_days')::smallint, 7), coalesce(p_public ->> 'checking_terms', ''),
    coalesce(p_public ->> 'description', ''), p_public ->> 'availability',
    coalesce((p_public ->> 'published')::boolean, false), coalesce((p_public ->> 'archived')::boolean, false),
    coalesce((p_public ->> 'featured')::boolean, false), coalesce(p_public -> 'media', '[]'::jsonb),
    coalesce((p_public ->> 'cover_index')::integer, 0)
  ) on conflict (id) do update set
    model = excluded.model, storage = excluded.storage, color = excluded.color, price = excluded.price,
    condition = excluded.condition, battery = excluded.battery, pta = excluded.pta, carrier = excluded.carrier,
    sim = excluded.sim, repairs = excluded.repairs, marks = excluded.marks, includes = excluded.includes,
    checking_days = excluded.checking_days, checking_terms = excluded.checking_terms, description = excluded.description,
    availability = excluded.availability, published = excluded.published, archived = excluded.archived,
    featured = excluded.featured, media = excluded.media, cover_index = excluded.cover_index, updated_at = now()
  returning * into saved;

  if p_private is not null and p_private <> 'null'::jsonb then
    if jsonb_typeof(p_private) <> 'object' then raise exception 'Invalid private record.'; end if;
    insert into public.device_private (device_id, purchase_cost, serial, imei, inspection, private_notes)
    values (saved.id, (p_private ->> 'purchase_cost')::numeric, coalesce(p_private ->> 'serial', ''),
      coalesce(p_private ->> 'imei', ''), coalesce(p_private -> 'inspection', '{}'::jsonb), coalesce(p_private ->> 'private_notes', ''))
    on conflict (device_id) do update set purchase_cost = excluded.purchase_cost, serial = excluded.serial,
      imei = excluded.imei, inspection = excluded.inspection, private_notes = excluded.private_notes, updated_at = now();
  end if;
  return to_jsonb(saved);
end;
$$;
revoke all on function public.save_device(jsonb, jsonb) from public;
grant execute on function public.save_device(jsonb, jsonb) to authenticated;

create or replace function public.submit_phone_request(
  p_model text, p_color text default '', p_pta text default 'Any', p_notes text default '', p_website text default ''
)
returns void language plpgsql security definer set search_path = '' as $$
begin
  if length(coalesce(p_website, '')) > 200 then raise exception 'Invalid request.'; end if;
  if coalesce(p_website, '') <> '' then return; end if;
  if length(btrim(coalesce(p_model, ''))) not between 1 and 100
    or length(coalesce(p_color, '')) > 100 or length(coalesce(p_notes, '')) > 2000
    or coalesce(p_pta, '') not in ('Any', 'PTA approved', 'Non-PTA')
  then raise exception 'Please check the request fields.' using errcode = '22023'; end if;

  -- This is a global storage safety cap, not a claimed per-person or per-IP rate limit.
  -- It avoids trusting caller-controlled x-forwarded-for headers. Deploy a verified CAPTCHA
  -- gateway before paid/public traffic if stronger abuse resistance is needed.
  perform pg_advisory_xact_lock(731842940);
  if (select count(*) from public.phone_requests where created_at > now() - interval '1 hour') >= 120 then
    raise exception 'Requests are busy right now. Please try again later.' using errcode = 'P0001';
  end if;
  insert into public.phone_requests (model, color, pta, notes)
  values (btrim(p_model), btrim(coalesce(p_color, '')), p_pta, btrim(coalesce(p_notes, '')));
end;
$$;
revoke all on function public.submit_phone_request(text, text, text, text, text) from public;
grant execute on function public.submit_phone_request(text, text, text, text, text) to anon, authenticated;

create or replace function public.archive_phone_request(p_id uuid, p_archived boolean default true)
returns void language plpgsql security definer set search_path = '' as $$
begin
  if not public.is_admin() then raise exception 'Only the approved owner can manage requests.' using errcode = '42501'; end if;
  update public.phone_requests set archived = p_archived, updated_at = now() where id = p_id;
  if not found then raise exception 'Request not found.'; end if;
  insert into public.activity_log (action, entity_type, entity_id, actor_id)
  values (case when p_archived then 'archived' else 'restored' end, 'request', p_id, auth.uid());
end;
$$;
revoke all on function public.archive_phone_request(uuid, boolean) from public;
grant execute on function public.archive_phone_request(uuid, boolean) to authenticated;

-- Helper trigger functions cannot be invoked as public API functions.
revoke all on function public.record_device_activity() from public, anon, authenticated;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('device-media', 'device-media', true, 26214400,
  array['image/jpeg', 'image/png', 'image/webp', 'image/avif', 'video/mp4', 'video/webm', 'video/quicktime'])
on conflict (id) do update set public = excluded.public, file_size_limit = excluded.file_size_limit, allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists shah_media_owner_insert on storage.objects;
create policy shah_media_owner_insert on storage.objects for insert to authenticated
  with check (bucket_id = 'device-media' and (select public.is_admin()) and name ~ '^[0-9a-fA-F-]{36}/[0-9a-fA-F-]{36}\.(jpg|png|webp|avif|mp4|webm|mov)$');
drop policy if exists shah_media_owner_select on storage.objects;
create policy shah_media_owner_select on storage.objects for select to authenticated
  using (bucket_id = 'device-media' and (select public.is_admin()));
-- No client UPDATE or DELETE policy. Uploads use unique names; removing a gallery item
-- detaches it from the listing and preserves the object for backup/recovery.

commit;
