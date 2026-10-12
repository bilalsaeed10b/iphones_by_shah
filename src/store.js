import * as backend from './backend.js';
import {seedDevices, migratePreviewStock} from './seed.js';
import {validateDevice, requestExpired} from './domain.js';
export const localHost = ['localhost','127.0.0.1','[::1]'].includes(location.hostname);
let db, localState, base;
export let mode = 'preview';
export let demoAdmin = false;
export let backendError = '';
const openDB = () => new Promise((resolve,reject)=>{
  const req=indexedDB.open('shah.showroom.v1',1);
  req.onupgradeneeded=()=>req.result.createObjectStore('state');
  req.onsuccess=()=>resolve(req.result); req.onerror=()=>reject(req.error);
});
const readDB = () => new Promise((resolve,reject)=>{const req=db.transaction('state').objectStore('state').get('collection');req.onsuccess=()=>resolve(req.result);req.onerror=()=>reject(req.error);});
const persist = () => new Promise((resolve,reject)=>{const tx=db.transaction('state','readwrite');tx.objectStore('state').put(localState,'collection');tx.oncomplete=resolve;tx.onerror=()=>reject(tx.error);});
async function pruneLocalRequests(){const remaining=localState.requests.filter(r=>!requestExpired(r));if(remaining.length!==localState.requests.length){localState.requests=remaining;await persist();}}
export async function initStore(baseURL) {
  base=baseURL;
  try { await backend.loadConfig(base); if(backend.backendEnabled()){mode='live';return;} } catch(error){backendError=error.message;mode='unavailable';return;}
  if(localHost){ db=await openDB();localState=await readDB();if(!localState){localState={devices:seedDevices(base),privateDevices:[],requests:[],activity:[],seedRevision:1};await persist();}else if(migratePreviewStock(localState))await persist();await pruneLocalRequests(); }
  else localState={devices:seedDevices(base),privateDevices:[],requests:[],activity:[]};
}
export async function getDevices() { if(mode==='live')return backend.fetchPublishedDevices();if(mode==='unavailable')throw new Error(backendError);return localState.devices.filter(d=>d.published&&!d.archived); }
export async function authorised() { return mode==='live' ? backend.isAdmin() : localHost&&demoAdmin; }
export function enterDemo() { if(!localHost||mode!=='preview')throw new Error('Local preview only.');demoAdmin=true; }
export async function signIn() { return backend.signInWithGoogle(); }
export async function signOut() {demoAdmin=false;if(mode==='live')await backend.signOut();}
export async function getAdminData() { if(!await authorised())throw new Error('Owner access required.');if(mode==='live')return backend.fetchAdminData();await pruneLocalRequests();return localState; }
export async function saveDevice(d,priv) {
  validateDevice(d);if(!await authorised())throw new Error('Owner access required.');
  if(mode==='live')return backend.saveDevice(d,priv);
  const index=localState.devices.findIndex(x=>x.id===d.id);const saved={...d,createdAt:d.createdAt||new Date().toISOString(),updatedAt:new Date().toISOString()};
  if(index<0)localState.devices.unshift(saved);else localState.devices[index]=saved;
  if(priv){localState.privateDevices=localState.privateDevices.filter(x=>x.deviceId!==d.id);localState.privateDevices.push({...priv,deviceId:d.id});}
  localState.activity.unshift({id:crypto.randomUUID(),action:`${d.archived?'Archived':d.availability==='sold'?'Marked sold':'Saved'} ${d.model}`,createdAt:new Date().toISOString()});await persist();return saved;
}
export async function uploadMedia(file,id) {
  if(!await authorised())throw new Error('Owner access required.');
  if(!['image/jpeg','image/png','image/webp','video/mp4','video/webm'].includes(file.type)||file.size>25*1024*1024)throw new Error('Use JPG, PNG, WebP, MP4 or WebM, up to 25 MB.');
  if(mode==='live')return backend.uploadMedia(file,id);
  return {id:crypto.randomUUID(),type:file.type.startsWith('video')?'video':'image',url:await new Promise((resolve,reject)=>{const reader=new FileReader();reader.onload=()=>resolve(reader.result);reader.onerror=reject;reader.readAsDataURL(file);}),alt:file.name};
}
export async function submitRequest(request) {
  if(request.website)return {id:'ignored'};
  if(!request.model?.trim()||request.model.length>100||request.notes.length>2000||request.color.length>80)throw new Error('Please check the model and note lengths.');
  if(mode==='live')return backend.submitRequest(request);
  if(!localHost||mode!=='preview')throw new Error('Requests are not open yet. Please message Shah on WhatsApp.');
  await pruneLocalRequests();const record={...request,id:crypto.randomUUID(),createdAt:new Date().toISOString(),updatedAt:new Date().toISOString(),archived:false};delete record.website;localState.requests.unshift(record);await persist();return record;
}
export async function archiveRequest(id,archived) {if(!await authorised())throw new Error('Owner access required.');if(mode==='live')return backend.archiveRequest(id,archived);const item=localState.requests.find(r=>r.id===id);if(item){item.archived=archived;item.updatedAt=new Date().toISOString();}await persist();}
export async function backup() {if(!await authorised())throw new Error('Owner access required.');return mode==='live'?backend.exportBackup():{project:'iPhones by Shah',version:1,exportedAt:new Date().toISOString(),...localState};}
export async function restoreBackup(data) {
  if(mode!=='preview'||!localHost||!demoAdmin)throw new Error('Restore a live backup using the documented server procedure.');
  if(data.project!=='iPhones by Shah'||data.version!==1||!Array.isArray(data.devices)||!Array.isArray(data.requests))throw new Error('Choose a valid Shah backup.');
  data.devices.forEach(validateDevice);localState={devices:data.devices,privateDevices:data.privateDevices||[],requests:data.requests,activity:data.activity||[],seedRevision:1};await persist();
}
