import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { PGlite } from '@electric-sql/pglite';

const owner = '11111111-1111-4111-8111-111111111111';
const other = '22222222-2222-4222-8222-222222222222';
const deviceId = '33333333-3333-4333-8333-333333333333';
const draftId = '44444444-4444-4444-8444-444444444444';
const schemaURL = new URL('../supabase/schema.sql', import.meta.url);
const retentionURL = new URL('../supabase/retention.sql', import.meta.url);

test('PostgreSQL backend authorization, validation and retention', async t => {
  const db = new PGlite();
  t.after(() => db.close());

  // The SQL under test is unmodified. Only Supabase's surrounding Auth/Storage
  // infrastructure is replaced; claims are explicitly controlled by this test.
  await db.exec(`
    create role anon;
    create role authenticated;
    create role service_role;
    create schema auth;
    create schema storage;
    create table auth.users(id uuid primary key);
    create function auth.uid() returns uuid language sql stable as
      $$select nullif(current_setting('request.jwt.claim.sub', true),'')::uuid$$;
    create function auth.jwt() returns jsonb language sql stable as
      $$select coalesce(nullif(current_setting('request.jwt.claims', true),''),'{}')::jsonb$$;
    grant usage on schema auth, storage, public to anon, authenticated, service_role;
    create table storage.buckets(id text primary key, name text, public boolean, file_size_limit bigint, allowed_mime_types text[]);
    create table storage.objects(id uuid default gen_random_uuid() primary key, bucket_id text, name text);
    alter table storage.objects enable row level security;
    grant select,insert,update,delete on storage.objects to anon, authenticated;
    insert into auth.users values('${owner}'),('${other}');
  `);
  const schema = await readFile(schemaURL, 'utf8');
  const retention = await readFile(retentionURL, 'utf8');
  await db.exec(schema);
  await db.exec(retention);
  // Named policies/functions are safe to apply a second time.
  await db.exec(schema);
  await db.exec(retention);
  await db.query('insert into public.admin_accounts(user_id) values($1)', [owner]);

  async function role(name, uid = '', provider = 'google') {
    assert.ok(['anon', 'authenticated', 'service_role'].includes(name));
    await db.exec('reset role');
    await db.query("select set_config('request.jwt.claim.sub',$1,false), set_config('request.jwt.claims',$2,false)", [uid, JSON.stringify({ app_metadata: { provider } })]);
    await db.exec(`set role ${name}`);
  }
  async function administrator() { await db.exec('reset role'); }
  const record = {
    id: deviceId, model: 'iPhone 16 Pro Max', storage: 256, color: 'Black Titanium',
    price: 270000, condition: 9.5, battery: null, pta: 'Non-PTA', carrier: 'Unlocked',
    sim: 'eSIM', availability: 'available', published: true, archived: false,
    featured: true, checking_days: 13,
    media: [{ id: 'photo', type: 'image', url: 'https://example.com/phone.jpg', alt: 'Phone' }], cover_index: 0,
  };
  async function save(value, privateRecord = null) {
    return db.query('select public.save_device($1::jsonb,$2::jsonb) as device', [JSON.stringify(value), privateRecord === null ? null : JSON.stringify(privateRecord)]);
  }

  await t.test('unapproved accounts cannot seed an owner or mutate tables/RPCs', async () => {
    await role('anon');
    await assert.rejects(db.query('insert into public.admin_accounts(user_id) values($1)', [other]), /permission denied/);
    await assert.rejects(save(record), /permission denied/);
    await assert.rejects(db.query("insert into public.phone_requests(model) values ('iPhone')"), /permission denied/);
    await role('authenticated', other);
    assert.equal((await db.query('select public.is_admin() as allowed')).rows[0].allowed, false);
    await assert.rejects(save(record), /approved Google owner/);
    await assert.rejects(db.query('insert into public.admin_accounts(user_id) values($1)', [other]), /permission denied/);
    await assert.rejects(db.query("update public.devices set price=1"), /permission denied/);
  });

  await t.test('owner saves public/private data atomically and existing private fields survive omission', async () => {
    await role('authenticated', owner);
    assert.equal((await db.query('select public.is_admin() as allowed')).rows[0].allowed, true);
    const saved = await save(record, { purchase_cost: 230000, serial: 'PRIVATE', imei: 'PRIVATE', inspection: {}, private_notes: 'Private' });
    assert.equal(saved.rows[0].device.checking_days, 13);
    assert.equal('purchase_cost' in saved.rows[0].device, false);
    assert.equal((await db.query('select serial from public.device_private')).rows[0].serial, 'PRIVATE');
    await save({ ...record, price: 280000 });
    assert.equal((await db.query('select serial from public.device_private')).rows[0].serial, 'PRIVATE');
    await assert.rejects(save({ ...record, price: 290000 }, { purchase_cost: -1 }), /check constraint/);
    assert.equal((await db.query('select price from public.devices where id=$1', [deviceId])).rows[0].price, '280000.00');
    await save({ ...record, id: draftId, published: false, media: [] });
  });

  await t.test('published catalogue exposes neither drafts nor private tables', async () => {
    await role('anon');
    assert.deepEqual((await db.query('select id from public.devices')).rows.map(row => row.id), [deviceId]);
    await assert.rejects(db.query('select * from public.device_private'), /permission denied/);
    await assert.rejects(db.query('select * from public.phone_requests'), /permission denied/);
    await assert.rejects(db.query('select * from public.activity_log'), /permission denied/);
    await role('authenticated', other);
    assert.equal((await db.query('select * from public.device_private')).rows.length, 0);
    assert.equal((await db.query('select * from public.phone_requests')).rows.length, 0);
    assert.equal((await db.query('select * from public.activity_log')).rows.length, 0);
    assert.equal((await db.query('select * from public.devices')).rows.length, 1);
  });

  await t.test('storage permits unique owner uploads and denies outsider uploads/deletion', async () => {
    const path = `${deviceId}/55555555-5555-4555-8555-555555555555.jpg`;
    await role('authenticated', other);
    await assert.rejects(db.query("insert into storage.objects(bucket_id,name) values ('device-media',$1)", [path]), /row-level security/);
    await role('authenticated', owner);
    await db.query("insert into storage.objects(bucket_id,name) values ('device-media',$1)", [path]);
    await assert.rejects(db.query("insert into storage.objects(bucket_id,name) values ('device-media','phone.html')"), /row-level security/);
    assert.equal((await db.query("delete from storage.objects where bucket_id='device-media' returning id")).rows.length, 0);
    assert.equal((await db.query("select * from storage.objects where bucket_id='device-media'")).rows.length, 1);
  });

  await t.test('public requests are bounded, honeypot-protected and owner-only to read/archive', async () => {
    await role('anon');
    await db.query("select public.submit_phone_request('iPhone 15','Blue','Any','256 GB','bot')");
    await db.query("select public.submit_phone_request('iPhone 15','Blue','Any','256 GB','')");
    await assert.rejects(db.query("select public.submit_phone_request('iPhone 15','Blue','Invalid','256 GB','')"), /request fields/);
    await assert.rejects(db.query("select public.submit_phone_request('iPhone 15','Blue','Any',$1,'')", ['a'.repeat(2001)]), /request fields/);
    await role('authenticated', owner);
    const inbox = (await db.query('select * from public.phone_requests')).rows;
    assert.equal(inbox.length, 1);
    assert.equal('status' in inbox[0], false);
    assert.equal('email' in inbox[0], false);
    await role('authenticated', other);
    await assert.rejects(db.query('select public.archive_phone_request($1,true)', [inbox[0].id]), /approved owner/);
    await role('authenticated', owner);
    await db.query('select public.archive_phone_request($1,true)', [inbox[0].id]);
    assert.equal((await db.query('select archived from public.phone_requests')).rows[0].archived, true);
  });

  await t.test('request global cap cannot be bypassed by direct insertion', async () => {
    await administrator();
    await db.exec("insert into public.phone_requests(model) select 'Cap fixture' from generate_series(1,119)");
    await role('anon');
    await assert.rejects(db.query("select public.submit_phone_request('iPhone 15','','Any','','')"), /busy right now/);
    await administrator();
    await db.exec("delete from public.phone_requests where model='Cap fixture'");
  });

  await t.test('archives are hidden, sold phones remain public, and restore is logged', async () => {
    await role('authenticated', owner);
    await save({ ...record, archived: true });
    await role('anon');
    assert.equal((await db.query('select * from public.devices')).rows.length, 0);
    await role('authenticated', owner);
    await save({ ...record, availability: 'sold' });
    assert.equal((await db.query("select * from public.activity_log where action='restored'")).rows.length, 1);
    await role('anon');
    assert.equal((await db.query('select availability from public.devices')).rows[0].availability, 'sold');
  });

  await t.test('SQL enforces photo publication and ten-photo/one-video limits', async () => {
    await role('authenticated', owner);
    const video = { id: 'video', type: 'video', url: 'https://example.com/phone.mp4' };
    await assert.rejects(save({ ...record, media: [video] }), /published_device_has_photo/);
    const images = Array.from({ length: 10 }, (_, index) => ({ ...record.media[0], id: `photo-${index}` }));
    await save({ ...record, media: [...images, video], cover_index: 10 });
    await assert.rejects(save({ ...record, media: [...images, { ...record.media[0], id: 'photo-11' }] }), /check constraint/);
    await assert.rejects(save({ ...record, media: [...record.media, video, { ...video, id: 'video-2' }] }), /check constraint/);
  });

  await t.test('even the allowlisted UUID requires the Google provider', async () => {
    await role('authenticated', owner, 'email');
    assert.equal((await db.query('select public.is_admin() as allowed')).rows[0].allowed, false);
    await assert.rejects(save(record), /approved Google owner/);
  });

  await t.test('only service_role/administrator may purge requests, with 30/45-day boundaries', async () => {
    await administrator();
    await db.exec(`
      insert into public.phone_requests(model, archived, created_at, updated_at) values
        ('active-expired',false,now()-interval '31 days',now()-interval '31 days'),
        ('active-recent',false,now()-interval '29 days',now()-interval '29 days'),
        ('archive-expired',true,now()-interval '90 days',now()-interval '46 days'),
        ('archive-recent',true,now()-interval '90 days',now()-interval '44 days');
    `);
    await role('anon');
    await assert.rejects(db.query('select public.purge_expired_phone_requests()'), /permission denied/);
    await role('authenticated', other);
    await assert.rejects(db.query('select public.purge_expired_phone_requests()'), /permission denied/);
    await role('authenticated', owner);
    await assert.rejects(db.query('select public.purge_expired_phone_requests()'), /permission denied/);
    await role('service_role');
    assert.equal((await db.query('select public.purge_expired_phone_requests() as removed')).rows[0].removed, 2);
    await administrator();
    assert.deepEqual((await db.query("select model from public.phone_requests where model like '%recent' order by model")).rows.map(row => row.model), ['active-recent', 'archive-recent']);
    assert.equal((await db.query("select * from public.phone_requests where model like '%expired'")).rows.length, 0);
  });
});
