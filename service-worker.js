const CACHE="connecta-app-v0.4.4-20260804";
const ASSETS=[
  "./",
  "./index.html",
  "./meeting-domain.js",
  "./meeting-ui.js",
  "./recovery-bridge-domain.js",
  "./recovery-bridge-ui.js",
  "./beta-domain.js",
  "./beta-ui.js",
  "./recovery-capital-domain.js",
  "./recovery-capital-ui.js",
  "./continuity-domain.js",
  "./continuity-ui.js",
  "./connecta-storage.js",
  "./safety-plan-domain.js",
  "./safety-plan-ui.js",
  "./app-version.json",
  "./manifest.webmanifest",
  "./assets/branding/connecta-final-logo.svg",
  "./icons/connecta-icon-32.png",
  "./icons/connecta-icon-192.png",
  "./icons/connecta-icon-512.png"
];
self.addEventListener("install",e=>e.waitUntil(caches.open(CACHE).then(c=>c.addAll(ASSETS))));
self.addEventListener("activate",e=>e.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k!==CACHE).map(k=>caches.delete(k))))));
self.addEventListener("fetch",e=>{
  if(e.request.method!=="GET")return;
  e.respondWith(caches.match(e.request).then(cached=>cached||fetch(e.request).then(resp=>{
    const copy=resp.clone();caches.open(CACHE).then(c=>c.put(e.request,copy));return resp;
  }).catch(()=>{
    if(e.request.mode==="navigate")return caches.match("./index.html");
    return new Response('',{status:408,statusText:'Offline'});
  })));
});
