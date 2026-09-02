const CACHE="connecta-app-v1.3.0-20260902";
const ASSETS=[
  "./",
  "./index.html",
  "./privacy.html",
  "./index.css",
  "./api-client.js",
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
  "./calming-games.js",
  "./milestones.js",
  "./basic-needs.js",
  "./journal.js",
  "./mood.js",
  "./custom-contacts.js",
  "./assets/lib/matter.min.js",
  "./app-version.json",
  "./manifest.webmanifest",
  "./assets/branding/atlas-final-logo.png",
  "./icons/favicon.ico",
  "./icons/icon.svg",
  "./icons/connecta-icon-16.png",
  "./icons/connecta-icon-32.png",
  "./icons/connecta-icon-48.png",
  "./icons/connecta-icon-72.png",
  "./icons/connecta-icon-96.png",
  "./icons/connecta-icon-128.png",
  "./icons/connecta-icon-192.png",
  "./icons/connecta-icon-256.png",
  "./icons/connecta-icon-512.png"
];
self.addEventListener("install",e=>e.waitUntil(caches.open(CACHE).then(c=>c.addAll(ASSETS))));
self.addEventListener("activate",e=>e.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k!==CACHE).map(k=>caches.delete(k))))));
self.addEventListener("fetch",e=>{
  if(e.request.method!=="GET")return;
  const url=new URL(e.request.url);
  if(url.origin!==self.location.origin)return;
  e.respondWith(caches.match(e.request).then(cached=>cached||fetch(e.request).then(resp=>{
    if(!resp.ok||resp.type!=="basic")return resp;
    const copy=resp.clone();caches.open(CACHE).then(c=>c.put(e.request,copy));return resp;
  }).catch(()=>{
    if(e.request.mode==="navigate")return caches.match("./index.html");
    return new Response('',{status:408,statusText:'Offline'});
  })));
});
