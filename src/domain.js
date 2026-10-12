export const isPublic = d => d.published && !d.archived;
export const canEnquire = d => isPublic(d) && d.availability === 'available';
export const currency = value => `PKR ${new Intl.NumberFormat('en-PK').format(value)}`;
export const escapeHTML = value => String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
export function filterDevices(devices, filters = {}) {
  const search = (filters.search || '').trim().toLowerCase();
  const visible = devices.filter(d => isPublic(d) &&
    (filters.view === 'sold' ? d.availability === 'sold' : d.availability !== 'sold') &&
    (!filters.availableOnly || d.availability === 'available') &&
    (!search || `${d.model} ${d.storage} ${d.color} ${d.pta} ${d.carrier}`.toLowerCase().includes(search)) &&
    (!filters.model || d.model === filters.model) &&
    (!filters.storage || d.storage === Number(filters.storage)) &&
    (!filters.pta || d.pta === filters.pta) &&
    (!filters.maxPrice || d.price <= Number(filters.maxPrice)) &&
    (!filters.condition || d.condition >= Number(filters.condition)));
  return visible.sort((a,b) => filters.sort === 'price-low' ? a.price-b.price : filters.sort === 'price-high' ? b.price-a.price : filters.sort === 'condition' ? b.condition-a.condition : new Date(b.createdAt)-new Date(a.createdAt));
}
export function validateDevice(d) {
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(d.id || '')) throw new Error('Choose a valid device ID.');
  if (!String(d.model || '').trim()) throw new Error('Enter a phone model.');
  if (![64,128,256,512,1024,2048].includes(Number(d.storage))) throw new Error('Choose a valid storage capacity.');
  if (!String(d.color || '').trim()) throw new Error('Enter a color.');
  if (!Number.isFinite(d.price) || d.price <= 0 || d.price > 5000000) throw new Error('Enter a valid selling price.');
  if (!Number.isFinite(d.condition) || d.condition < 0 || d.condition > 10 || d.condition*2 !== Math.round(d.condition*2)) throw new Error('Condition must be 0–10 in half points.');
  if (d.battery !== null && (!Number.isInteger(d.battery) || d.battery<0 || d.battery>100)) throw new Error('Battery health must be 0–100, or blank.');
  if (!Number.isInteger(d.checkingDays) || d.checkingDays<0 || d.checkingDays>365) throw new Error('Checking days must be 0–365.');
  if (!['available','reserved','sold'].includes(d.availability)) throw new Error('Choose a valid availability.');
  if (!['PTA approved','Non-PTA'].includes(d.pta) || !['Unlocked','JV'].includes(d.carrier)) throw new Error('Choose the correct PTA and carrier status.');
  if (!Array.isArray(d.media) || d.media.length > 11) throw new Error('Use at most ten photos and one video.');
  if (d.media.filter(m=>m.type==='video').length>1 || d.media.filter(m=>m.type==='image').length>10) throw new Error('Use at most ten photos and one video.');
  if (d.published && !d.media.some(m=>m.type==='image')) throw new Error('Add at least one actual-device photo before publishing.');
  if (d.media.length && (!Number.isInteger(d.coverIndex) || d.coverIndex<0 || d.coverIndex>=d.media.length)) throw new Error('Choose a valid cover.');
  return d;
}
export function whatsappURL(device) {
  const message = device ? `Hi Shah! I’m interested in the ${device.model}, ${device.storage} GB, ${device.color} (${currency(device.price)}). Condition ${device.condition}/10 · ${device.pta} · ${device.carrier}. Is this exact phone still available? ${new URL(`./phone.html?id=${encodeURIComponent(device.id)}`, location.href).href}` : 'Hi Shah! I’d like to ask about your current iPhone stock.';
  return `https://wa.me/923418070670?text=${encodeURIComponent(message)}`;
}
export function checkingLabel(d) { return d.checkingDays ? `${d.checkingDays}-day checking` : 'No checking period'; }
export function requestExpired(request, now = Date.now()) {
  const timestamp = new Date(request.archived ? request.updatedAt || request.createdAt : request.createdAt).getTime();
  return Number.isFinite(timestamp) && now - timestamp >= (request.archived ? 45 : 30) * 86400000;
}
export const safeMediaURL = url => {
  if (/^data:(image\/(jpeg|png|webp)|video\/(mp4|webm));base64,[A-Za-z0-9+/=]+$/.test(url || '')) return url;
  try { const parsed = new URL(url, typeof location === 'undefined' ? 'http://localhost/' : location.href); return ['http:','https:','blob:'].includes(parsed.protocol) ? url : ''; } catch { return ''; }
};
