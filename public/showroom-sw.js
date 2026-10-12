// Only immutable 3D assets are cached. Inventory, configuration, auth and requests stay live.
const CACHE = 'shah-showroom-3d-v2';
self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', event => event.waitUntil((async () => {
  const keys=await caches.keys();
  await Promise.all(keys.filter(key=>key.startsWith('shah-showroom-3d-')&&key!==CACHE).map(key=>caches.delete(key)));
  await self.clients.claim();
})()));
self.addEventListener('fetch', event => {
  const url=new URL(event.request.url),scope=new URL(self.registration.scope);
  if(event.request.method!=='GET'||event.request.headers.has('range')||url.origin!==scope.origin||!url.pathname.startsWith(scope.pathname))return;
  const path=url.pathname.slice(scope.pathname.length);
  if(!/^(models\/optimized\/[^/]+\.glb|vendor\/(model-viewer\.min\.js|meshopt_decoder\.js))$/.test(path))return;
  event.respondWith((async()=>{
    let cache;
    try{cache=await caches.open(CACHE);const saved=await cache.match(event.request);if(saved)return saved;}catch{}
    const response=await fetch(event.request);
    if(response.ok&&cache)try{await cache.put(event.request,response.clone());}catch{}
    return response;
  })());
});
