(function(root,factory){
  const api = factory();
  if(typeof module === "object" && module.exports) module.exports = api;
  else root.CONNECTABeta = api;
})(typeof globalThis !== "undefined" ? globalThis : this,function(){
  "use strict";

  const PATHWAYS = ["AA","NA","ACA","SMART","Treatment","Faith","Other"];
  const TEXT_SCALES = {normal:1,large:1.2,extraLarge:1.35};

  function clean(value){
    return typeof value === "string" ? value.trim() : "";
  }

  function iso(value,label){
    const date = new Date(value);
    if(Number.isNaN(date.getTime())) throw new Error(`${label} is invalid`);
    return date.toISOString();
  }

  function contactKey(contact){
    return `${clean(contact?.name).toLowerCase()}|${clean(contact?.phone).replace(/\D/g,"")}`;
  }

  function bytesToBase64(bytes){
    let binary = "";
    for(const byte of bytes) binary += String.fromCharCode(byte);
    if(typeof btoa === "function") return btoa(binary);
    return Buffer.from(bytes).toString("base64");
  }

  function base64ToBytes(value){
    const binary = typeof atob === "function" ? atob(value) : Buffer.from(value,"base64").toString("binary");
    return Uint8Array.from(binary,char=>char.charCodeAt(0));
  }

  async function derivePinVerifier(pin,salt,iterations,cryptoApi){
    const key = await cryptoApi.subtle.importKey(
      "raw",
      new TextEncoder().encode(pin),
      "PBKDF2",
      false,
      ["deriveBits"]
    );
    const bits = await cryptoApi.subtle.deriveBits(
      {name:"PBKDF2",hash:"SHA-256",salt,iterations},
      key,
      256
    );
    return new Uint8Array(bits);
  }

  async function createPrivacyLock(pin,options = {}){
    if(!/^\d{4,8}$/.test(pin || "")) throw new Error("Privacy Lock PIN must contain four to eight digits");
    const cryptoApi = options.cryptoApi || globalThis.crypto;
    if(!cryptoApi?.subtle) throw new Error("This browser cannot create a Privacy Lock");
    const iterations = 120000;
    const salt = options.saltBytes
      ? new Uint8Array(options.saltBytes)
      : cryptoApi.getRandomValues(new Uint8Array(16));
    if(salt.length<16) throw new Error("Privacy Lock salt is invalid");
    const verifier = await derivePinVerifier(pin,salt,iterations,cryptoApi);
    return {
      schemaVersion:1,
      algorithm:"PBKDF2-SHA-256",
      iterations,
      salt:bytesToBase64(salt),
      verifier:bytesToBase64(verifier),
      createdAt:iso(options.nowIso || new Date().toISOString(),"Privacy Lock time")
    };
  }

  async function verifyPrivacyPin(pin,lock,cryptoApi = globalThis.crypto){
    if(!/^\d{4,8}$/.test(pin || "") || lock?.algorithm!=="PBKDF2-SHA-256" || !cryptoApi?.subtle) return false;
    try{
      const expected = base64ToBytes(lock.verifier);
      const actual = await derivePinVerifier(pin,base64ToBytes(lock.salt),Number(lock.iterations),cryptoApi);
      if(expected.length!==actual.length) return false;
      let difference = 0;
      for(let index=0;index<expected.length;index++) difference |= expected[index]^actual[index];
      return difference===0;
    }catch{
      return false;
    }
  }

  function buildDiagnosticReport(input = {}){
    const storage = input.storage;
    const storageCount = Number.isInteger(storage?.length)
      ? storage.length
      : Object.keys(storage && typeof storage === "object" ? storage : {}).length;
    return {
      app:"CONNECTA",
      version:clean(input.version),
      createdAt:iso(input.createdAt || new Date().toISOString(),"Diagnostic time"),
      userAgent:clean(input.userAgent),
      platform:clean(input.platform),
      online:Boolean(input.online),
      localStorageEntryCount:storageCount,
      features:{
        serviceWorker:Boolean(input.features?.serviceWorker),
        webCrypto:Boolean(input.features?.webCrypto),
        download:Boolean(input.features?.download)
      }
    };
  }

  function saveBetaProfile(existingContacts,input,nowIso = new Date().toISOString(),idFactory = ()=>crypto.randomUUID()){
    const pathways = [...new Set(Array.isArray(input?.pathways) ? input.pathways.filter(item=>PATHWAYS.includes(item)) : [])];
    const requestedScale=Number(input?.textScale);
    const textScale=Number.isFinite(requestedScale) && requestedScale>=1 && requestedScale<=1.35
      ? requestedScale
      : TEXT_SCALES[input?.textSize] || TEXT_SCALES.normal;
    const profile = {
      schemaVersion:1,
      displayName:clean(input?.displayName),
      textScale,
      pathways,
      trustedContact:{
        name:clean(input?.trustedContact?.name),
        phone:clean(input?.trustedContact?.phone)
      },
      completedAt:iso(nowIso,"Setup time")
    };
    const contacts = Array.isArray(existingContacts) ? existingContacts.map(contact=>({...contact})) : [];
    if(profile.trustedContact.name || profile.trustedContact.phone){
      const key = contactKey(profile.trustedContact);
      if(!contacts.some(contact=>contactKey(contact)===key)){
        contacts.push({
          id:idFactory(),
          name:profile.trustedContact.name || "Trusted contact",
          phone:profile.trustedContact.phone,
          note:"Trusted contact from CONNECTA setup"
        });
      }
    }
    return {profile,contacts};
  }

  return {PATHWAYS,TEXT_SCALES,saveBetaProfile,createPrivacyLock,verifyPrivacyPin,buildDiagnosticReport};
});
