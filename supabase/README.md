# Connect the live store

The GitHub Pages frontend can use Supabase for shared inventory, Google owner sign-in, uploads and the request inbox. With blank credentials in `public/config.json`, the website stays in its clearly labelled local demonstration mode. Local edits and requests are not shared with other visitors. No Supabase project, OAuth account or production database was created by this implementation.

## 1. Create the database

Create a Supabase project and run [`schema.sql`](schema.sql), then [`retention.sql`](retention.sql), in its SQL Editor. Use a new project: the schema only manages its named tables and storage policies and does not remove unrelated policies that might exist in an older project. Review any existing permissive storage or table policies before using this in an existing project. Schedule retention cleanup using the separate step below; installing its function alone does not turn on automatic cleanup.

The schema separates `devices` from `device_private`. Visitors can read published, unarchived devices, including sold phones. Purchase cost, serial/IMEI, private notes, inspection notes, requests and activity logs require the allowlisted owner. Client roles have no direct table mutation grants. Validated RPCs control edits and submissions. A sold device remains available to the sold catalogue but should not appear in the available-stock view.

All writes use server timestamps. Archiving devices and requests is reversible. The activity log records device edits, publishing, archive/restore and availability changes without copying private device fields into public records.

## 2. Configure Google sign-in

Enable Google in Supabase Authentication → Sign In / Providers and follow the [Supabase Google setup guide](https://supabase.com/docs/guides/auth/social-login/auth-google). Put the Google client secret in Supabase, never in the repository. Configure the Google OAuth callback URI shown by Supabase, normally `https://YOUR-PROJECT.supabase.co/auth/v1/callback`. Configure your frontend's origin in Google's authorized JavaScript origins.

In Supabase Authentication → URL Configuration, set the production site URL and permit the exact app URL as a redirect, including its GitHub Pages repository path. For example, the website might be at `https://YOUR-NAME.github.io/iphones_by_shah/`. Add your local development origin while testing. Allow the exact owner callback URL `https://YOUR-NAME.github.io/iphones_by_shah/admin.html` and, during local testing, `http://127.0.0.1:4173/admin.html`. The app returns to the separate owner page. Use Google as the owner account's original provider; disable other sign-in providers if they are not needed.

Sign in once with the owner's Google account. This creates an ordinary Supabase Auth user; it does **not** grant owner access. Copy that user's UUID from Authentication → Users, confirm that it is the right person, then run this in SQL Editor with the real UUID:

```sql
insert into public.admin_accounts (singleton, user_id)
values (true, 'REPLACE-WITH-OWNER-AUTH-USER-UUID'::uuid);
```

The singleton primary key permits one owner. There is no browser endpoint that can create an owner or grant access. Other Google accounts may authenticate but cannot manage the store. To replace the owner, a project administrator must change this row in SQL Editor after verifying the replacement account.

## 3. Set public frontend configuration

Edit `public/config.json` before building:

```json
{
  "supabaseUrl": "https://YOUR-PROJECT.supabase.co",
  "supabaseKey": "YOUR-PUBLISHABLE-KEY"
}
```

Use the Supabase **publishable** key (`sb_publishable_…`) or legacy `anon` key. They are meant to be visible in browser code; authorization is enforced by database and storage rules. Never put a secret key or `service_role` key in this file. The client rejects elevated keys. Keep any other configuration properties used by the frontend.

Build and publish the frontend following the root README. No private key is needed by GitHub Pages. Config is loaded with `cache: no-store`. A configured live backend failure is shown as an error; a failed live save must not be described as successful or silently turned into a local save.

## Media and publishing

`device-media` is a public product-media bucket. Only the Google owner can upload. The bucket accepts JPG, PNG, WebP, AVIF, MP4, WebM and MOV, up to 25 MiB each. Every object receives a unique name under the device UUID. The API does not overwrite or delete stored objects. Removing media from a gallery detaches its URL; the object remains recoverable. Keep backups of the original uploads and periodically review unattached objects in the Storage dashboard.

A published record needs at least one image. Each listing supports up to ten photos and one video. A video can be the cover when a photo is also present. Condition scores use half points; battery health is optional. Checking days support `0`, `3`, `7` and custom whole days up to `365`. The owner writes the exact checking terms on each device. The client and SQL enforce these constraints.

The owner UI optimizes photos to WebP with a maximum 1,800-pixel edge. When its browser supports MP4 recording and media capture, it re-encodes videos at up to a 1,280-pixel edge and 24 fps, keeping captured audio. The smaller file is uploaded; unsupported or failed optimization retains the original and explains this in the upload result. Inputs remain limited to 25 MiB and 60 seconds. MP4 with a broadly supported codec is preferable for playback across phones. The UI accepts JPG, PNG, WebP, MP4 and WebM; broader bucket types do not guarantee every browser can play every codec. This uses an existing media file, not camera or microphone access. See [MediaRecorder](https://developer.mozilla.org/en-US/docs/Web/API/MediaRecorder) and the [media capture compatibility notes](https://developer.mozilla.org/en-US/docs/Web/API/HTMLMediaElement/captureStream). Draft product media in this public bucket can be retrieved by anyone who knows its URL: never upload serial-number documents, receipts or other private files into it.

## Requests and abuse limits

The request form collects model, color preference, PTA preference and optional notes. Requests have no contact field, status workflow or follow-up assignment. The owner sees them in the private inbox and can archive or restore them. Acknowledgement tells visitors to watch the public stock for future arrivals; it does not promise that a request will be sourced.

`submit_phone_request` bounds all input, ignores a filled honeypot and enforces a transaction-locked global limit of 120 requests per hour. Direct table insertion is revoked so callers cannot bypass it. The global cap protects storage; it is **not** a per-person/IP limit or a CAPTCHA. The implementation deliberately does not treat a client-supplied forwarding header as a verified IP address. Before promoting the form to a large audience, place submission behind an Edge Function that verifies a CAPTCHA and a server-controlled rate limit, then revoke the anonymous RPC grant. This needs an actual provider secret and deployment setup; no verification is simulated in the frontend.

## Request retention

[`retention.sql`](retention.sql) provides `purge_expired_phone_requests()`. Active requests become eligible for permanent removal 30 days after creation. Archived requests become eligible 45 days after their latest archive action, recorded in `updated_at`. Restoring a request preserves its original creation date, so an old restored request can be eligible for removal at the next cleanup. Archiving keeps its contents until that cleanup; this form has no separate request-status workflow. The purge removes the entire request, including notes. Activity rows contain an action and record UUID, not request text.

The purge function is restricted to `service_role` and the database administrator/function owner. Neither visitors nor signed-in browser accounts, including the Google owner, can execute it. Keep the service-role key server-side.

Automatic retention is active **only after** installing `retention.sql` and scheduling the cleanup. Enable the `pg_cron` module in Supabase Integrations → Cron, as described in [Supabase Cron installation](https://supabase.com/docs/guides/cron/install). Then run this separately in SQL Editor:

```sql
select cron.schedule(
  'shah-request-retention',
  '15 * * * *',
  $$select public.purge_expired_phone_requests();$$
);
```

This runs hourly at minute 15; eligible rows are removed on the next successful run. Check the job's History in the Cron dashboard and confirm that it succeeds. See the [official scheduling guide](https://supabase.com/docs/guides/cron/quickstart). Cron setup is kept outside `retention.sql` because the extension may not yet be enabled. No production job was scheduled by this implementation.

A project administrator can run `select public.purge_expired_phone_requests();` manually; its result is the number of removed requests. Do not describe the automatic 30/45-day cleanup as operational before its job is installed and verified. Database and downloaded backups have their own retention periods; this function does not rewrite old backups.

## Backup and restore

The owner's JSON backup export includes all devices, private records, requests and activity. Store it securely: it contains internal information. It includes media URLs, **not media bytes**. Download or otherwise back up Storage objects separately.

For a complete database recovery, use the project's database backups or a [Supabase database dump](https://supabase.com/docs/reference/cli/supabase-db-dump), plus a separate storage-object backup. Test restore into a separate project before relying on it. Preserve the owner allowlist, RLS, functions and storage policies during recovery; verify the owner's account UUID in the restored project's Auth users.

An inventory-only JSON recovery can call the same authenticated `saveDevice(device, privateRecord)` API for each backed-up device after checking the owner's session. Upload or restore its media objects first if their original URLs no longer exist. The browser does not offer an unrestricted request/activity import endpoint. Restoring those records or original timestamps requires the project's privileged database recovery tools.

## Verify before live use

Run the local backend checks with:

```sh
node --test tests/backend-contract.test.mjs tests/backend-sql.test.mjs
```

The contract tests check the public/private boundary and client input constraints. The SQL tests execute the actual schema and retention function in embedded PostgreSQL using the development dependency `@electric-sql/pglite`, with a small substitute for Supabase's Auth and Storage schemas. They verify grants/RLS, owner-only mutations, private records, publication constraints, request limits, storage policies and retention permissions/boundaries. They do not exercise deployed Supabase Auth, Storage's file-size enforcement, Google OAuth or the pg_cron scheduler.

On the configured project, verify all of these using separate sessions:

- A signed-out visitor reads published active and sold listings but cannot read drafts, archives, `device_private`, request contents or activity.
- A signed-in Google account absent from `admin_accounts` cannot save phones, read private data, archive requests or upload media.
- The approved Google owner can save a draft with its private record, preview it, publish it with at least one image, mark it sold, archive it and restore it.
- A public request appears in the owner's inbox. Direct inserts, oversized fields, invalid PTA values and reads by visitors are rejected. A filled honeypot is discarded.
- An upload over the bucket size limit or of an unsupported type is rejected by Storage. A detached object remains recoverable.
- The retention job is installed and succeeds; a test expired active request and archived request are purged, while recent ones remain.
- The exported backup contains both public and private data. A test database/storage recovery preserves authorization.

These live checks require a configured project and were not run while preparing the source. Supabase's [RLS documentation](https://supabase.com/docs/guides/database/postgres/row-level-security) explains how grants and policies combine; [Storage access control](https://supabase.com/docs/guides/storage/security/access-control) describes the bucket policies.

## JavaScript contract

Named exports in `src/backend.js`:

- `loadConfig(baseURL)` loads the public config and initializes the client. `backendEnabled()` or `backend.ready` indicates configuration, not network health.
- `getSession()`, `isAdmin()`, `signInWithGoogle()`, `signOut()`, `onAuthChange(callback)`.
- `fetchPublishedDevices()` returns public camelCase records. `fetchAdminData()` returns `{devices, privateDevices, requests, activity}` arrays, paginated beyond the default 1,000-row API limit.
- `saveDevice(publicRecord, privateRecord?)` atomically saves public and optional private data and returns the public record. Omitting the private record preserves existing private data.
- `uploadMedia(file, deviceId)` returns `{id, type, url, alt}`. Add it to the device's `media` array and save the device.
- `submitRequest({model, color, pta, notes, website: ''})` returns an acknowledgement; no private inbox records are returned.
- `archiveRequest(id, archived = true)` and `exportBackup()`.

All live operation errors are thrown for the UI to display. Private records use `{id, deviceId, purchaseCost, serial, imei, inspection, privateNotes, updatedAt}`. Public records use the camelCase fields documented in the main frontend store, with SQL mapping inside this module.
