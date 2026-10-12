import { createClient } from '@supabase/supabase-js';
import { ownerLoginURL } from './navigation.js';

let client = null;
let config = {};

const PUBLIC_COLUMNS = 'id,model,storage,color,price,condition,battery,pta,carrier,sim,repairs,marks,includes,checking_days,checking_terms,description,availability,published,archived,featured,media,cover_index,created_at,updated_at';
const MIME_TYPES = new Map([
  ['image/jpeg', 'jpg'], ['image/png', 'png'], ['image/webp', 'webp'], ['image/avif', 'avif'],
  ['video/mp4', 'mp4'], ['video/webm', 'webm'], ['video/quicktime', 'mov'],
]);
const MAX_UPLOAD_BYTES = 25 * 1024 * 1024;
const UUID = /^[\da-f]{8}-[\da-f]{4}-[\da-f]{4}-[\da-f]{4}-[\da-f]{12}$/i;

function fail(error, context) {
  if (error) throw new Error(`${context}: ${error.message || 'The server rejected this operation.'}`);
}

function requireClient() {
  if (!client) throw new Error('Live storage is not configured. Set the Supabase URL and public key in config.json.');
  return client;
}

function text(value, maxLength, name, required = false) {
  const result = String(value ?? '').trim();
  if ((required && !result) || result.length > maxLength) throw new Error(`${name} must ${required ? 'contain 1 to' : 'be at most'} ${maxLength} characters.`);
  return result;
}

function number(value, min, max, name, nullable = false) {
  if (nullable && (value === null || value === undefined || value === '')) return null;
  const result = Number(value);
  if (!Number.isFinite(result) || result < min || result > max) throw new Error(`${name} must be between ${min} and ${max}.`);
  return result;
}

function integer(value, min, max, name) {
  const result = number(value, min, max, name);
  if (!Number.isInteger(result)) throw new Error(`${name} must be a whole number.`);
  return result;
}

function choice(value, values, name) {
  if (!values.includes(value)) throw new Error(`Choose a valid ${name}.`);
  return value;
}

function mediaURL(value) {
  const url = new URL(value);
  if (!['https:', 'http:'].includes(url.protocol)) throw new Error('Media must use an HTTP or HTTPS URL. Upload local files before publishing.');
  return url.href;
}

/** Only these fields cross the public boundary, even if an input contains private data. */
export function normalizeDevice(row) {
  return {
    id: row.id, model: row.model, storage: Number(row.storage), color: row.color,
    price: Number(row.price), condition: Number(row.condition), battery: row.battery == null ? null : Number(row.battery),
    pta: row.pta, carrier: row.carrier, sim: row.sim || '', repairs: row.repairs || '', marks: row.marks || '',
    includes: row.includes || '', checkingDays: Number(row.checking_days ?? row.checkingDays ?? 7),
    checkingTerms: row.checking_terms ?? row.checkingTerms ?? '', description: row.description || '',
    availability: row.availability, published: Boolean(row.published), archived: Boolean(row.archived),
    featured: Boolean(row.featured), media: Array.isArray(row.media) ? row.media.map(item => ({ id: item.id, type: item.type, url: item.url, alt: item.alt || '', ...(item.poster ? { poster: item.poster } : {}) })) : [],
    coverIndex: Number(row.cover_index ?? row.coverIndex ?? 0),
    createdAt: row.created_at ?? row.createdAt, updatedAt: row.updated_at ?? row.updatedAt,
  };
}

export function normalizePrivateDevice(row) {
  return {
    id: row.device_id ?? row.id, deviceId: row.device_id ?? row.deviceId ?? row.id,
    purchaseCost: (row.purchase_cost ?? row.purchaseCost) == null ? null : Number(row.purchase_cost ?? row.purchaseCost),
    serial: row.serial || '', imei: row.imei || '', inspection: row.inspection || {},
    privateNotes: row.private_notes ?? row.privateNotes ?? '', updatedAt: row.updated_at ?? row.updatedAt,
  };
}

export function toDatabaseDevice(device) {
  if (!UUID.test(device.id || '')) throw new Error('The device needs a valid UUID.');
  const condition = number(device.condition, 0, 10, 'Condition');
  if (!Number.isInteger(condition * 2)) throw new Error('Condition uses half points, such as 9 or 9.5.');
  const battery = number(device.battery, 0, 100, 'Battery health', true);
  if (battery !== null && !Number.isInteger(battery)) throw new Error('Battery health must be a whole percentage.');
  if (!Array.isArray(device.media) || device.media.length > 11) throw new Error('Add up to ten photos and one video.');
  const media = device.media.map(item => ({
    id: text(item.id, 100, 'Media ID', true),
    type: choice(item.type, ['image', 'video'], 'media type'),
    url: mediaURL(item.url), alt: text(item.alt, 250, 'Image description'),
    ...(item.poster ? { poster: mediaURL(item.poster) } : {}),
  }));
  if (media.filter(item => item.type === 'image').length > 10 || media.filter(item => item.type === 'video').length > 1) throw new Error('Add up to ten photos and one video.');
  if (device.published && !media.some(item => item.type === 'image')) throw new Error('A published phone needs at least one photo, even when the cover is a video.');
  const coverIndex = integer(device.coverIndex ?? 0, 0, Math.max(0, media.length - 1), 'Cover position');
  return {
    id: device.id, model: text(device.model, 100, 'Model', true),
    storage: integer(device.storage, 1, 4096, 'Storage'), color: text(device.color, 100, 'Color', true),
    price: number(device.price, 1, 999999999, 'Selling price'), condition, battery,
    pta: choice(device.pta, ['PTA approved', 'Non-PTA'], 'PTA status'),
    carrier: choice(device.carrier, ['Unlocked', 'JV'], 'carrier status'),
    sim: text(device.sim, 100, 'SIM type'), repairs: text(device.repairs, 1000, 'Repair history'),
    marks: text(device.marks, 1000, 'Known marks or faults'), includes: text(device.includes, 1000, 'Included items'),
    checking_days: integer(device.checkingDays ?? 7, 0, 365, 'Checking days'),
    checking_terms: text(device.checkingTerms, 2000, 'Checking terms'), description: text(device.description, 4000, 'Description'),
    availability: choice(device.availability, ['available', 'reserved', 'sold'], 'availability'),
    published: Boolean(device.published), archived: Boolean(device.archived), featured: Boolean(device.featured),
    media, cover_index: coverIndex,
  };
}

export function validateRequest(request) {
  return {
    model: text(request.model, 100, 'Requested model', true), color: text(request.color, 100, 'Color preference'),
    pta: choice(request.pta || 'Any', ['Any', 'PTA approved', 'Non-PTA'], 'PTA preference'),
    notes: text(request.notes, 2000, 'Request notes'), website: text(request.website, 200, 'Website'),
  };
}

function publicKey(value) {
  if (value.startsWith('sb_secret_')) throw new Error('Use a Supabase publishable key, never a secret or service-role key.');
  if (value.startsWith('sb_publishable_')) return value;
  try {
    const segment = value.split('.')[1];
    const claims = JSON.parse(globalThis.atob(segment.replace(/-/g, '+').replace(/_/g, '/')));
    if (claims.role === 'anon') return value;
  } catch { /* Reject unrecognized or elevated keys below. */ }
  throw new Error('config.json must contain a publishable key or the legacy anon key.');
}

export async function loadConfig(baseURL = import.meta.env?.BASE_URL || './') {
  const base = new URL(baseURL, globalThis.location?.href || 'http://localhost/');
  const response = await fetch(new URL('config.json', base), { cache: 'no-store' });
  if (!response.ok) throw new Error(`Could not load config.json (${response.status}).`);
  const next = await response.json();
  const url = String(next.supabaseUrl || '').trim();
  const key = String(next.supabaseKey || '').trim();
  client = null;
  config = next;
  if (!url && !key) return config;
  if (!url || !key) throw new Error('Both supabaseUrl and supabaseKey are required for live storage.');
  const endpoint = new URL(url);
  if (endpoint.protocol !== 'https:' && !(endpoint.protocol === 'http:' && ['localhost', '127.0.0.1'].includes(endpoint.hostname))) throw new Error('The Supabase endpoint must use HTTPS.');
  client = createClient(endpoint.href.replace(/\/$/, ''), publicKey(key), {
    auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true, flowType: 'pkce' },
  });
  return config;
}

export function backendEnabled() { return client !== null; }
export async function getSession() {
  if (!client) return null;
  const { data, error } = await client.auth.getSession();
  fail(error, 'Could not read the sign-in session');
  return data.session;
}

export async function isAdmin() {
  if (!client || !(await getSession())) return false;
  const { data, error } = await client.rpc('is_admin');
  fail(error, 'Could not verify owner access');
  return data === true;
}

export async function signInWithGoogle() {
  const supabase = requireClient();
  const redirect = ownerLoginURL(globalThis.location.href, import.meta.env?.BASE_URL || './');
  const { data, error } = await supabase.auth.signInWithOAuth({ provider: 'google', options: { redirectTo: redirect, queryParams: { prompt: 'select_account' } } });
  fail(error, 'Google sign-in failed');
  return data;
}

export async function signOut() {
  const { error } = await requireClient().auth.signOut({ scope: 'local' });
  fail(error, 'Sign-out failed');
}

export function onAuthChange(callback) {
  if (!client) return () => {};
  // Auth callbacks run while the client's auth lock is held. Schedule UI refreshes
  // after that lock is released, because they may call getSession()/isAdmin().
  const { data } = client.auth.onAuthStateChange((event, session) => { setTimeout(() => callback(event, session), 0); });
  return () => data.subscription.unsubscribe();
}

async function requireAdmin() {
  requireClient();
  if (!(await isAdmin())) throw new Error('This Google account has not been approved as the store owner.');
}

async function allRows(table, columns = '*', filter) {
  const supabase = requireClient();
  const records = [];
  const pageSize = 500;
  for (let start = 0; ; start += pageSize) {
    let query = supabase.from(table).select(columns).order(table === 'device_private' ? 'device_id' : 'id', { ascending: true }).range(start, start + pageSize - 1);
    if (filter) query = filter(query);
    const { data, error } = await query;
    fail(error, `Could not load ${table}`);
    records.push(...data);
    if (data.length < pageSize) return records;
  }
}

export async function fetchPublishedDevices() {
  const records = await allRows('devices', PUBLIC_COLUMNS, query => query.eq('published', true).eq('archived', false));
  return records.map(normalizeDevice).sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt));
}

export async function fetchAdminData() {
  await requireAdmin();
  const [devices, privateDevices, requests, activity] = await Promise.all([
    allRows('devices', PUBLIC_COLUMNS), allRows('device_private'), allRows('phone_requests'), allRows('activity_log'),
  ]);
  return {
    devices: devices.map(normalizeDevice), privateDevices: privateDevices.map(normalizePrivateDevice),
    requests: requests.map(row => ({ id: row.id, model: row.model, color: row.color, pta: row.pta, notes: row.notes, archived: row.archived, createdAt: row.created_at, updatedAt: row.updated_at })),
    activity: activity.map(row => ({ id: row.id, action: row.action, entityType: row.entity_type, entityId: row.entity_id, actorId: row.actor_id, createdAt: row.created_at })),
  };
}

export async function saveDevice(publicRecord, privateRecord) {
  await requireAdmin();
  const p_public = toDatabaseDevice(publicRecord);
  const p_private = privateRecord == null ? null : {
    purchase_cost: number(privateRecord.purchaseCost, 0, 999999999, 'Purchase cost', true),
    serial: text(privateRecord.serial, 100, 'Serial number'), imei: text(privateRecord.imei, 100, 'IMEI'),
    inspection: privateRecord.inspection || {}, private_notes: text(privateRecord.privateNotes, 4000, 'Private notes'),
  };
  const { data, error } = await client.rpc('save_device', { p_public, p_private });
  fail(error, 'Could not save the phone');
  return normalizeDevice(data);
}

/** Detaching a media item from a listing does not delete its stored object; archives remain recoverable. */
export async function uploadMedia(file, deviceId) {
  await requireAdmin();
  if (!UUID.test(deviceId)) throw new Error('Save a valid device ID before uploading.');
  if (!MIME_TYPES.has(file.type)) throw new Error('Upload JPG, PNG, WebP, AVIF, MP4, WebM or MOV files.');
  if (!file.size || file.size > MAX_UPLOAD_BYTES) throw new Error('Each upload must be smaller than 25 MB. Compress larger videos first.');
  const id = crypto.randomUUID();
  const path = `${deviceId}/${id}.${MIME_TYPES.get(file.type)}`;
  const { error } = await client.storage.from('device-media').upload(path, file, { contentType: file.type, cacheControl: '31536000', upsert: false });
  fail(error, 'Media upload failed');
  const { data } = client.storage.from('device-media').getPublicUrl(path);
  return { id, type: file.type.startsWith('video/') ? 'video' : 'image', url: data.publicUrl, alt: '' };
}

export async function submitRequest(request) {
  const values = validateRequest(request);
  const { error } = await requireClient().rpc('submit_phone_request', {
    p_model: values.model, p_color: values.color, p_pta: values.pta, p_notes: values.notes, p_website: values.website,
  });
  fail(error, 'Could not send the phone request');
  return { accepted: true };
}

export async function archiveRequest(id, archived = true) {
  await requireAdmin();
  if (!UUID.test(id)) throw new Error('Invalid request ID.');
  const { error } = await client.rpc('archive_phone_request', { p_id: id, p_archived: Boolean(archived) });
  fail(error, 'Could not update the request archive');
}

export async function exportBackup() {
  return { project: 'iPhones by Shah', version: 1, exportedAt: new Date().toISOString(), mode: 'supabase', ...(await fetchAdminData()) };
}

export const backend = {
  get enabled() { return backendEnabled(); },
  get ready() { return backendEnabled(); },
  loadConfig, getSession, isAdmin, signInWithGoogle, signOut, onAuthChange, fetchPublishedDevices,
  fetchAdminData, saveDevice, uploadMedia, submitRequest, archiveRequest, exportBackup,
};
