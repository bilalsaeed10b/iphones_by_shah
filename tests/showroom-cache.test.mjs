import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import vm from 'node:vm';
const source=await readFile(new URL('../public/showroom-sw.js',import.meta.url),'utf8');

function worker({unavailable=false,quota=false}={}){
  const events={},saved=new Map(),network=[],deleted=[];
  const cache={match:async request=>saved.get(request.url)?.clone(),put:async(request,response)=>{if(quota)throw Error('Quota');saved.set(request.url,response);}};
  const scope='https://example.com/iphones_by_shah/';
  vm.runInNewContext(source,{URL,self:{registration:{scope},addEventListener:(name,fn)=>events[name]=fn,skipWaiting:async()=>{},clients:{claim:async()=>{}}},caches:{open:async()=>{if(unavailable)throw Error('Disabled');return cache;},keys:async()=>['unrelated-cache','shah-showroom-3d-v1','shah-showroom-3d-v2'],delete:async name=>{deleted.push(name);}},fetch:async request=>{network.push(request.url);return new Response('3d bytes');}});
  return {events,network,saved,deleted,load(path,options){let response;events.fetch({request:new Request(new URL(path,scope),options),respondWith:value=>response=value});return response;}};
}

test('repeat 3D asset requests are cached under a repository path',async()=>{
  const app=worker(),path='models/optimized/iphone-18-pro-max-v2.glb';
  assert.equal(await (await app.load(path)).text(),'3d bytes');
  assert.equal(await (await app.load(path)).text(),'3d bytes');
  assert.equal(app.network.length,1);
});

test('3D caching excludes inventory, owner data, HTML, configuration, external URLs and partial requests',()=>{
  const app=worker();
  for(const path of ['config.json','stock.html','phone.html?id=1','admin.html','api/inventory','api/requests','rest/v1/private_devices','https://example.com/other/vendor/model-viewer.min.js','https://other.example.com/iphones_by_shah/models/optimized/a.glb'])assert.equal(app.load(path),undefined);
  assert.equal(app.load('models/optimized/a.glb',{method:'POST'}),undefined);
  assert.equal(app.load('models/optimized/a.glb',{headers:{Range:'bytes=0-99'}}),undefined);
  assert.equal(app.network.length,0);
});

test('disabled caches and full storage still return successfully downloaded 3D files',async()=>{
  for(const options of [{unavailable:true},{quota:true}]){
    const app=worker(options);
    assert.equal(await (await app.load('vendor/model-viewer.min.js')).text(),'3d bytes');
    assert.equal(app.saved.size,0);
  }
});

test('cache upgrade removes only obsolete showroom asset caches',async()=>{
  const app=worker();let activated;
  app.events.activate({waitUntil:value=>activated=value});await activated;
  assert.deepEqual(app.deleted,['shah-showroom-3d-v1']);
});
