import test from 'node:test';
import assert from 'node:assert/strict';
import { normalizeDevice, toDatabaseDevice, validateRequest, backendEnabled, getSession, saveDevice, loadConfig } from '../src/backend.js';

const device = {
  id: '62c758a5-2c86-4392-8fe4-801a6e3b36e4', model: 'iPhone 16 Pro Max', storage: 256,
  color: 'Black Titanium', price: 275000, condition: 9.5, battery: null,
  pta: 'Non-PTA', carrier: 'Unlocked', checkingDays: 13, availability: 'available',
  published: true, archived: false, featured: true, coverIndex: 1,
  media: [
    { id: 'photo', type: 'image', url: 'https://example.com/phone.jpg', alt: 'Actual phone' },
    { id: 'video', type: 'video', url: 'https://example.com/phone.mp4', alt: 'Condition video' },
  ],
};

test('public normalization cannot expose cost, identifiers or private media metadata', () => {
  const publicDevice = normalizeDevice({ ...toDatabaseDevice(device), purchase_cost: 240000, serial: 'PRIVATE', imei: 'PRIVATE', private_notes: 'PRIVATE', media: [{ ...device.media[0], privateNotes: 'PRIVATE' }] });
  for (const key of ['purchase_cost', 'purchaseCost', 'serial', 'imei', 'private_notes', 'privateNotes']) assert.equal(key in publicDevice, false);
  assert.equal('privateNotes' in publicDevice.media[0], false);
  assert.equal(publicDevice.checkingDays, 13);
  assert.equal(publicDevice.battery, null);
});

test('video cover is accepted only with a photo, and custom checking days survive mapping', () => {
  const mapped = toDatabaseDevice(device);
  assert.equal(mapped.cover_index, 1);
  assert.equal(mapped.checking_days, 13);
  assert.throws(() => toDatabaseDevice({ ...device, media: [device.media[1]], coverIndex: 0 }), /at least one photo/);
  assert.doesNotThrow(() => toDatabaseDevice({ ...device, published: false, media: [], coverIndex: 0, checkingDays: 0 }));
});

test('invalid grades, battery values, URL schemes and covers are rejected', () => {
  assert.throws(() => toDatabaseDevice({ ...device, condition: 9.2 }), /half points/);
  assert.throws(() => toDatabaseDevice({ ...device, battery: 101 }), /Battery/);
  assert.throws(() => toDatabaseDevice({ ...device, checkingDays: 3.5 }), /whole number/);
  assert.throws(() => toDatabaseDevice({ ...device, media: [{ ...device.media[0], url: 'javascript:alert(1)' }], coverIndex: 0 }), /HTTP/);
  assert.throws(() => toDatabaseDevice({ ...device, coverIndex: 2 }), /Cover position/);
});

test('gallery limits match the frontend: ten photos and one video', () => {
  const images = Array.from({ length: 10 }, (_, index) => ({ ...device.media[0], id: `photo-${index}` }));
  assert.doesNotThrow(() => toDatabaseDevice({ ...device, media: [...images, device.media[1]] }));
  assert.throws(() => toDatabaseDevice({ ...device, media: [...images, { ...device.media[0], id: 'photo-11' }] }), /ten photos/);
  assert.throws(() => toDatabaseDevice({ ...device, media: [...device.media, { ...device.media[1], id: 'video-2' }] }), /one video/);
});

test('requests expose only the selected preferences, with bounded fields', () => {
  assert.deepEqual(validateRequest({ model: '  iPhone 15  ', color: 'Blue', pta: 'Any', notes: '256 GB', email: 'private@example.com', status: 'new' }), {
    model: 'iPhone 15', color: 'Blue', pta: 'Any', notes: '256 GB', website: '',
  });
  assert.throws(() => validateRequest({ model: '', pta: 'Any' }), /Requested model/);
  assert.throws(() => validateRequest({ model: 'iPhone', pta: 'PTA unknown' }), /PTA preference/);
  assert.throws(() => validateRequest({ model: 'iPhone', notes: 'a'.repeat(2001) }), /Request notes/);
});

test('unconfigured backend does not fabricate auth or successful saves', async () => {
  assert.equal(backendEnabled(), false);
  assert.equal(await getSession(), null);
  await assert.rejects(saveDevice(device), /not configured/);
});

test('public configuration rejects secret and service-role keys before initialization', async () => {
  const originalFetch = globalThis.fetch;
  try {
    globalThis.fetch = async () => ({ ok: true, json: async () => ({ supabaseUrl: 'https://example.supabase.co', supabaseKey: 'sb_secret_NEVER-PUBLIC' }) });
    await assert.rejects(loadConfig('https://example.com/shop/'), /never a secret/);
    const elevatedKey = `header.${Buffer.from(JSON.stringify({ role: 'service_role' })).toString('base64url')}.signature`;
    globalThis.fetch = async () => ({ ok: true, json: async () => ({ supabaseUrl: 'https://example.supabase.co', supabaseKey: elevatedKey }) });
    await assert.rejects(loadConfig('https://example.com/shop/'), /publishable key/);
    assert.equal(backendEnabled(), false);
  } finally { globalThis.fetch = originalFetch; }
});
