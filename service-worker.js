const CACHE="atlas-app-v1.1.0-20260829";
const ASSETS=[
  "./",
  "./index.html",
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
