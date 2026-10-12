import test from 'node:test';
import assert from 'node:assert/strict';
import { filterDevices,canEnquire,validateDevice,safeMediaURL,requestExpired } from '../src/domain.js';
import {seedDevices,migratePreviewStock} from '../src/seed.js';
const devices=seedDevices('./');
test('available collection and sold archive never mix; drafts and archives stay private',()=>{
  assert.equal(filterDevices(devices).length,5);
  assert.equal(filterDevices(devices,{view:'sold'}).length,4);
  assert.equal(filterDevices(devices).some(d=>d.model==='iPhone Duo'),false);
  assert.equal(filterDevices(devices,{view:'sold'}).some(d=>d.model==='iPhone Duo'),true);
  const changed=devices.map((d,i)=>i===0?{...d,availability:'sold'}:i===1?{...d,published:false}:i===2?{...d,archived:true}:d);
  assert.equal(filterDevices(changed).length,3);
  assert.equal(filterDevices(changed,{view:'sold'}).length,4);
  assert.equal(canEnquire({...devices[0],availability:'sold'}),false);
  assert.equal(canEnquire({...devices[0],availability:'reserved'}),false);
});

test('saved preview moves only the original Duo once and preserves owner edits',()=>{
  const state={devices:seedDevices('./'),privateDevices:[{deviceId:devices[0].id,purchaseCost:80000}],requests:[{model:'iPhone 16'}],activity:[{action:'Saved phone'}]};
  state.devices[1].availability='available';
  state.devices[1].price=200000;
  state.devices[0].color='Owner edit';
  const before=structuredClone(state);
  assert.equal(migratePreviewStock(state),true);
  const expected={...before,seedRevision:1};expected.devices[1].availability='sold';
  assert.deepEqual(state,expected);
  state.devices[1].availability='available';
  assert.equal(migratePreviewStock(state),false);
  assert.equal(state.devices[1].availability,'available');
});

test('preview migration never moves a real replacement for the sample Duo',()=>{
  const state={devices:[{...devices[1],sample:false,availability:'available'}]};
  migratePreviewStock(state);
  assert.equal(state.devices[0].availability,'available');
});
test('combined search, price, storage, PTA and condition filters intersect',()=>{
  const matches=filterDevices(devices,{search:'iphone',storage:'128',pta:'PTA approved',condition:9.5,maxPrice:160000});
  assert.equal(matches.length,1);assert.equal(matches[0].color,'Pink');
  assert.equal(filterDevices(devices,{search:'no such phone'}).length,0);
  assert.equal(filterDevices(devices,{sort:'price-low'})[0].price,115000);
});
test('publish requires an actual photo; video can be the cover; checking days can be custom',()=>{
  const d={...devices[0],checkingDays:13};assert.equal(validateDevice(d).checkingDays,13);
  assert.throws(()=>validateDevice({...d,media:[]}),/at least one/);
  assert.doesNotThrow(()=>validateDevice({...d,published:false,media:[],coverIndex:0}));
  assert.doesNotThrow(()=>validateDevice({...d,media:[...d.media,{type:'video',url:'https://example.com/test.mp4'}],coverIndex:1}));
  assert.throws(()=>validateDevice({...d,condition:9.3}),/half points/);
  assert.throws(()=>validateDevice({...d,battery:101}),/Battery/);
  assert.throws(()=>validateDevice({...d,id:'bad" onclick="alert(1)'}),/device ID/);
});
test('media URLs reject executable schemes and SVG payloads',()=>{
  assert.equal(safeMediaURL('javascript:alert(1)'),'');
  assert.equal(safeMediaURL('data:image/svg+xml,<svg/>'),'');
  assert.equal(safeMediaURL('https://example.com/photo.jpg'),'https://example.com/photo.jpg');
  assert.equal(safeMediaURL('data:image/webp;base64,YWJj'),'data:image/webp;base64,YWJj');
});
test('request retention measures active age from creation and archive age from the archive action',()=>{
  const now=Date.parse('2026-10-11T00:00:00Z');
  const ago=days=>new Date(now-days*86400000).toISOString();
  assert.equal(requestExpired({createdAt:ago(30),archived:false},now),true);
  assert.equal(requestExpired({createdAt:ago(29),archived:false},now),false);
  assert.equal(requestExpired({createdAt:ago(60),updatedAt:ago(44),archived:true},now),false);
  assert.equal(requestExpired({createdAt:ago(60),updatedAt:ago(45),archived:true},now),true);
  assert.equal(requestExpired({createdAt:ago(60),updatedAt:ago(1),archived:false},now),true);
});
